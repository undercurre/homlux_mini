import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    /** 展示类型：light switch scene */
    linkType: {
      type: String,
    },
  },

  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('confirm', e.currentTarget.dataset.type)
    },
    black() {},
  },
})
