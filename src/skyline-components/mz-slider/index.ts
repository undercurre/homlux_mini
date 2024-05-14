import { ComponentWithComputed } from 'miniprogram-computed'
import { delay, isNotExist, rpx2px, throttle } from '../../utils/index'

ComponentWithComputed({
  externalClasses: ['custom-class'],
  options: {
    multipleSlots: true,
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    disabled: Boolean,
    useButtonSlot: Boolean,
    activeColor: String,
    inactiveColor: String,
    key: String,
    // 滑条实时值（%）
    value: {
      type: Number,
      value: 1,
      observer(v) {
        // 若初始化未完成 || 设值相同，则跳过，以免循环响应
        if (!this.data.barWidth || v === this.data.innerVal || isNotExist(this.data.valueSpan)) {
          return
        }
        console.log('observer v:', v, '->', this.data.innerVal)

        // 响应外部设值，改变滑动柄位置
        const activedWidth = Math.round((this.data.barWidth / this.data.valueSpan) * (v - this.data.min))
        const innerVal = this.widthToValue(activedWidth)
        this.setData({ innerVal })
        this.data._actived_x.value = activedWidth
        this.data._btn_x.value = this.data.btnX
      },
    },
    // 按钮是否在滑条容器内
    isBtnInset: {
      type: Boolean,
      value: true,
    },
    // 是否显示拖动提示
    showToast: {
      type: Boolean,
      value: false,
    },
    barHeight: {
      type: Number,
      value: 80,
    },
    btnWidth: {
      type: Number,
      value: 72,
    },
    btnHeight: {
      type: Number,
      value: 72,
    },
    min: {
      type: Number,
      value: 0,
    },
    max: {
      type: Number,
      value: 100,
    },
    step: {
      type: Number,
      value: 1,
    },
    // 触发拖拽事件时的节流时间
    throttleTime: {
      type: Number,
      value: 150,
    },
    /**
     * @description toast内容格式化器
     * @default 默认显示百分比
     */
    formatter: {
      type: null,
      value: (data: string | number) => `${data}%`,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    _actived_x: { value: 0 }, // 激活部分宽度
    _btn_x: { value: 0 }, // 按钮位置
    _toast_opacity: { value: 0 },
    _toast_x: { value: 0 },
    innerVal: 0, // 用于内部计算的值
    bound: { left: 0, right: 0 }, // 滑动区域
    barWidth: 300, // 滑动条总宽度
    toastWidth: 80, // 提示宽度
    barLeft: 0, // 滑动条左边距
    timeout_timer: null as null | number, // 节流定时器
  },

  computed: {
    formattedValue(data) {
      return data.formatter(data.innerVal) ?? ''
    },
    btnWidthPx(data) {
      return rpx2px(data.btnWidth)
    },
    // 按钮初始样式
    btnStyle(data) {
      const { btnWidth, barHeight, btnHeight } = data
      const btnTop = barHeight / 2 - btnHeight / 2
      return `left: 0rpx; top: ${btnTop}rpx; width: ${btnWidth}rpx; height: ${btnHeight}rpx`
    },
    // 值跨度
    valueSpan(data) {
      const { min, max } = data
      return max - min
    },
    // 可用的滑动条宽度（activedWidth范围）
    availableBarWidth(data) {
      const { barWidth, isBtnInset, btnWidthPx } = data
      if (!barWidth) return 0
      return isBtnInset ? barWidth - btnWidthPx : barWidth
    },
    // 根据innerVal，自动转换的对应宽度
    v2w(data) {
      const { availableBarWidth, valueSpan, innerVal, min } = data
      return Math.round((availableBarWidth / valueSpan) * (innerVal - min))
    },
    // 计算按钮位置偏移后的激活态宽度
    activedWidth(data) {
      const { isBtnInset, v2w, btnWidthPx } = data
      return isBtnInset ? v2w + btnWidthPx : v2w
    },
    // 计算按钮X轴位置
    btnX(data) {
      const { isBtnInset, v2w, btnWidthPx } = data
      return isBtnInset ? v2w : v2w - btnWidthPx / 2
    },
    // 计算提示X轴位置
    toastX(data) {
      const { activedWidth, toastWidth } = data
      return activedWidth - toastWidth / 2
    },
  },

  lifetimes: {
    attached() {
      this.data._actived_x = wx.worklet.shared(0)
      this.data._btn_x = wx.worklet.shared(0)
      this.data._toast_opacity = wx.worklet.shared(0)
      this.data._toast_x = wx.worklet.shared(0)

      // 滑条激活部分
      this.applyAnimatedStyle(`#active-bar--${this.data.key}`, () => {
        'worklet'
        return {
          width: `${this.data._actived_x.value}px`,
        }
      })
      // 滑动按钮
      this.applyAnimatedStyle(`#handler--${this.data.key}`, () => {
        'worklet'
        return {
          transform: `translateX(${this.data._btn_x.value}px)`,
        }
      })

      if (this.data.showToast) {
        this.applyAnimatedStyle(`#slider-toast--${this.data.key}`, () => {
          'worklet'
          return {
            opacity: this.data._toast_opacity.value,
            transform: `translateX(${this.data._toast_x.value}px)`,
          }
        })
      }
    },
    async ready() {
      await delay(150) // 延迟检索元素，防取值失败
      this.createSelectorQuery()
        .select('#mz-slider')
        .boundingClientRect()
        .exec((res) => {
          const { isBtnInset, btnWidthPx, value } = this.data
          const barWidth = res[0]?.width ?? 300
          const barLeft = res[0]?.left ?? 0
          const left = isBtnInset ? btnWidthPx : 0
          const right = barWidth
          this.setData({
            innerVal: value,
            barWidth,
            barLeft,
            bound: {
              left,
              right,
            },
          })

          this.data._actived_x.value = this.data.activedWidth
          this.data._btn_x.value = this.data.btnX
        })
      if (this.data.showToast) {
        this.createSelectorQuery()
          .select(`#slider-toast--${this.data.key}`)
          .boundingClientRect()
          .exec((res) => {
            // console.log(`#slider-toast--${this.data.key}`, res[0])
            const toastWidth = res[0]?.width ?? 80
            this.setData({ toastWidth })
          })
      }
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    // 节流触发移动事件
    handleSliderThrottle: throttle(function (this: IAnyObject, pageX: number) {
      const clickX = Math.min(this.data.bound.right, Math.max(this.data.bound.left, pageX - this.data.barLeft))

      const innerVal = this.widthToValue(clickX)
      this.setData({ innerVal })
      this.data._actived_x.value = this.data.activedWidth
      this.data._btn_x.value = this.data.btnX
      if (this.data.showToast) {
        this.data._toast_x.value = this.data.toastX
      }
      this.triggerEvent('slideChange', innerVal)
      console.log('[handleSlider]slideChange', innerVal)
    }, 150),
    // 直接点击滑动条
    sliderStart(e: WechatMiniprogram.TouchEvent) {
      if (this.data.showToast) {
        this.data._toast_opacity.value = 1
      }
      this.handleSliderThrottle(e.changedTouches[0].pageX)
    },
    // 直接点击滑动条后拖动
    sliderMove(e: WechatMiniprogram.TouchEvent) {
      this.handleSliderThrottle(e.changedTouches[0].pageX)
    },
    sliderEnd(e: WechatMiniprogram.TouchEvent) {
      if (this.data.showToast) {
        this.data._toast_opacity.value = 0
      }
      const clickX = Math.min(
        this.data.bound.right,
        Math.max(this.data.bound.left, e.changedTouches[0].pageX - this.data.barLeft),
      )
      const innerVal = this.widthToValue(clickX)
      this.setData({ innerVal })
      this.data._actived_x.value = this.data.activedWidth
      this.data._btn_x.value = this.data.btnX

      this.triggerEvent('slideEnd', innerVal)
    },
    // 计算激活部分，宽度->值
    widthToValue(w: number) {
      const { availableBarWidth, min, valueSpan, step, isBtnInset, btnWidthPx } = this.data
      const _w = isBtnInset ? w - btnWidthPx : w
      return Math.round(((_w / availableBarWidth) * valueSpan) / step) * step + min
    },
  },
})
