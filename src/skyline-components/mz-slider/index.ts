import { ComponentWithComputed } from 'miniprogram-computed'
import { isNullOrUnDef } from '../../utils/index'

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
    value: {
      type: Number,
      value: 1,
    },
    barHeight: {
      type: Number,
      value: 80,
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
    _x: { value: 0 },
    isBtnInset: true,
    showToast: false,
  },

  computed: {
    formattedValue(data) {
      return data.formatter(data.value) ?? ''
    },
  },

  lifetimes: {
    attached() {
      // 将 dataset 数据传到组件变量中
      const diffData = {
        btnTop: this.data.barHeight / 2 - this.data.btnHeight / 2 + 'rpx',
      } as IAnyObject

      if (!isNullOrUnDef(this.dataset.isBtnInset)) {
        diffData.isBtnInset = this.dataset.isBtnInset
      }
      if (!isNullOrUnDef(this.dataset.showToast)) {
        diffData.showToast = this.dataset.showToast
      }

      this.setData(diffData)

      this.data._x = wx.worklet.shared(0)

      this.applyAnimatedStyle(`#active-bar--${this.data.key}`, () => {
        'worklet'
        return {
          width: `${this.data._x.value}px`,
        }
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    valueChange(e: { value: number }) {
      this.setData({
        value: e.value,
      })
      this.triggerEvent('slideChange', this.data.value)
    },
    handleEnd(e: { value: number }) {
      this.setData({
        value: e.value,
      })
      this.triggerEvent('slideEnd', this.data.value)
    },
    touchstart(e: { value: number }) {
      this.setData({
        value: e.value,
      })
      this.triggerEvent('slideStart', this.data.value)
    },
    dragMove(e: { detail: number[] }) {
      'worklet'
      console.log('dragMove', e.detail[2])
      this.data._x.value = e.detail[2]
    },
  },
})
