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
        console.log('dataInfo,', value, typeof value)

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
    // value: {
    //   type: Array,
    //   value: [0],
    // },
    showCancel: {
      type: Boolean,
      value: true,
    },
    cancelText: {
      type: String,
      value: '取消',
    },
    showConfirm: {
      type: Boolean,
      value: true,
    },
    confirmText: {
      type: String,
      value: '确定',
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
    // value(data) {
    //   console.log('wwwwwww', data.dataInfo)

    //   if (Object.keys(data.dataInfo).length == 0) return [0]
    //   const tempValue = scenePropertyOptions[data.dataInfo.propertyKey as keyof typeof scenePropertyOptions].findIndex(
    //     (item) => item.value === data.dataInfo.value,
    //   )
    //   console.log('wwwwwww222', tempValue)
    //   if (tempValue < 0) {
    //     return [0]
    //   } else {
    //     return [tempValue]
    //   }
    // },
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
