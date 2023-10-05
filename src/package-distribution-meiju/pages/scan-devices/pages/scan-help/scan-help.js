import { imgBaseUrl } from '../../../../common/js/api.js'
import { imgesList } from '../../../assets/js/shareImg.js'
import { brand } from '../../../assets/js/brand'
const imgUrl = imgBaseUrl.url + '/shareImg/' + brand
Page({
  behaviors: [],
  /**
   * 页面的初始数据
   */
  data: {
    baseImgUrl: imgBaseUrl.url,
    brand: brand,
    noResultImg: imgUrl + imgesList['noResult'],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
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
