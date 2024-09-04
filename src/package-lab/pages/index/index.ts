import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
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
