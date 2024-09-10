import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'

ComponentWithComputed({
  behaviors: [pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    urls: {
      voiceControl: '/package-mine/voice-control/index',
      thirdParty: '/package-auth/pages/third-party/index',
      platform: '/package-auth/pages/platform/index',
    },
  },

  computed: {},

  pageLifetimes: {
    async show() {},
  },

  methods: {
    toPage(e: WechatMiniprogram.TouchEvent<never, never, { url: string }>) {
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      })
    },
  },
})
