// package-mine/device-manage/device-detail/components/setting-gateway/index.ts
Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    deviceInfo: {
      type: Object,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    backup: false,
    resetting: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleBackup() {
      if (!this.data.deviceInfo.onLineStatus) {
        return
      }
      this.setData({
        backup: true,
      })
      setTimeout(() => {
        this.setData({
          backup: false,
        })
      }, 3000)
    },
    handleReset() {
      if (!this.data.deviceInfo.onLineStatus) {
        return
      }
      this.setData({
        resetting: true,
      })
      setTimeout(() => {
        this.setData({
          resetting: false,
        })
      }, 3000)
    },
  },
})
