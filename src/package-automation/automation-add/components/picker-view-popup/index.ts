import { ComponentWithComputed } from 'miniprogram-computed'
import { scenePropertyOptions } from '../../../../config/index'
ComponentWithComputed({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    dataInfo: {
      type: Object,
      observer(value) {
        if (typeof value === 'object') {
          if (Object.keys(value).length == 0) {
            this.setData({
              value: [0],
            })
          } else {
            const tempValue = scenePropertyOptions[value.propertyKey as keyof typeof scenePropertyOptions].findIndex(
              (item) => item.value === value.value,
            )
            if (tempValue < 0) {
              this.setData({
                value: [0],
              })
            } else {
              this.setData({
                value: [tempValue],
              })
            }
          }
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    value: [0],
  },
  computed: {
    dataList(data) {
      if (Object.keys(data.dataInfo).length == 0) return []
      return scenePropertyOptions[data.dataInfo.propertyKey as keyof typeof scenePropertyOptions].map(
        (item) => item.title,
      )
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
      this.triggerEvent('confirm', this.data.dataInfo)
    },
    handleCancel() {
      this.triggerEvent('cancel')
    },
    valueChange(e: { detail: number[] }) {
      const valueInfo =
        scenePropertyOptions[this.data.dataInfo.propertyKey as keyof typeof scenePropertyOptions][e.detail[0]]

      this.setData({
        'dataInfo.value': valueInfo.value,
        'dataInfo.optionTitle': valueInfo.title,
      })
    },
    blank() {},
  },
})
