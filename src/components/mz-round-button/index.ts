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
      value: '',
    },
    textWidth: {
      type: String,
      value: '80rpx',
    },
    // icon-wrapper 的长宽，rpx 为单位
    size: {
      type: Number,
      value: 48,
    },
    btnStyle: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {
    wrapperStyle(data) {
      const { size } = data
      return `width: ${size}rpx; height: ${size}rpx;`
    },
  },

  methods: {
    handleTouchStart(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('touchstart', e)
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
