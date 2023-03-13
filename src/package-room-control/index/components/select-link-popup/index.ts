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
      observer(val) {
        if (val) {
          this.setData({
            linkTypeInner: this.data.linkType,
          })
        }
      },
    },
    /** 展示类型：light switch scene */
    linkType: {
      type: String,
    },
  },

  data: {
    linkTypeInner: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm', this.data.linkTypeInner)
    },
    handleTypeSelect(e: WechatMiniprogram.TouchEvent) {
      console.log(e)
      this.setData({
        linkTypeInner: e.currentTarget.dataset.type,
      })
    },
    black() {},
  },
})
