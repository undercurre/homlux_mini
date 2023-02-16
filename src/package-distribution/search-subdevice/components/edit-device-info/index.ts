// package-distribution/search-subdevice/components/edit-device-info/index.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    deviceName: {
      type: String,
      value: '',
    },
    roomId: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    deviceInfo: {},
  },

  /**
   * 组件的方法列表
   */
  methods: {
    change(event: WechatMiniprogram.CustomEvent) {
      console.log('edit-device-info-change', event)
      this.data.deviceInfo = event.detail
    },
    close() {
      this.triggerEvent('close')
    },
    confirm() {
      this.triggerEvent('confirm', this.data.deviceInfo)
    },
  },
})
