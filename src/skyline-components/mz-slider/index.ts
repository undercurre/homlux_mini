import { ComponentWithComputed } from 'miniprogram-computed'
import { rpx2px } from '../../utils/index'

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
    // 滑条取值（%）
    value: {
      type: Number,
      value: 1,
      observer(v) {
        if (this.data.barWidth) {
          const _width = Math.round((this.data.barWidth / 100) * v)
          const initX = _width + this.data.btnOffsetX
          this.data._x.value = _width // TODO 加上动画
          this.setData({ initX, showValue: v })
        }
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
    initX: 0,
    _x: { value: 0 },
    _toast_opacity: { value: 0 },
    _toast_x: { value: 0 },
    showValue: 0,
    bound: {},
    barWidth: 100,
  },

  computed: {
    formattedValue(data) {
      return data.formatter(data.showValue) ?? ''
    },
    btnOffsetX(data) {
      const { isBtnInset } = data
      return isBtnInset ? -rpx2px(data.btnWidth) : -rpx2px(data.btnWidth / 2)
    },
    btnStyle(data) {
      const { btnWidth, btnHeight, barHeight } = data
      const btnTop = -barHeight / 2 - btnHeight / 2
      return `top: ${btnTop}rpx; width: ${btnWidth}rpx;`
    },
  },

  lifetimes: {
    attached() {
      const diffData = {
        initX: this.data.btnOffsetX,
      } as IAnyObject

      this.setData(diffData)

      this.data._x = wx.worklet.shared(this.data.btnOffsetX)
      this.data._toast_opacity = wx.worklet.shared(0)
      this.data._toast_x = wx.worklet.shared(0)

      this.applyAnimatedStyle(`#active-bar--${this.data.key}`, () => {
        'worklet'
        return {
          width: `${this.data._x.value}px`,
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
          const barWidth = res[0]?.width ?? 100
          const initX = Math.round((barWidth / 100) * this.data.value) + this.data.btnOffsetX
          const left = this.data.isBtnInset ? 0 : this.data.btnOffsetX
          const right = barWidth + this.data.btnOffsetX
          this.setData({
            barWidth,
            initX,
            bound: {
              top: 0,
              left,
              right,
              bottom: 0,
            },
          })

          this.data._x.value = initX - this.data.btnOffsetX
        })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    // TODO
    valueChange(e: { value: number }) {
      this.setData({
        showValue: e.value,
      })
      this.triggerEvent('slideChange', this.data.value)
    },
    dragEnd(e: { detail: { x: number } }) {
      'worklet'
      console.log('dragBegin', e)
      this.setData({
        showValue: Math.round((e.detail.x / this.data.barWidth) * 100),
      })
      if (this.data.showToast) {
        this.data._toast_opacity.value = 0
      }
      // this.triggerEvent('slideEnd', this.data.value)
    },
    dragBegin(e: { detail: { x: number } }) {
      'worklet'
      console.log('dragBegin', e)
      if (this.data.showToast) {
        this.data._toast_opacity.value = 1
        this.data._toast_x.value = e.detail.x
      }
      // TODO 节流setData
      // this.triggerEvent('slideStart', this.data.value)
    },
    dragMove(e: { detail: number[] }) {
      'worklet'
      // console.log('dragMove', e.detail[2])
      this.data._x.value = e.detail[2] - this.data.btnOffsetX
      if (this.data.showToast) {
        this.data._toast_opacity.value = 1
        this.data._toast_x.value = e.detail[2]
      }
    },
  },
})
