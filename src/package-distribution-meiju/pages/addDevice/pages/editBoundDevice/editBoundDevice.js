/* eslint-disable @typescript-eslint/no-var-requires */
const app = getApp() //获取应用实例
import paths from '../../../../utils/paths'
import {requestService} from '../../../../utils/requestService'
import {getReqId, getStamp} from 'm-utilsdk/index'
import {baseImgApi} from '../../../../common/js/api.js'

const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
Page({
  behaviors: [getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    baseImgUrl: baseImgApi.url,
    device: {},
    familyInfo: app.globalData.applianceHomeData,
    inputNotice: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('编辑设备信息', JSON.parse(options.device))
    this.setData({
      device: JSON.parse(options.device),
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  },

  antiNameClicked(e) {
    this.nameCheck(e.detail.value)
  },

  nameCheck(value) {
    let name = value.replace(/\s/g, '')
    if (name == '') {
      this.setData({
        inputNotice: '设备名称不能为空',
      })
      return false
    }
    let reg = /^(\p{Unified_Ideograph}|[a-zA-Z\d ])*$/u
    if (!reg.test(value)) {
      this.setData({
        inputNotice: '设备名称不支持标点符号及表情',
      })
      return false
    }
    this.setData({
      inputNotice: '',
    })
    return true
  },

  changeDeviceName(e) {
    this.setData({
      ['device.deviceName']: e.detail.value,
    })
  },

  async changeBindDviceInfo() {
    if (!this.nameCheck(this.data.device.deviceName)) {
      return
    }
    let params = {
      reqId: getReqId(),
      stamp: getStamp(),
      applianceCode: this.data.device.applianceCode,
      homegroupId: this.data.device.homegroupId,
      roomId: this.data.device.roomId,
      applianceName: this.data.device.deviceName,
    }
    requestService
      .request('homeModify', params)
      .then((resp) => {
        console.log('修改已绑定设备信息成功', resp.data.data)
        try {
          var value = wx.getStorageSync('batchNetwork')
          if (value) {
            value.forEach((item) => {
              if (item.applianceCode == this.data.device.applianceCode) {
                item.deviceName = this.data.device.deviceName
                item.roomId = this.data.device.roomId
                item.room = this.data.device.room
              }
            })
            wx.setStorageSync('batchNetwork', value)
            wx.navigateTo({
              url: paths.batchNetwork,
            })
          }
        } catch (e) {
          throw e
        }
      })
      .catch((error) => {
        console.log('修改已绑定设备信息失败', error)
      })
  },

  switchRoom(e) {
    let {id, roomName} = e.currentTarget.dataset
    this.setData({
      ['device.roomId']: id,
      ['device.room']: roomName,
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  },
})
