// distribution-network/scan-devices/pages/scan-help/scan-help.js
import { imgBaseUrl } from '../../../../api.js'
import { clickEventTracking } from '../../../../track/track.js'
const app = getApp()
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
import { imgesList } from '../../../assets/js/shareImg.js'
const imgUrl = imgBaseUrl.url + '/shareImg/' + app.globalData.brand
Page({
  behaviors: [getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    baseImgUrl: imgBaseUrl.url,
    brand: app.globalData.brand,
    noResultImg: imgUrl + imgesList['noResult'],
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
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    getApp().onLoadCheckingLog()
    this.getLoginStatus().then(() => {
      if (app.globalData.isLogon) {
        this.checkFamilyPermission()
      } else {
        this.navToLogin()
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    clickEventTracking('user_page_view', 'onShow', {
      device_info: {
        device_session_id: app.globalData.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: '', //sn8码
        a0: '', //a0码
        widget_cate: '', //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },

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
