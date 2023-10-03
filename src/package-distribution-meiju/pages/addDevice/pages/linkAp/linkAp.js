/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
const app = getApp()
const addDeviceMixin = require('../assets/js/addDeviceMixin')
const paths = require('../../../../utils/paths')
const netWordMixin = require('../../../assets/js/netWordMixin')
const log = require('../../../../utils/log')
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
import { showToast, getFullPageUrl } from '../../../../utils/util'
import { brand } from '../../../assets/js/brand'
import { login } from '../../../../utils/paths'
import { addDeviceSDK } from '../../../../utils/addDeviceSDK'
import WifiMgr from '../assets/js/wifiMgr'
import { imgesList } from '../../../assets/js/shareImg.js'
import { imgBaseUrl } from '../../../../common/js/api'
const imgUrl = imgBaseUrl.url + '/shareImg/' + brand
let wifiMgr = new WifiMgr()
Page({
  behaviors: [addDeviceMixin, netWordMixin, getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    deviceName: '',
    type: '',
    wifoInfo: {
      name: 'midea_ca_0059',
    },
    isLinkDeviceWifi: false,
    udpMsg: '',
    psw: '12345678',
    adData: {},
    brandName: '', //企业热点名
    deviceImg: '',
    linkDeviceWifi: '去连接',
    system: '',
    isShowStepDetail: false, //是否展示详情
    isGetDeviceWifi: false, //是否只显示设备ap
    readingTimer: 3, //阅读页面时间 秒
    isGetWifiList: true, //是否获取wifi列表
    wifiListTitle: '选择家庭WIFI',
    guideGif: '',
    netStatusChange: false, //网络状态是否变化
    pageStatus: 'show', //页面状态
    getWifiList: [], //wifi列表
    flag: false,
    brand: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.data.brand = brand
    this.setData({
      brand: this.data.brand,
      android_ApName: imgUrl + imgesList['android_ApName'],
      linkDeviceWifiMidea: imgUrl + imgesList['linkDeviceWifiMidea'],
      android_linkDeviceWifiBugu: imgUrl + imgesList['android_linkDeviceWifiBugu'],
      linkDeviceWifiBugu: imgUrl + imgesList['linkDeviceWifiBugu'],
      wifi: imgUrl + imgesList['wifi'],
      pswImg: imgUrl + imgesList['psw'],
      detailPackUp: imgUrl + imgesList['detailPackUp'],
      detailExpand: imgUrl + imgesList['detailExpand'],
    })
    console.log('this.data.brand------:', this.data.brand)
    this.checkSystm()
    let { moduleType, deviceName, type, sn8, deviceId, blueVersion, mode, enterprise, deviceImg } =
      app.addDeviceInfo
    this.setData({
      deviceImg: deviceImg,
      deviceName: deviceName,
      linkDeviceWifi: '去连接',
      type: type,
      brandName: this.getBrandBname(enterprise),
    })
    // this.onLinkDeviceWifi(this.data.brandName, this.data.type)
    this.readingGuideTiming() //阅读计时
    // this.onNetType()
    this.saveDeviceImg(deviceImg)
    this.wifiListSheet = this.selectComponent('#wifi-list-sheet') //组件的id
  },
  //点击反馈
  feedback() {
    wx.navigateTo({
      url: paths.feedback,
    })
  },
  //关闭帮助弹窗
  closeHelpDialog() {
  },
  //判断系统展示UI
  checkSystm() {
    if (app.globalData.systemInfo.system.includes('Android')) {
      this.setData({
        system: 'Android',
      })
    } else {
      this.setData({
        system: 'iOS',
      })
    }
  },
  //阅读指引计时
  readingGuideTiming() {
    let { readingTimer } = this.data
    const timer = setInterval(() => {
      if (readingTimer >= 0) {
        this.setData({
          readingTimer: readingTimer--,
        })
      } else {
        clearInterval(timer)
      }
    }, 1000)
  },
  //切换步骤详情展示
  switchShowDetail() {
    this.setData({
      isShowStepDetail: !this.data.isShowStepDetail,
    })
    wx.pageScrollTo({
      selector: '.detail-title',
      duration: 500,
    })
  },
  //预加载设备图片
  saveDeviceImg(deviceImgUrl) {
    if (wx.preloadAssets) {
      wx.preloadAssets({
        data: [
          {
            type: 'image',
            src: deviceImgUrl,
          },
        ],
        success(resp) {
          console.log('@module linkAp.js\n@method saveDeviceImg\n@desc 预加载设备图片成功\n', resp)
        },
        fail(err) {
          console.error('@module linkAp.js\n@method saveDeviceImg\n@desc 预加载设备图片失败\n', err)
        },
      })
    } else {
      console.error('@module linkAp.js\n@method saveDeviceImg\n@desc 预加载设备图片失败，基础库版本不支持')
    }
  },
  //判断设备是否启了设备热点
  checkDeviceWifiOpen(brandName, type) {
    if (this.data.system == 'iOS') return //ios不做此判断
    type = type.toLocaleLowerCase()
    let isOpenDeviceWifi = false //根据wifi列表返回判断是否起了设备ap
    let deviceWifiSSID = ''
    wifiMgr.getWifiList(
      (wifiList) => {
        wifiList.forEach((item, index) => {
          let deviceSSID = item.SSID.toLocaleLowerCase()
          if (deviceSSID.includes(`${brandName}_${type}`)) {
            isOpenDeviceWifi = true
            deviceWifiSSID = deviceSSID
          }
        })
        if (isOpenDeviceWifi) {
          console.log('找到设备ap===============', deviceWifiSSID)
        } else {
          console.log('没找到设备ap===============')
        }
      },
      (error) => {
        console.log('获取wifi列表失败', error)
      },
    )
  },
  //获取wifi列表信息 IsCyc是否循环
  getWifiList(IsCyc = false, interval = 2000) {
    let that = this
    if (this.data.isGetWifiList) {
      wifiMgr.getWifiList(
        (wifiList) => {
          that.setData({
            wifiList: wifiList,
          })
          if (IsCyc) {
            setTimeout(() => {
              that.getWifiList(true)
            }, interval)
          }
        },
        (error) => {
          console.log('获取wifi列表失败', error)
        },
      )
    }
  },

  //关闭wifi列表弹窗 hideWifiListSheet
  hideWifiListSheet() {
    console.log('hideWifiListSheet=============')
    this.data.isGetWifiList = false
  },

  //wifi列表点击去设置页
  clickNoFoundFamilyWifi() {
    this.switchWifi()
  },
  goLinkDeviceWifi() {
    if (this.data.readingTimer > 0) {
      //未阅读完毕
      return
    }
    this.switchWifi(false)
  },
  goToSetPage() {
    console.log('去设置页')
    this.switchWifi() //去设置页手动连接
  },
  //选择连接设备ap
  async selectWifi(e) {
    let res = e.detail
    console.log('kkkkkkk', res.BSSID)
    wx.showLoading({
      title: '连接中',
    })
    try {
      await this.connectWifi(res.BSSID, addDeviceSDK.deviceApPassword, false)
      wx.navigateTo({
        url: paths.linkDevice,
      })
      wx.hideLoading()
    } catch (error) {
      wx.hideLoading()
      showToast('连接设备WiFi失败,\r\n请在设备页中手动选取连接')
      setTimeout(() => {
        this.switchWifi() //去设置页手动连接
      }, 2000)
    }
  },

  //校验是否连上设备ap
  async checkLinkWifi(brandName, type) {
    let self = this
    type = type.toLocaleLowerCase()
    if (this.data.isLinkDeviceWifi) {
      return //已连上设备wifi
    }
    console.log('checkLinkWifi===========', self.data.isLinkDeviceWifi)
    wifiMgr
      .getConnectedWifi()
      .then((res) => {
        console.log('wifi info', res, res.SSID.includes(`${brandName}_${type}`), !self.data.isLinkDeviceWifi)
        log.info('当前wifi info', res)
        if (res.SSID.toLocaleLowerCase().includes(`${brandName}_${type}`) && !self.data.isLinkDeviceWifi) {
          // showToast('连上了设备wifi')
          self.data.isLinkDeviceWifi = true
          log.info('调用getConnectedWifi判断 连上了设备ap')
          console.log('连上了设备ap 111')
          let connectWifiDeviceHotspot = {
            deviceSessionId: app.globalData.deviceSessionId,
            type: app.addDeviceInfo.type,
            sn8: app.addDeviceInfo.sn8,
            moduleVersion: app.addDeviceInfo.blueVersion,
            linkType: app.addDeviceInfo.linkType,
            ssid: res.SSID,
            rssi: res.signalStrength,
          }
          app.apNoNetBurialPoint.connectWifiDeviceHotspot = connectWifiDeviceHotspot //暂存
          //重置当前连接热点信息
          app.addDeviceInfo.BSSID = res.BSSID
          app.addDeviceInfo.ssid = res.SSID
          app.addDeviceInfo.rssi = res.signalStrength
          app.addDeviceInfo.frequency = res.frequency
          wx.stopWifi()
          console.log('开始跳转')
          if (getFullPageUrl().includes('linkAp')) {
            console.log('是配网页进行连接')
            wx.navigateTo({
              url: paths.linkDevice,
            })
          }
        } else {
          if (this.data.pageStatus == 'show') {
            //连上的不是设备ap 则继续获取判断
            setTimeout(() => {
              console.log('连上的不是设备ap=====')
              this.checkLinkWifi(brandName, type)
            }, 1500)
          }
        }
      })
      .catch((error) => {
        console.log('获取当前连接wifi失败', error)
        this.apLogReportEven({
          msg: '调用微信接口wx.getConnectedWifi 失败',
          error: error,
        })
        if (this.data.pageStatus == 'show') {
          setInterval(() => {
            this.checkLinkWifi(brandName, type)
          }, 1500)
        }
      })
  },

  //监听是否连上设备ap
  onLinkDeviceWifi(brandName, type) {
    let self = this
    type = type.toLocaleLowerCase()
    wx.onWifiConnected((res) => {
      console.log('监听连接上wifi后响应', res, brandName, type, self.data.isLinkDeviceWifi)
      log.info('非wifi 连上wifi后 wifi info', res)
      if (res.wifi.SSID.toLocaleLowerCase().includes(`${brandName}_${type}`) && !self.data.isLinkDeviceWifi) {
        // showToast('连上了设备wifi')
        self.data.isLinkDeviceWifi = true
        console.log('连上了设备ap')
        log.info('连上了设备ap')
        //重置当前连接热点信息
        app.addDeviceInfo.ssid = res.wifi.SSID
        app.addDeviceInfo.rssi = res.wifi.signalStrength
        app.addDeviceInfo.frequency = res.wifi.frequency
        this.setApDeviceInfo(res.wifi)
        wx.offWifiConnected()
        wx.navigateTo({
          url: paths.linkDevice,
        })
      }
    })
  },

  //暂存设备ap信息
  setApDeviceInfo(wifiInfo) {
    let apDeviceWifiInfo = {
      SSID: wifiInfo.SSID,
      password: '12345678',
    }
    console.log('暂存设备ap信息======', apDeviceWifiInfo)
    app.addDeviceInfo.apDeviceWifiInfo = apDeviceWifiInfo
  },
  copy() {
    const _this = this
    if (this.data.flag) return
    this.data.flag = true
    wx.setClipboardData({
      data: this.data.psw,
      success(res) {
        showToast('复制成功')
        _this.data.flag = false
      },
      fail(error) {
        _this.data.flag = false
      },
    })
  },
  //找不到ap
  clickNoFoundWifi() {
    this.selectComponent('#bottomFrame').showFrame()
  },
  //帮助弹窗 重新设置
  retrySetDevice() {
    wx.reLaunch({
      url: paths.addGuide,
    })
  },
  //当前手机网络状态
  nowNetType() {
    return new Promise((resolve, reject) => {
      wx.getNetworkType({
        success(res) {
          console.log('当前网络状况', res)
          resolve(res.networkType)
        },
        fail(error) {
          console.log('获取当前网络状况错误', error)
          reject(error)
        },
      })
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
    this.data.isLinkDeviceWifi = false
    this.data.pageStatus = 'show'
    this.checkDeviceWifiOpen(this.data.brandName, app.addDeviceInfo.type) //判断是否起设备ap
    this.checkLinkWifi(this.data.brandName, app.addDeviceInfo.type)
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
    wx.offWifiConnected()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {},
})
