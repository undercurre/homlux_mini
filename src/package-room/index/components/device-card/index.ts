// package-room/index/components/device-card/index.ts
Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    isSelect: {
      type: Boolean,
      value: false,
    },
    deviceInfo: {
      type: Object,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap() {
      if (this.data.deviceInfo.isOnline) {
        this.triggerEvent('cardTap', this.data.deviceInfo)
      }
    },
    handlePowerTap() {
      if (this.data.deviceInfo.isOnline) {
        this.triggerEvent('powerTap', this.data.deviceInfo)
      }
    },
  },
})
