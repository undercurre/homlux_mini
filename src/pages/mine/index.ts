// pages/mine/index.ts
Page({
  /**
   * 页面的初始数据
   */
  data: {
    managerList: [
      {
        icon: '/assets/img/mine/home.png',
        text: '家庭管理',
      },
      {
        icon: '/assets/img/mine/device.png',
        text: '设备管理',
      },
      {
        icon: '/assets/img/mine/member.png',
        text: '成员管理',
      },
    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1,
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
})
