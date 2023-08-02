import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  properties: {
    img: {
      type: String,
      value: '',
    },
    imgActive: {
      type: String,
      value: '',
    },
    imgWidth: {
      type: String,
      value: '304rpx',
    },
    imgHeight: {
      type: String,
      value: '112rpx',
    },
    type: {
      type: String,
      value: 'custom',
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  computed: {
    computedStyle(data) {
      return `
        width: ${data.imgWidth};
        height: ${data.imgHeight};
      `
    }
  },

  methods: {
    handleTouchStart(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('touchstart', e)
    },
    handleLongPress(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('longpress', e.detail)
    },
    handleTouchEnd(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('touchend', e.detail)
    }
  },
})
