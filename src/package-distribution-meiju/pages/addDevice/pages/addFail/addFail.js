/* eslint-disable @typescript-eslint/no-this-alias */
// addDevice//pages/addFail/addFail.js
const addDeviceMixin = require('../assets/js/addDeviceMixin')
const netWordMixin = require('../../../assets/js/netWordMixin')
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
const app = getApp()
import { burialPoint } from './assets/js/burialPoint'
import paths from '../../../../utils/paths'
Page({
  behaviors: [addDeviceMixin, netWordMixin, getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    deviceName: '',
    deviceImg: '',
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    errorCode: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let { deviceName, deviceImg, errorCode } = app.addDeviceInfo
    console.log('addDeviceInfo=====', app.addDeviceInfo)
    this.logAddDivceInfo('添加设备参数', app.addDeviceInfo)
    this.setData({
      deviceName: deviceName,
      deviceImg: deviceImg,
      errorCode: errorCode,
    })
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
    const this_ = this
    if (this.retryClickFlag) return
    this.retryClickFlag = true
    let { mode, guideInfo } = app.addDeviceInfo
    console.log('触发了addFail重试埋点')
    if (app.addDeviceInfo.errorCode == '9014200') {
      //自启热点无后确权 重试去确权
      wx.reLaunch({
        //洗衣机去扫码页
        url: paths.addGuide,
        complete() {
          this_.retryClickFLag = false
        },
      })
      return
    }
    if (app.addDeviceInfo.errorCode == '9011301') {
      //触屏绑定失败
      wx.reLaunch({
        //洗衣机去扫码页
        url: app.addDeviceInfo.isWashingMachine ? paths.scanDevice + '?openScan=true' : paths.addGuide,
      })
      return
    }
    if (mode == 5) {
      if (guideInfo) {
        wx.reLaunch({
          url: paths.addGuide,
        })
      } else {
        wx.reLaunch({
          url: paths.scanDevice,
        })
      }
      return
    }
    if (mode == 100) {
      if (guideInfo) {
        wx.reLaunch({
          url: paths.addGuide,
        })
      } else {
        wx.reLaunch({
          url: paths.scanDevice + '?openScan=true',
        })
      }
      return
    }
    wx.navigateTo({
      url: '/package-distribution-meiju/pages/addDevice/pages/linkDevice/linkDevice',
    })
  },
  backToIndex() {
    const this_ = this
    if (this.backClickFlag) return
    this.backClickFlag = true
    wx.reLaunch({
      url: paths.index,
      complete() {
        this_.backClickFLag = false
      },
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

    // this.retry()
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
