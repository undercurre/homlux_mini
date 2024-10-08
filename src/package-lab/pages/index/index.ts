import pageBehaviors from '../../../behaviors/pageBehaviors'

Component({
  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    urls: {},
  },

  methods: {
    toPage(e: WechatMiniprogram.TouchEvent<never, never, { url: string }>) {
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      })
    },
  },
})
