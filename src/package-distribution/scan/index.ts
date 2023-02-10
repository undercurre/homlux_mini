import pageBehaviors from '../../behaviors/pageBehaviors'

Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {},

  lifetimes: {
    attached() {
      const systemSetting = wx.getSystemSetting()

      console.log('systemSetting', systemSetting)
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getQrCodeInfo(e: WechatMiniprogram.BaseEvent) {
      console.log('getQrCodeInfo', e)
    },

    toSearchSubDevice() {
      wx.redirectTo({
        url: '/package-distribution/search-subdevice/index',
      })
    },

    bindGateway() {
      wx.navigateTo({
        url: '/package-distribution/add-gateway/index',
      })
    },
  },
})
