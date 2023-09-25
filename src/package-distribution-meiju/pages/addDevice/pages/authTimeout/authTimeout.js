// addDevice//pages/authTimeout/authTimeout.js
const app = getApp()
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
Page({
  behaviors: [getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    brand: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().onLoadCheckingLog()
    this.data.brand = app.globalData.brand
    this.setData({
      brand: this.data.brand,
    })
    // if (this.data.brand == 'meiju') {
    //   wx.setNavigationBarColor({
    //     frontColor: '#000000',
    //     backgroundColor: '#ffffff',
    //   })
    // } else if (this.data.brand == 'colmo') {
    //   wx.setNavigationBarColor({
    //     frontColor: '#ffffff',
    //     backgroundColor: '#1A1A1F',
    //   })
    // }
    this.getLoginStatus().then(() => {
      if (app.globalData.isLogon) {
        this.checkFamilyPermission()
      } else {
        this.navToLogin()
      }
    })
  },
  getLoginStatus() {
    return app
      .checkGlobalExpiration()
      .then(() => {
        this.setData({
          isLogon: app.globalData.isLogon,
        })
      })
      .catch(() => {
        app.globalData.isLogon = false
        this.setData({
          isLogin: app.globalData.isLogon,
        })
      })
  },
  retry() {
    wx.redirectTo({
      url: '/distribution-network/addDevice/pages/afterCheck/afterCheck?backTo=/pages/index/index',
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    getApp().onUnloadCheckingLog()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},
})
