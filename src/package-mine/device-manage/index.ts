// package-mine/device-manage/index.ts
Page({
  /**
   * 页面的初始数据
   */
  data: {
    listHeight: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.createSelectorQuery()
      .select('#listWrapper')
      .boundingClientRect()
      .exec((res) => {
        if (res[0] && res[0].height) {
          this.setData({
            listHeight: res[0].height
          })
        }
      })
  },

  back() {
    wx.navigateBack()
  },
})
