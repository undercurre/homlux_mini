// addDevice//pages/notFound/notFound.js
const app = getApp()
const addDeviceMixin = require('../assets/js/addDeviceMixin')
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
import { burialPoint } from './assets/js/burialPoint'
import { creatDeviceSessionId } from '../../../../utils/util'
import paths from '../../../../utils/paths'
Page({
  behaviors: [addDeviceMixin, getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    deviceName: '空调',
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().onLoadCheckingLog()

    let { type, sn8, blueVersion, moduleType, deviceName } = app.addDeviceInfo
    this.setData({
      deviceName: deviceName,
    })
    this.getLoginStatus().then(() => {
      if (app.globalData.isLogon) {
        this.checkFamilyPermission()
      } else {
        this.navToLogin()
      }
    })
    burialPoint.noFoundView({
      deviceSessionId: app.globalData.deviceSessionId,
      moduleType: moduleType,
      type: type,
      sn8: sn8,
      moduleVison: blueVersion,
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
  //跳转反馈
  feedback() {
    wx.navigateTo({
      url: paths.feedback,
    })
  },
  getAddDeviceInfo() {
    if (!wx.getStorageSync('addDeviceInfo')) return
    return wx.getStorageSync('addDeviceInfo')
  },
  retry() {
    app.globalData.deviceSessionId = creatDeviceSessionId(app.globalData.userData.uid)
    burialPoint.clickRetry({
      deviceSessionId: app.globalData.deviceSessionId,
      moduleType: app.globalData.moduleType,
      type: app.globalData.type,
      sn8: app.globalData.sn8,
      moduleVison: app.globalData.blueVersion,
    })
    wx.navigateTo({
      url: '/package-distribution-meiju/pages/addDevice/pages/addGuide/addGuide',
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
