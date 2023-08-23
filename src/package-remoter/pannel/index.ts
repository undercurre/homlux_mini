import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceConfig, mfIdToType } from '../../config/remoter'

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
    async onLoad(query: { mfId: string }) {
      const { mfId } = query
      console.log({ mfId })
      const deviceType = mfIdToType[mfId]
      this.setData({
        device: { ...deviceConfig[deviceType] },
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
