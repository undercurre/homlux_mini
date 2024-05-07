import { ComponentWithComputed } from 'miniprogram-computed'
import { rpx2px } from '../../utils/index'
import { runOnJS } from '../common/worklet'

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
        if (!this.data.barWidth) {
          return
        }
        // 响应外部设值，改变滑动柄位置
        const activedWidth = Math.round((this.data.barWidth / this.data.valueSpan) * (v - this.data.min))
        const btnX = activedWidth - this.data.btnOffsetX
        this.setData({ btnX })
        this.data._actived_x.value = activedWidth
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
    btnX: 0, // 滑动柄位置
    _actived_x: { value: 0 }, // 激活部分宽度
    _toast_opacity: { value: 0 },
    _toast_x: { value: 0 },
    _value: 0, // 用于内部计算的值
    bound: {}, // 滑动区域
    barWidth: 300, // 滑动条总宽度
    toastWidth: 80, // 提示宽度
    barLeft: 0, // 滑动条左边距
    _dragging: false, // 滑动柄已拖拽中（防止手势冲突）
  },

  computed: {
    formattedValue(data) {
      return data.formatter(data._value) ?? ''
    },
    /**
     * @description 因滑动柄本身的占位，造成的偏移值
     * 滑动条宽 - ${btnOffsetX} = 滑动柄横坐标
     */
    btnOffsetX(data) {
      const { isBtnInset, btnWidth } = data
      return isBtnInset ? rpx2px(btnWidth) : rpx2px(btnWidth / 2)
    },
    btnStyle(data) {
      const { btnWidth, btnHeight, barHeight } = data
      const btnTop = -barHeight / 2 - btnHeight / 2
      return `top: ${btnTop}rpx; width: ${btnWidth}rpx;`
    },
    // 值跨度
    valueSpan(data) {
      const { min, max } = data
      return max - min
    },
  },

  lifetimes: {
    attached() {
      this.data._actived_x = wx.worklet.shared(0)
      this.data._toast_opacity = wx.worklet.shared(0)
      this.data._toast_x = wx.worklet.shared(0)

      this.applyAnimatedStyle(`#active-bar--${this.data.key}`, () => {
        'worklet'
        return {
          width: `${this.data._actived_x.value}px`,
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
    ready() {
      // 修改边界
      this.createSelectorQuery()
        .select('#mz-slider')
        .boundingClientRect()
        .exec((res) => {
          // console.log('#mz-slider', res[0])
          const barWidth = res[0]?.width ?? 300
          const barLeft = res[0]?.left ?? 0
          const _value = this.widthToValue(barWidth)
          const btnX = _value - this.data.btnOffsetX
          const left = this.data.isBtnInset ? 0 : -this.data.btnOffsetX
          const right = barWidth - this.data.btnOffsetX
          this.setData({
            barWidth,
            barLeft,
            btnX,
            bound: {
              top: 0,
              left,
              right,
              bottom: 0,
            },
          })

          this.data._actived_x.value = _value
        })
      if (this.data.showToast) {
        this.createSelectorQuery()
          .select(`#slider-toast--${this.data.key}`)
          .boundingClientRect()
          .exec((res) => {
            console.log(`#slider-toast--${this.data.key}`, res[0])
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
    handleSlider(pageX: number) {
      if (this.data._dragging) return
      // console.log('[handleSlider]', e)
      const activedWidth = Math.min(this.data.barWidth, Math.max(this.data.btnOffsetX, pageX - this.data.barLeft))
      const btnX = activedWidth - this.data.btnOffsetX
      const _value = this.widthToValue(activedWidth)
      this.setData({ btnX, _value })
      this.data._actived_x.value = activedWidth
      if (this.data.showToast) {
        this.data._toast_opacity.value = 1
        this.data._toast_x.value = activedWidth - this.data.toastWidth / 2
      }
    },
    // 直接点击滑动条
    sliderStart(e: WechatMiniprogram.TouchEvent) {
      this.handleSlider(e.changedTouches[0].pageX)
    },
    // 直接点击滑动条后拖动
    sliderMove(e: WechatMiniprogram.TouchEvent) {
      this.handleSlider(e.changedTouches[0].pageX)
    },
    sliderEnd() {
      if (this.data.showToast && this.data._toast_opacity.value) {
        this.data._toast_opacity.value = 0
      }
    },
    dragEnd(e: { detail: { x: number } }) {
      'worklet'
      // console.log('[dragEnd]', e)
      runOnJS(this.setData.bind(this))({
        _dragging: false,
      })
      const activedWidth = e.detail.x + this.data.btnOffsetX
      if (this.data.showToast) {
        this.data._toast_opacity.value = 0
      }
      const _value = this.widthToValue(activedWidth)
      runOnJS(this.triggerEvent.bind(this))('slideEnd', _value)
    },
    dragBegin(e: { detail: { x: number } }) {
      'worklet'
      // console.log('[dragBegin]', e)
      runOnJS(this.setData.bind(this))({
        _dragging: true,
      })
      const activedWidth = e.detail.x + this.data.btnOffsetX
      this.data._actived_x.value = activedWidth
      if (this.data.showToast) {
        this.data._toast_opacity.value = 1
        this.data._toast_x.value = activedWidth - this.data.toastWidth / 2
        const _value = this.widthToValue(activedWidth)
        runOnJS(this.setData.bind(this))({
          _value,
        })
      }
      // this.triggerEvent('slideStart', this.data.value)
    },
    // TODO 节流setData；滑球偏移的问题
    dragMove(e: { detail: number[] }) {
      'worklet'
      const activedWidth = e.detail[2] + this.data.btnOffsetX
      this.data._actived_x.value = activedWidth
      if (this.data.showToast) {
        this.data._toast_x.value = activedWidth - this.data.toastWidth / 2
        const _value = this.widthToValue(activedWidth)
        runOnJS(this.setData.bind(this))({
          _value,
        })
      }
    },
    // 计算激活部分，宽度->值
    widthToValue(w: number) {
      const { barWidth, min, valueSpan } = this.data
      return Math.round((w / barWidth) * valueSpan) + min
    },
  },
})
