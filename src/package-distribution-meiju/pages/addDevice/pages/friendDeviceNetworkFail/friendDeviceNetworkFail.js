import { imgBaseUrl, baseImgApi } from '../../../../common/js/api'
import paths from '../../../../utils/paths'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    imgBaseUrl: imgBaseUrl.url,
    baseImgUrl: baseImgApi.url,
    device: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('配网失败设备信息', JSON.parse(options.device))
    this.setData({
      device: JSON.parse(options.device),
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

  backToIndex() {
    wx.reLaunch({
      url: paths.index,
    })
  },

  retry() {
    wx.reLaunch({
      url: paths.scanDevice,
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},
})
