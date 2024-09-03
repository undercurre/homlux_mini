import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'

ComponentWithComputed({
  behaviors: [pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    urls: {},
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
