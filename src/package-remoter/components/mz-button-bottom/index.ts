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
    value: {
      type: Object,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {},

  methods: {
    handleTouchStart() {
      // if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      this.triggerEvent('btnTouch', this.data.value)
    },
    handleLongPress(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('longpress', e.detail)
    },
    handleTouchEnd(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('touchend', e.detail)
    },
  },
})
