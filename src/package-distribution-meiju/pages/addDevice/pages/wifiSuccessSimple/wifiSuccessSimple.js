/* eslint-disable @typescript-eslint/no-var-requires */
const app = getApp()
const addDeviceMixin = require('../assets/js/addDeviceMixin')
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
import { brandConfig } from '../../../assets/js/brand'
Page({
  behaviors: [addDeviceMixin, getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    brandConfig,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let type0x = app.addDeviceInfo.cloudBackDeviceInfo.type
    let deviceInfo = encodeURIComponent(JSON.stringify(app.addDeviceInfo.cloudBackDeviceInfo))
    wx.closeBLEConnection({
      //断开连接
      deviceId: app.addDeviceInfo.deviceId,
    })
    setTimeout(() => {
      wx.reLaunch({
        url: `/plugin/T${type0x}/index/index?backTo=/pages/index/index&deviceInfo=${deviceInfo}`,
      })
    }, 1500)
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
