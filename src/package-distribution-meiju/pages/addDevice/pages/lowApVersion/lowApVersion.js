// distribution-network/addDevice//pages/lowApVersion/lowApVersion.js
const app = getApp()
const addDeviceMixin = require('../assets/js/addDeviceMixin')
const paths = require('../../../../utils/paths')
const netWordMixin = require('../../../assets/js/netWordMixin')
const log = require('../../../../utils/log')
import { burialPoint } from './assets/js/burialPoint'
Page({
  behaviors: [addDeviceMixin],
  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let { sn, type, sn8, moduleVersion } = app.addDeviceInfo
    burialPoint.lowApVersionView({
      deviceSessionId: app.globalData.deviceSessionId,
      sn8: sn8,
      type: type,
      sn: sn,
      moduleVersion: moduleVersion,
      linkType: app.addDeviceInfo.linkType,
    })
    log.info('low ap version')
  },
  backToIndex() {
    wx.switchTab({
      url: '/pages/index/index',
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
