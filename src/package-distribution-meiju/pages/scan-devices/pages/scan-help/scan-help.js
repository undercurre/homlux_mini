// distribution-network/scan-devices/pages/scan-help/scan-help.js
import { imgBaseUrl } from '../../../../common/js/api.js'
const app = getApp()
// eslint-disable-next-line @typescript-eslint/no-var-requires
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
import { imgesList } from '../../../assets/js/shareImg.js'
const imgUrl = imgBaseUrl.url + '/shareImg/' + brandStyle.brand
Page({
  behaviors: [getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    baseImgUrl: imgBaseUrl.url,
    brand: brandStyle.brand,
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
