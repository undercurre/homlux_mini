import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
    },
    show: {
      type: Boolean,
      observer(value) {
        if (value) {
          this.setData({
            OnOff: this.data.switchInfo.OnOff,
            top: this.data.switchInfo.OnOff ? 0 : 120,
          })
        }
      },
    },
    switchInfo: {
      type: Object,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    OnOff: 0,
    top: 0,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm', { OnOff: this.data.OnOff })
    },
    handleOnOffChange(e: WechatMiniprogram.TouchEvent) {
      if (e.currentTarget.dataset.value === this.data.OnOff) {
        return
      }
      this.setData({
        OnOff: e.currentTarget.dataset.value,
      })
      this.animate(
        '#slider',
        [
          {
            top: this.data.OnOff ? '120rpx' : '0',
          },
          {
            top: this.data.OnOff ? '0' : '120rpx',
          },
        ],
        100,
      )
    },
  },
})
