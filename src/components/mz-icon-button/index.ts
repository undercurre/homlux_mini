import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  properties: {
    icon: {
      type: String,
      value: '',
    },
    iconActive: {
      type: String,
      value: '',
    },
    text: {
      type: String,
      value: '',
    },
    textColor: {
      type: String,
      value: '#555659',
    },
    // icon-wrapper 的长宽，rpx 为单位
    size: {
      type: Number,
      value: 96,
    },
    round: {
      type: Number,
      value: 48,
    },
    bgColor: {
      type: String,
      value: '#f7f8f9',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {
    wrapperStyle(data) {
      const { size, round, bgColor } = data
      return `width: ${size}rpx; height: ${size}rpx; border-radius: ${round}rpx; background-color: ${bgColor};`
    },
  },

  methods: {
    handleTouchStart() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
    },
    handleLongPress(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('longpress', e.detail)
    },
    handleTouchEnd(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('touchend', e.detail)
    },
  },
})
