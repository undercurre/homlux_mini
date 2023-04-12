export default Behavior({
  behaviors: [],
  properties: {},
  data: {},
  methods: {
    /**
     * 返回方法
     */
    goBack: function () {
      const pages = getCurrentPages()

      if (pages.length <= 1) {
        wx.switchTab({
          url: '/pages/index/index',
        })
      } else {
        wx.navigateBack()
      }
    },
    /**
     * 跳转到
     */
    goTo(e: WechatMiniprogram.TouchEvent) {
      wx.navigateTo({ url: e.currentTarget.dataset.url })
    },
    /**
     * 全局分享小程序
     */
    onShareAppMessage() {
      return {
        title: '欢迎使用美的照明Homlux',
        path: '/pages/index',
      }
    },
    onShareTimeline() {
      return {
        title: '欢迎使用美的照明Homlux',
        path: '/pages/index',
      }
    },
  },
})
