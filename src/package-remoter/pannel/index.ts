import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceConfig } from '../../config/remoter'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    device: {} as IAnyObject,
  },

  computed: {},

  methods: {
    async onLoad(query: { deviceType: string; deviceModel: string; deviceId: string }) {
      const { deviceType, deviceModel, deviceId } = query
      this.setData({
        device: { ...deviceConfig[deviceType][deviceModel], deviceType, deviceModel, deviceId },
      })
    },

    upTap(e: WechatMiniprogram.TouchEvent) {
      console.log('upTap', e.target.dataset.key)
    },

    toSetting() {
      const { deviceType, deviceModel, deviceId } = this.data.device
      wx.navigateTo({
        url: `/package-remoter/setting/index?deviceType=${deviceType}&deviceModel=${deviceModel}&deviceId=${deviceId}`,
      })
    },
  },
})
