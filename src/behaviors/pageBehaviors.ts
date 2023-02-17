export default Behavior({
  behaviors: [],
  properties: {},
  data: {
    test: '',
  },
  methods: {
    /**
     * 返回方法
     */
    goBack: function () {
      const pages = getCurrentPages()

      console.log('goBack', pages.length)
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
