import { ComponentWithComputed } from 'miniprogram-computed'
import { maxColorTempK, minColorTempK } from '../../../config/index'

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
          if (this.data.lightInfo.OnOff) {
            this.setData({
              OnOff: this.data.lightInfo.OnOff,
              Level: this.data.lightInfo.Level,
              ColorTemp: this.data.lightInfo.ColorTemp,
            })
          } else {
            this.setData({
              OnOff: this.data.lightInfo.OnOff,
            })
          }
        }
      },
    },
    lightInfo: {
      type: Object,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    OnOff: 0,
    Level: 0,
    ColorTemp: 0,
  },

  computed: {
    levelShow(data) {
      return data.Level
    },
    colorTempShow(data) {
      return (data.ColorTemp / 100) * (maxColorTempK - minColorTempK) + minColorTempK
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent(
        'confirm',
        this.data.OnOff
          ? {
              OnOff: this.data.OnOff,
              Level: this.data.Level,
              ColorTemp: this.data.ColorTemp,
            }
          : {
              OnOff: this.data.OnOff,
            },
      )
    },
    handleOnOffChange(e: WechatMiniprogram.TouchEvent) {
      this.setData({
        OnOff: e.currentTarget.dataset.value,
      })
    },
    handleLevelDrag(e: { detail: { value: number } }) {
      this.setData({
        Level: e.detail.value,
      })
    },
    handleLevelChange(e: { detail: number }) {
      this.setData({
        Level: e.detail,
      })
    },
    handleColorTempChange(e: { detail: number }) {
      this.setData({
        ColorTemp: e.detail,
      })
    },
    handleColorTempDrag(e: { detail: { value: number } }) {
      this.setData({
        ColorTemp: e.detail.value,
      })
    },
  },
})
