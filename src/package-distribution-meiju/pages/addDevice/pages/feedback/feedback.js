/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
const app = getApp()
const paths = require('../../../../utils/paths')
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')

import { showToast } from '../../../../utils/util'

const brandStyle = require('../../../assets/js/brand.js')
Page({
  behaviors: [getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    noteNowLen: 0,
    noteMaxLen: 1000,
    phone: '',
    content: '',
    dialogStyle: brandStyle.brandConfig.dialogStyle, //弹窗样式
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
  },
  bindTextAreaChange: function (e) {
    var that = this
    var value = e.detail.value,
      len = parseInt(value.length)
    if (len > that.data.noteMaxLen) return
    that.setData({
      content: value,
      noteNowLen: len,
    })
  },
  getPhone(e) {
    let phone = e.detail.value
    console.log(phone)
    this.setData({
      phone: phone,
    })
  },

  async submit() {
    let { content, phone } = this.data
    console.log('===========', content, phone)
    if (!content) {
      showToast('请输入问题')
      return
    }
    if (!phone) {
      showToast('请输入手机号/微信号')
      return
    }
    try {
      await app.checkNet(2000)
      showToast('提交成功')
      setTimeout(() => {
        wx.switchTab({
          url: paths.index,
        })
      }, 2000)
    } catch (error) {
      wx.showModal({
        title: '提交失败',
        content: '请检查网络设置后重新提交',
        showCancel: false,
        confirmText: '我知道了',
      })
    }
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
