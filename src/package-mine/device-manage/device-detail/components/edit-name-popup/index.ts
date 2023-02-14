// package-mine/device-manage/components/edit-name-popup/index.ts
Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    value: {
      type: String,
    },
    show: {
      type: Boolean,
      observer(value) {
        if (value) {
          this.setData({
            deviceName: this.data.value,
          })
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    deviceName: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm', this.data.deviceName)
    },
  },
})
