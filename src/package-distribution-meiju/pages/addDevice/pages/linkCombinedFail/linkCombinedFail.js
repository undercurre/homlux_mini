/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
const app = getApp()
const bleNeg = require('../../../../utils/ble/ble-negotiation')
const addDeviceMixin = require('../assets/js/addDeviceMixin')
const wahinMixin = require('../wahinProtocol/mixin/wahinMixin')
const netWordMixin = require('../../../assets/js/netWordMixin')
const paths = require('../../../../utils/paths')
import { requestService } from '../../../../utils/requestService'
import { getReqId, getStamp } from 'm-utilsdk/index'
import { imgBaseUrl } from '../../../../common/js/api'
import computedBehavior from '../../../../utils/miniprogram-computed.js'
import { imgesList } from '../../../assets/js/shareImg.js'
const imgUrl = imgBaseUrl.url + '/shareImg/' + brandStyle.brand
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
const brandStyle = require('../../../assets/js/brand.js')
console.log('brandStyle:', brandStyle)
const iconStyle = brandStyle.brandConfig.iconStyle //图标样式
Page({
  behaviors: [bleNeg, addDeviceMixin, wahinMixin, netWordMixin, computedBehavior, getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    navTop: app.globalData.statusNavBarHeight,
    deviceList: [],
    errorCode: '', // 组合错误码
    statusArr: [
      //0-失败，1-成功，2-取消
      {
        linkText: '联网失败',
        fontColor: iconStyle.combinedFailColor,
        btnText: '查看原因',
        icon: iconStyle.combinedFailName,
      },
      {
        linkText: '联网成功',
        fontColor: iconStyle.combinedSuccessColor,
        btnText: '设置',
        icon: iconStyle.combinedSuccessName,
      },
      {
        linkText: '已取消联网',
        fontColor: iconStyle.combinedCancelColor,
        btnText: '',
        icon: iconStyle.combinedFailName,
      },
    ],
    failIcon: imgUrl + imgesList['fail'],
  },
  computed: {},
  /**
   * 点击设置/查看原因
   * @param {*} e
   */
  rightClick: function (e) {
    // 传递的参数
    const info = e.currentTarget.dataset['info']
    if (info.ui_btnText.includes('设置')) {
      let deviceInfo = JSON.stringify(info)
      deviceInfo = encodeURIComponent(deviceInfo)
      wx.navigateTo({
        url: `${paths.addSuccess}?deviceInfo=${deviceInfo}`,
      })
    } else if (info.ui_btnText.includes('查看原因')) {
      wx.navigateTo({
        url: paths.linkNetFail,
      })
    }
  },
  /**
   * 点击完成
   */
  toHome() {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },
  /**
   * 根据roomId查询roomName
   * @param {*} roomId
   */
  getRoomName(groupId, roomId) {
    console.log(`查询${groupId}家庭的${roomId}房间`)
    wx.showLoading({
      icon: 'none',
    })
    let reqData = {
      homegroupId: groupId || '',
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('applianceList', reqData)
        .then((resp) => {
          wx.hideLoading()
          let homeList = resp.data.data.homeList[0]
          let roomName = homeList.roomList[0].name || app.globalData.currentRoomName
          console.log('家庭信息', homeList)
          homeList.roomList.forEach((item) => {
            if (item.roomId == roomId) {
              roomName = item.name
              return
            }
          })
          resolve(roomName)
        })
        .catch((error) => {
          wx.hideLoading()
          console.error('[获取家庭信息异常]', error)
          resolve(app.globalData.currentRoomName)
        })
    })
  },
  /**
   * 页面初始化数据
   */
  async init() {
    const this_ = this
    const { currentHomeGroupId, currentRoomId } = app.globalData
    let roomName = await this.getRoomName(currentHomeGroupId, currentRoomId)
    app.addDeviceInfo.roomName = roomName
    let { combinedStatus, bindStatus } = app.combinedDeviceInfo[0]
    app.addDeviceInfo.ui_linkText = this.data.statusArr[1].linkText
    app.addDeviceInfo.ui_fontColor = this.data.statusArr[1].fontColor
    app.addDeviceInfo.ui_btnText = this.data.statusArr[1].btnText
    app.addDeviceInfo.ui_icon = this.data.statusArr[1].icon
    // 辅设备需处理绑定和组合2种状态: 0-失败，1-成功，2-取消
    let status
    if (bindStatus == 1) {
      // 绑定成功-->"联网成功"or""取消"
      if (combinedStatus == 2) {
        status = 2
      } else {
        status = 1
        app.combinedDeviceInfo[0].roomName = roomName
      }
    } else if (bindStatus == 0) {
      // 绑定失败-->"联网失败"or""取消"
      status = combinedStatus
    }

    app.combinedDeviceInfo[0].ui_linkText = this.data.statusArr[status].linkText
    app.combinedDeviceInfo[0].ui_fontColor = this.data.statusArr[status].fontColor
    app.combinedDeviceInfo[0].ui_btnText = this.data.statusArr[status].btnText
    app.combinedDeviceInfo[0].ui_icon = this.data.statusArr[status].icon

    this.data.deviceList.push(app.addDeviceInfo)
    this.data.deviceList.push(app.combinedDeviceInfo[0])

    this.setData({
      deviceList: this.data.deviceList,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(option) {
    this.data.brand = brandStyle.brand
    this.setData({
      brand: this.data.brand,
    })
    if (option.errorCode) {
      this.setData({
        errorCode: option.errorCode,
      })
    }
    this.init()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (!app.globalData.ifBackFromSuccess) return
    //刷新设备名，房间名
    console.log('===从addSuccess返回，取cloudBackDeviceInfo的数据更新页面', this.data.deviceList) // todo update
    if (app.addDeviceInfo.cloudBackDeviceInfo) {
      console.log('addDeviceInfo---', app.addDeviceInfo.cloudBackDeviceInfo) // todo update
      if (app.addDeviceInfo.cloudBackDeviceInfo.name)
        this.data.deviceList[0].deviceName = app.addDeviceInfo.cloudBackDeviceInfo.name
      if (app.addDeviceInfo.cloudBackDeviceInfo.roomName)
        this.data.deviceList[0].roomName = app.addDeviceInfo.cloudBackDeviceInfo.roomName
    }
    if (app.combinedDeviceInfo[0].cloudBackDeviceInfo) {
      console.log('combinedDeviceInfo---', app.combinedDeviceInfo[0].cloudBackDeviceInfo)
      if (app.combinedDeviceInfo[0].cloudBackDeviceInfo.name)
        this.data.deviceList[1].deviceName = app.combinedDeviceInfo[0].cloudBackDeviceInfo.name
      if (app.combinedDeviceInfo[0].cloudBackDeviceInfo.roomName)
        this.data.deviceList[1].roomName = app.combinedDeviceInfo[0].cloudBackDeviceInfo.roomName
    }
    this.setData({
      deviceList: this.data.deviceList,
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.data.pageStatus = 'hide'
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.data.pageStatus = 'unload'
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
