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

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  methods: {
    async onLoad(query: { deviceType: string, deviceModel: string }) {
      const { deviceType, deviceModel } = query
      console.log({ deviceType, deviceModel })
      this.setData({
        device: { ...deviceConfig[deviceType][deviceModel] },
      })
    },

    upTap(e: WechatMiniprogram.TouchEvent) {
      console.log('upTap', e.target.dataset.key)
    },

    toSetting() {
      wx.navigateTo({
        url: '/package-remoter/setting/index',
      })
    },
  },
})
