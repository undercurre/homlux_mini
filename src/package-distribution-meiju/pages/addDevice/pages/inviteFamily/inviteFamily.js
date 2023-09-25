// pages/discover/discover.js
var app = getApp()
import { imgBaseUrl } from '../../../../api'
import { getReqId, getStamp, hasKey } from 'm-utilsdk/index'
import { requestService } from '../../../../utils/requestService'
import { goTopluginPage } from '../../../../utils/pluginFilter'
import { ApBurialPoint } from '../assets/js/burialPoint'
import { setPluginDeviceInfo } from '../../../../track/pluginTrack.js'
const brandStyle = require('../../../assets/js/brand.js')
import { imgesList } from '../../../assets/js/shareImg.js'
const imgUrl = imgBaseUrl.url + '/shareImg/' + app.globalData.brand
Page({
  behaviors: [],
  /**
   * 页面的初始数据
   */
  data: {
    isIpx: app.globalData.isPx,
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    invite_img: imgUrl + imgesList['inviteFamily'],
    tempPath: '/pages/index/index',
    inviteBtnFlag: true,
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.brand = app.globalData.brand
    this.setData({
      brand: this.data.brand,
    })
    console.log(this.data.brand)
    // if (this.data.brand == 'meiju') {
    //   wx.setNavigationBarColor({
    //     frontColor: '#000000',
    //     backgroundColor: '#ffffff',
    //   })
    // } else if (this.data.brand == 'colmo') {
    //   wx.setNavigationBarColor({
    //     frontColor: '#ffffff',
    //     backgroundColor: '#1A1A1F',
    //   })
    // }
    let homeName = options.homeName
    let deviceInfo = app.addDeviceInfo.cloudBackDeviceInfo || JSON.parse(options.deviceInfo) //通过全局变量传参
    let isRomoveRoute = options.isRomoveRoute
    let backTo = options.backTo
    let status = options.status
    this.setData({
      homeName,
      deviceInfo,
      isRomoveRoute,
      backTo,
      status,
    })
    console.info('options======', options)
    console.info('options======', this.data.deviceInfo, this.data.isRomoveRoute, this.data.backTo)
    //页面浏览埋点
    let params = {
      deviceSessionId: app.globalData.deviceSessionId,
      type: this.data.deviceInfo.type,
      sn8: this.data.deviceInfo.sn8 || '',
      moduleVersion: app.addDeviceInfo.moduleVersion,
      linkType: app.addDeviceInfo.linkType,
    }
    ApBurialPoint.inviteFamilyPageView(params)
  },
  onShow() {
    this.inviteCodeHandle()
  },
  inviteCodeHandle() {
    this.getInvitationCode()
      .then((data) => {
        console.log('created invitationCode:')
        console.log(data.path)
        this.setData({
          tempPath: '/' + data.path,
        })
      })
      .catch((e) => {
        console.log('e=======', e)
        if (!hasKey(e, 'data')) return
        if (!hasKey(e.data, 'code')) return
        if (e.data.code == 2020) {
          this.setData({
            inviteBtnFlag: false,
          })
        }
      })
  },
  /**
   * 获取邀请码
   */
  getInvitationCode() {
    return new Promise((resolve, reject) => {
      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
        homegroupId: app.globalData.currentHomeGroupId || '',
      }
      requestService.request('share', reqData).then(
        (resp) => {
          resolve(resp.data.data || {})
        },
        (error) => {
          reject(error)
        },
      )
    })
  },
  goPluginDetail() {
    let { homeName, deviceInfo, isRomoveRoute, backTo, status } = this.data
    //0 已确权 1 待确权 2 未确权 3 不支持确权
    if (status == 1 || status == 2) {
      wx.reLaunch({
        url: '/distribution-network/addDevice/pages/afterCheck/afterCheck?backTo=/pages/index/index',
      })
    } else {
      // 组合配网新增逻辑
      let { combinedStatus } = app.combinedDeviceInfo[0]
      if (combinedStatus > -1) {
        let deviceList = []
        deviceInfo.composeApplianceList = app.composeApplianceList
        console.log('---inviteFamily deviceInfo---', deviceInfo)
        setPluginDeviceInfo(deviceInfo)
      } else {
        setPluginDeviceInfo(app.addDeviceInfo) //进入插件页前，设置设备信息到app.globalData.currDeviceInfo
      }
      goTopluginPage(deviceInfo, backTo, isRomoveRoute)
    }
    let params = {
      deviceSessionId: app.globalData.deviceSessionId,
      type: deviceInfo.type,
      sn8: deviceInfo.sn8 || '',
      moduleVersion: app.addDeviceInfo.moduleVersion,
      linkType: app.addDeviceInfo.linkType,
      homegroupId: app.globalData.currentHomeGroupId || '',
      homeName: homeName || '',
      str: 'skip',
    }
    ApBurialPoint.inviteFamilyPageClickBtnHandle(params)
  },
  showInviteToast() {
    wx.showToast({
      title: '当前家庭成员数量已达上限',
      icon: 'none',
      duration: 3000,
    })
  },
  // 分享
  onShareAppMessage(res) {
    var tempTitle = '邀请你加入我的家庭控制设备'
    var tempPath = this.data.tempPath
    var tempImageUrl = '/assets/img/img_wechat_chat02@3x.png'
    let { homeName } = this.data
    let params = {
      deviceSessionId: app.globalData.deviceSessionId,
      type: this.data.deviceInfo.type,
      sn8: this.data.deviceInfo.sn8,
      moduleVersion: app.addDeviceInfo.moduleVersion,
      linkType: app.addDeviceInfo.linkType,
      homegroupId: app.globalData.currentHomeGroupId || '',
      homeName: homeName || '',
      str: 'invite',
    }
    ApBurialPoint.inviteFamilyPageClickBtnHandle(params)
    //启用页面小程序转发功能
    return {
      title: tempTitle, // 默认是小程序的名称(可以写slogan等)
      path: tempPath, // 默认是当前页面，必须是以‘/’开头的完整路径
      imageUrl: tempImageUrl, //自定义图片路径，可以是本地文件路径、代码包文件路径或者网络图片路径，支持PNG及JPG，不传入 imageUrl 则使用默认截图。显示图片长宽比是 5:4
      success: function (res) {
        // 转发成功之后的回调
        if (res.errMsg == 'shareAppMessage:ok') {
          console.log('转发成功之后的回调')
        }
      },
      fail: function () {
        // 转发失败之后的回调
        if (res.errMsg == 'shareAppMessage:fail cancel') {
          // 用户取消转发
          console.log('用户取消转发')
        } else if (res.errMsg == 'shareAppMessage:fail') {
          // 转发失败，其中 detail message 为详细失败信息
          console.log('转发失败，其中 detail message 为详细失败信息')
        }
      },
    }
  },
})
