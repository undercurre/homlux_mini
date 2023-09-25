// distribution-network/addDevice//pages/wifiSuccessSimple/wifiSuccessSimple.js
const app = getApp()
const addDeviceMixin = require('../assets/js/addDeviceMixin')
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
import { setPluginDeviceInfo } from '../../../../track/pluginTrack.js'
import { burialPoint } from './assets/js/burialPoint'
Page({
  behaviors: [addDeviceMixin, getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    brandConfig: app.globalData.brandConfig[app.globalData.brand],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    getApp().onLoadCheckingLog()
    this.getLoginStatus().then(() => {
      if (app.globalData.isLogon) {
        this.checkFamilyPermission()
      } else {
        this.navToLogin()
      }
    })
    let { deviceName, mac, type, sn8, blueVersion, mode, sn, linkType } = app.addDeviceInfo
    burialPoint.addSuccessView({
      pageName: 'WiFi联网成功页',
      pageId: 'page_WiFi_connect_success',
      deviceSessionId: app.globalData.deviceSessionId,
      sn: sn,
      sn8: sn8,
      type: type,
      moduleVersion: blueVersion,
      linkType,
    })
    let type0x = app.addDeviceInfo.cloudBackDeviceInfo.type
    let deviceInfo = encodeURIComponent(JSON.stringify(app.addDeviceInfo.cloudBackDeviceInfo))
    const pluginDeviceInfo = app && app.addDeviceInfo.cloudBackDeviceInfo
    wx.closeBLEConnection({
      //断开连接
      deviceId: app.addDeviceInfo.deviceId,
    })
    setPluginDeviceInfo(pluginDeviceInfo)
    setTimeout(() => {
      wx.reLaunch({
        url: `/plugin/T${type0x}/index/index?backTo=/pages/index/index&deviceInfo=${deviceInfo}`,
      })
    }, 1500)
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
