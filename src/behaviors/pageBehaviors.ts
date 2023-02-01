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
      wx.navigateBack()
    },
  },
})
