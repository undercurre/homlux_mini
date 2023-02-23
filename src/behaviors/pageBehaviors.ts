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
  },
})
