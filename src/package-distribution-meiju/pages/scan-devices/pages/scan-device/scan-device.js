/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
import Dialog from '@vant/weapp/dialog/dialog'

import { baseImgApi, deviceImgApi, imgBaseUrl, commonH5Api } from '../../../../common/js/api.js'
import { getStamp, getReqId, isEmptyObject } from 'm-utilsdk/index'
import { scanHelp, selectDevice } from '../../../../utils/paths.js'
import { requestService } from '../../../../utils/requestService'
import { isSupportPlugin } from '../../../../utils/pluginFilter'
const bluetooth = require('../../../../common/mixins/bluetooth.js')
const paths = require('../../../../utils/paths')
const dialogCommonData = require('../../../../common/mixins/dialog-common-data.js')
import app from '../../../../common/app'
import { actionScanResult } from '../../../../utils/scanCodeApi'
import { creatDeviceSessionId } from '../../../../utils/util.js'
import { addDeviceSDK } from '../../../../utils/addDeviceSDK'
import { checkPermission } from '../../../../common/js/checkPermissionTip'
import { getPrivateKeys } from '../../../../utils/getPrivateKeys'
const brandStyle = require('../../../assets/js/brand.js')
import { imgesList } from '../../../assets/js/shareImg.js'
import { commonDialog } from '../../../assets/js/commonDialog'
let findFriendTimer, findFriendTimer2 //主设备找朋友定时查询
let scanHintTimer
const imgUrl = imgBaseUrl.url + '/shareImg/' + brandStyle.brand
Page({
  behaviors: [bluetooth, dialogCommonData],
  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], // 顶部状态栏高度
    baseImgUrl: baseImgApi.url,
    hasOpenOrientation: false,
    hasOpenBluetooth: false,
    deviceList: [],
    deviceImgApi: deviceImgApi,
    imgBaseUrl: imgBaseUrl.url,
    id: null, //家庭idd
    homeName: '',
    isScanCodeSuccess: false,
    searchNotice: '',
    findFriendTime: 120, //找朋友轮询时间 120
    isOpenModal: false,
    friendDevices: [], //找朋友方式发现的设备
    selectFriendDevices: [], //选择需要配网的朋友设备
    sceneIconList: [], //设备图片和名字
    isCanAddDevice: true, //是否有权限添加设备
    homeList: [], // 家庭列表
    autoFoundCardClickFlag: false, //自发现卡片点击防重
    actionScanClickFlag: false, //点击扫码按钮防重
    selectModelClickFlag: false, //点击选型按钮防重
    checkPermissionRes: {
      isCanBlue: true,
      isCanLocation: true,
      type: '', //权限类型
      permissionTextAll: null, //权限提示文案
      permissionTypeList: {},
    },
    isScanHint: false,
    brand: '',
    scanImg: '', //扫描动图
    permissionImg: '', //权限图片
    reSearchIcon: '', //重新搜索图标
    dialogStyle: brandStyle.brandConfig.dialogStyle, //弹窗样式
    brandConfig: brandStyle.brandConfig,
    guideFalg: false,
    retryFlag: false,
  },
  ifBackFromScan: false, // 从扫码页返回标识

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log('品牌:', brandStyle.brand)
    this.data.brand = brandStyle.brand
    this.setData({
      brand: this.data.brand,
      reSearchIcon: imgUrl + imgesList['reSearchIcon'],
      scanImg: imgUrl + imgesList['scanImg'],
      scanAdd: imgUrl + imgesList['scanAdd'],
      modelCategory: imgUrl + imgesList['modelCategory'],
      dms_img_lack: imgUrl + imgesList['dms_img_lack'],
    })
    if (this.options.id) {
      this.setData({
        id: options.id,
        homeName: options.homeName,
      })
    }

    let { isCheckGray } = app.addDeviceInfo
    //获取添加设备灰度名单判断是否是灰度用户
    try {
      let isCan = await addDeviceSDK.isGrayUser(isCheckGray)
      this.setData({
        isCanAddDevice: isCan,
      })
      if (!this.data.isCanAddDevice) {
        console.log('屏蔽了配网入口')
        return
      }
    } catch (error) {
      console.log('[isGrayUser error]', error)
    }
    this.checkCurrentFamilyPermission()
    this.locationAuthorize() //判断用户是否授权小程序使用位置权限
    this.bluetoothAuthorize() //判断用户是否授权小程序使用蓝牙权限
    if (options.openScan) {
      //是否启动扫码
      this.actionScan()
    }

    this.setTimer()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  async getpermissionTextAll(type) {
    let object_name = []
    if (type == 'location') {
      let locationRes = await checkPermission.loaction()
      let permissionTypeList = locationRes.permissionTypeList
      let { locationEnabled, locationAuthorized, scopeUserLocation } = permissionTypeList
      if (!locationEnabled) {
        object_name.push('开启定位服务')
      }
      if (!locationAuthorized) {
        object_name.push('允许微信获取位置权限')
      }
      if (!scopeUserLocation) {
        object_name.push('允许小程序使用位置权限')
      }
      object_name = object_name.join('/')
    } else if (type == 'blue') {
      let blueRes = await checkPermission.blue()
      let permissionTypeList = blueRes.permissionTypeList
      let { bluetoothEnabled, bluetoothAuthorized, scopeBluetooth } = permissionTypeList
      if (!bluetoothEnabled) {
        object_name.push('开启蓝牙服务')
      }
      if (!bluetoothAuthorized) {
        object_name.push('允许微信获取蓝牙权限')
      }
      if (!scopeBluetooth) {
        object_name.push('允许小程序使用蓝牙权限')
      }
      object_name = object_name.join('/')
    }
    return object_name
  },
  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    let { isCheckGray } = app.addDeviceInfo
    try {
      let isCan = await addDeviceSDK.isGrayUser(isCheckGray)
      this.setData({
        isCanAddDevice: isCan,
      })
      if (!this.data.isCanAddDevice) {
        console.log('用户无权限添加设备')
        return
      }
    } catch (error) {
      console.log('[isGrayUser error]', error)
    }
    console.log('on show')
    let isScanBlue = await this.permissionCheckTip() //权限校验提示
    // await this.checkSystemInfo()
    app.globalData.deviceSessionId = app.globalData.deviceSessionId
      ? app.globalData.deviceSessionId
      : creatDeviceSessionId(app.globalData.userData.uid)
    if (app.globalData.ifBackFromScan) {
      // 扫码成功时不执行自发现，防止扫码跳转后异常执行自发现
      console.log('@module scan-device.js\n@method onShow\n@desc 扫码成功时不执行自发现')
      app.globalData.ifBackFromScan = false
      isScanBlue = false
    }
    if (isScanBlue) {
      //清除ap蓝牙自发现已发现的设备信息
      if (app.globalData.isCanClearFound) {
        app.globalData.isCanClearFound = false //重置状态
        this.setData({
          devices: [],
        })
      }
      this.actionBlue()
      this.actionWifi()
    }
    // this.sendFindFriendOrder() 暂时屏蔽找朋友配网
    this.setTimer()
    app.globalData.isShowUnSuppport = true //蓝牙自发现是否显示不支持控制或配网的自发现信息，设置为显示
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // this.closeBluetoothAdapter()
    console.log('scan-device onhide')
    this.stopBluetoothDevicesDiscovery()
    // this.closeWifiScan()
    this.clearMixinsTime()
    //关闭自动搜索
    wx.offBluetoothDeviceFound()
    wx.offGetWifiList()
    // this.stopBluetoothDevicesDiscovery()
    this.clearTimer()
    this._clearTimeout()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('onUnload111')

    this.stopBluetoothDevicesDiscovery()
    // this.closeWifiScan()
    this.clearMixinsTime()
    //关闭自动搜索
    wx.offBluetoothDeviceFound()
    wx.offGetWifiList()
    this.clearTimer()
    this._clearTimeout()
  },

  clearTimer() {
    clearInterval(findFriendTimer)
    clearInterval(findFriendTimer2)
    this.setData({
      findFriendTime: 0,
    })
  },

  setTimer() {
    if (this.data.devices.length > 0 || scanHintTimer || this.data.isScanHint) return
    scanHintTimer = setTimeout(() => {
      if (this.data.devices && this.data.devices.length < 1) {
        this.setData({
          isScanHint: true,
        })
      }
    }, 5000)
  },

  _clearTimeout() {
    clearTimeout(scanHintTimer)
    scanHintTimer = null
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  showNotSupport() {
    Dialog.confirm({
      title: '该二维码无法识别，请扫描机身上携带“智能产品”标识的二维码',
      confirmButtonText: '查看指引',
      confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
      cancelButtonColor: this.data.dialogStyle.cancelButtonColor3,
    })
      .then((res) => {
        if (res.action == 'confirm') {
          this.clickQRcodeGuide()
        }
        // on confirm
      })
      .catch((error) => {
        // on cancel
      })
  },
  justAppSupport() {
    Dialog.confirm({
      title: '该设备暂不支持小程序配网，我们会尽快开放，敬请期待',
      confirmButtonText: '我知道了',
      confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
      showCancelButton: false,
    }).then(() => {
      // on close
    })
  },
  getQrResult(result) {
    return {
      qrcode: result,
    }
  },

  async actionScan() {
    if (this.data.actionScanClickFlag) {
      console.log('[防重阻止]')
      return
    }
    this.data.actionScanClickFlag = true
    //检查蓝牙和位置权限以及是否打开
    // if (!(await this.checkLocationAndBluetooth(true, true, true, true))) {
    //   return
    // }
    let locationRes
    let blueRes
    try {
      locationRes = await checkPermission.loaction(false)
      blueRes = await checkPermission.blue(false)
    } catch (error) {
      this.data.actionScanClickFlag = false
      Dialog.confirm({
        title: '微信系统出错，请尝试点击右上角“...” - “重新进入小程序”',
        confirmButtonText: '好的',
        confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
      }).then((res) => {})
      // wx.showModal({
      //   showCancel: false,
      //   content: '微信系统出错，请尝试点击右上角“...” - “重新进入小程序”',
      // })
      console.log(error, '[loactionRes blueRes]err checkPermission')
    }
    console.log('[loactionRes] checkPermission', locationRes)
    if (!locationRes.isCanLocation) {
      const obj = {
        title: '请开启位置权限',
        message: locationRes.permissionTextAll,
        confirmButtonText: '查看指引',
        type: 'location',
        permissionTypeList: locationRes.permissionTypeList,
        confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
        cancelButtonColor: this.data.dialogStyle.cancelButtonColor3,
      }
      //调用通用弹框组件
      commonDialog.showCommonDialog(obj)
      setTimeout(() => {
        this.data.actionScanClickFlag = false
      }, 1500)
      return
    }
    console.log('[blueRes] checkPermission', blueRes)
    if (!blueRes.isCanBlue) {
      const obj = {
        title: '请开启蓝牙权限',
        message: blueRes.permissionTextAll,
        confirmButtonText: '查看指引',
        type: 'blue',
        permissionTypeList: blueRes.permissionTypeList,
        confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
        cancelButtonColor: this.data.dialogStyle.cancelButtonColor3,
      }
      //调用通用弹框组件
      commonDialog.showCommonDialog(obj)
      setTimeout(() => {
        this.data.actionScanClickFlag = false
      }, 1500)
      return
    }
    setTimeout(() => {
      this.data.actionScanClickFlag = false
    }, 1500)
    //扫描设备二维码进入配网
    actionScanResult(
      this.showNotSupport,
      this.justAppSupport,
      this.actionGoNetwork,
      this.getDeviceApImgAndName,
      this.data.id,
      this.data.homeName,
    )
  },

  async makeSure(e) {
    e = e.detail
    console.log('kkkkkkkkk', e)
    if (e.flag == 'lookGuide') {
      if (e.type == 'location') {
        wx.navigateTo({
          url: paths.locationGuide + `?permissionTypeList=${JSON.stringify(e.permissionTypeList)}`,
        })
      }
      if (e.type == 'blue') {
        wx.navigateTo({
          url: paths.blueGuide + `?permissionTypeList=${JSON.stringify(e.permissionTypeList)}`,
        })
      }
    }
    if (e.flag == 'bottomBtn') {
      if (e.type == 'guide') {
        this.jumpQRcodeGuide()
      }
    }
  },

  /**
   * 获取密钥错误处理及重试逻辑(扫码页)
   * @param {*} addDeviceInfo
   */
  privateKeyErrorHand(item) {
    let self = this
    let obj = {
      page_name: '添加设备',
      widget_id: 'key_server_failed',
      widget_name: '密钥获取失败弹窗',
      sn8: app.addDeviceInfo.sn8 || '',
      widget_cate: app.addDeviceInfo.type || '',
    }
    this.data.autoFoundCardClickFlag = false
    Dialog.confirm({
      title: '服务器连接失败',
      message: '请检查网络或稍后再试',
      confirmButtonText: '重试',
      confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
      cancelButtonColor: this.data.dialogStyle.cancelButtonColor2,
    })
      .then(async (res) => {
        if (res.action == 'confirm') {
          wx.hideLoading()
          self.setData({
            clickFLag: false,
          })
          obj.widget_id = 'click_retry'
          obj.widget_name = '密钥获取失败弹窗重试按钮'
          try {
            await getPrivateKeys.getPrivateKey()
            if (item.currentTarget) {
              // 自发现
              self.goNetwork(item)
            } else {
              // 扫码
              self.actionGoNetwork(item)
            }
          } catch (err) {
            console.log('Yoram err is ->', err)
            self.privateKeyErrorHand(item)
          }
        }
      })
      .catch((error) => {
        if (error.action == 'cancel') {
          wx.hideLoading()
          self.setData({
            clickFLag: false,
          })
          obj.widget_id = 'click_cancel'
          obj.widget_name = '密钥获取失败弹窗取消按钮'
        }
      })
  },

  async goNetwork(e) {
    console.log('===========goNetwork=======')
    console.log(e)
    if (this.data.autoFoundCardClickFlag) {
      console.log('[防重阻止]')
      return
    }
    this.data.autoFoundCardClickFlag = true
    // 判断全局的密钥有没有，有就跳过，没有就重新拉取
    // if(!app.globalData.privateKey) {
    //   if(app.globalData.privateKeyIntervalNum) {
    //     clearInterval(app.globalData.privateKeyIntervalNum)
    //   }
    //   try {
    //       await getPrivateKeys.getPrivateKey()
    //       this.data.autoFoundCardClickFlag = false
    //       this.goNetwork(e)
    //   } catch(err) {
    //      this.privateKeyErrorHand(e)
    //   }
    //   return
    // }
    const item = e.currentTarget.dataset.item
    console.log('跳转前数据', e, item)
    // app.globalData.deviceSessionId = app.globalData.deviceSessionId ? app.globalData.deviceSessionId : creatDeviceSessionId(app.globalData.userData.uid)
    let linkType = ''
    if (item.mode == 0) {
      linkType = 'ap'
    } else if (item.mode == 3 || item.mode == 5) {
      linkType = 'bluetooth'
    }
    if (!this.checkWxVersion()) {
      Dialog.alert({
        message: '你的微信版本过低，请升级至最新版本后再试',
        'confirm-button-text': this.data.dialogMixinsBtnText,
      }).then(() => {
        // on close
      })
      setTimeout(() => {
        this.data.autoFoundCardClickFlag = false
      }, 1500)
      return
    }

    if (!item.isSupport) {
      setTimeout(() => {
        this.data.autoFoundCardClickFlag = false
      }, 1500)
      return
    }
    setTimeout(() => {
      this.data.autoFoundCardClickFlag = false
    }, 1500)
    this.actionGoNetwork(item)
  },
  actionBlue() {
    this.clearDevices()
    this.openBluetoothAdapter(0)
  },
  actionWifi() {
    this.getWifiList(0)
  },
  //权限提示
  async permissionCheckTip() {
    let loactionPermission = await checkPermission.loaction()
    if (!loactionPermission.isCanLocation) {
      this.setData({
        checkPermissionRes: loactionPermission,
        permissionImg: imgUrl + imgesList['img_dakailanya'],
      })
      return false
    }
    let bluePermission = await checkPermission.blue()
    console.log('[bluePermission]', bluePermission)
    if (!bluePermission.isCanBlue) {
      this.setData({
        checkPermissionRes: bluePermission,
        permissionImg: imgUrl + imgesList['img_dakailanya'],
      })
      return false
    }
    this.setData({
      checkPermissionRes: {
        isCanBlue: true,
        isCanLocation: true,
      },
    })
    return true
  },

  async goToGuide() {
    if (this.data.guideFalg) return
    this.data.guideFalg = true
    let { type, permissionTypeList } = this.data.checkPermissionRes
    if (type == 'location') {
      wx.navigateTo({
        url: paths.locationGuide + `?permissionTypeList=${JSON.stringify(permissionTypeList)}`,
      })
    }
    if (type == 'blue') {
      wx.navigateTo({
        url: paths.blueGuide + `?permissionTypeList=${JSON.stringify(permissionTypeList)}`,
      })
    }
    setTimeout(() => {
      this.data.guideFalg = false
    }, 1000)
  },
  async retry() {
    if (this.data.retryFlag) {
      return
    }
    this.data.retryFlag = true
    let permission = await this.permissionCheckTip()
    console.log('[retry permission]', permission)
    if (permission) {
      this.actionBlue()
      this.actionWifi()
    } else {
      wx.showToast({
        title: '请按照指引开启权限',
        icon: 'none',
      })
    }
    setTimeout(() => {
      this.data.retryFlag = false
    }, 1500)
  },

  goScanHelp() {
    wx.navigateTo({
      url: scanHelp,
    })
  },
  async goSelectDevice() {
    if (this.data.selectModelClickFlag) {
      console.log('[防重阻止]')
      return
    }
    this.data.selectModelClickFlag = true
    //检查蓝牙和位置权限以及是否打开
    // if (!(await this.checkLocationAndBluetooth(true, true, true, true))) {
    //   return
    // }
    let locationRes
    let blueRes
    try {
      locationRes = await checkPermission.loaction(false)
      blueRes = await checkPermission.blue(false)
    } catch (error) {
      this.data.selectModelClickFlag = false
      wx.showModal({
        showCancel: false,
        content: '微信系统出错，请尝试点击右上角“...” - “重新进入小程序”',
      })
      console.log(error, '[loactionRes blueRes]err checkPermission')
    }
    console.log('[loactionRes] checkPermission', locationRes)
    if (!locationRes.isCanLocation) {
      const obj = {
        title: '请开启位置权限',
        message: locationRes.permissionTextAll,
        confirmButtonText: '查看指引',
        type: 'location',
        permissionTypeList: locationRes.permissionTypeList,
        confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
        cancelButtonColor: this.data.dialogStyle.cancelButtonColor3,
      }
      commonDialog.showCommonDialog(obj)
      setTimeout(() => {
        this.data.selectModelClickFlag = false
      }, 1500)
      return
    }
    console.log('[blueRes] checkPermission', blueRes)
    if (!blueRes.isCanBlue) {
      const obj = {
        title: '请开启蓝牙权限',
        message: blueRes.permissionTextAll,
        confirmButtonText: '查看指引',
        type: 'blue',
        permissionTypeList: blueRes.permissionTypeList,
        confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
        cancelButtonColor: this.data.dialogStyle.cancelButtonColor3,
      }
      commonDialog.showCommonDialog(obj)
      setTimeout(() => {
        this.data.selectModelClickFlag = false
      }, 1500)
      return
    }
    this.stopBluetoothDevicesDiscovery()
    wx.offGetWifiList()
    this.clearMixinsTime()
    this.clickAddByTypeViewTrack()
    setTimeout(() => {
      this.data.selectModelClickFlag = false
    }, 1500)
    wx.navigateTo({
      url: selectDevice,
    })
  },
  // 点击跳转机身二维码指引
  clickQRcodeGuide() {
    this.jumpQRcodeGuide()
  },
  jumpQRcodeGuide() {
    const brandConfig = brandStyle.brandConfig
    const guideUrl =
      brandConfig.QRcodeGuideUrl ||
      `${paths.webView}?webViewUrl=${encodeURIComponent(
        `${commonH5Api.url}deviceQrCode.html`,
      )}&pageTitle=如何找到设备的二维码`
    wx.navigateTo({
      url: guideUrl,
    })
  },

  //发送找朋友指令
  async sendFindFriendOrder() {
    let masterDevices = wx.getStorageSync('masterDevices')
    console.log('当前家庭主设备信息', masterDevices)
    if (masterDevices) {
      if (masterDevices.length > 0) {
        this.setData({
          searchNotice: `正在通过手机及“${masterDevices[0]['name']}”等智能设备查找附近可配网的设备...`,
        })
        let resq = {
          reqId: getReqId(),
          stamp: getStamp(),
          homegroupId: masterDevices[0]['homegroupId'],
        }
        requestService
          .request('findFriends', resq)
          .then(async (resp) => {
            console.log('发送找朋友指令结果', resp)
            await this.getIotDeviceV3()
            this.setData({
              findFriendTime: 120,
            })
            findFriendTimer = setInterval(() => {
              this.getFriendDevices()
            }, 3000)
            findFriendTimer2 = setInterval(() => {
              if (this.data.findFriendTime >= 0) {
                this.setData({
                  findFriendTime: this.data.findFriendTime - 1,
                })
              }
            }, 1000)
          })
          .catch((error) => {
            console.log('发送找朋友指令失败', error)
          })
      } else {
        this.setData({
          searchNotice: '正在搜索附近设备…',
        })
      }
    } else {
      this.getCurrentHomeMasterDevices()
    }
  },

  //获取用户当前家庭主设备信息
  async getCurrentHomeMasterDevices() {
    let home = await this.getHomeGroup()
    if (home.length != 0) {
      app.globalData.currentHomeGroupId = home[0].homegroupId
      app.globalData.homeRoleId = home[0].roleId
      let devices = await this.getHomeDevices(home[0].homegroupId)
      app.globalData.applianceHomeData = devices.appliance[0]
      let masterDevices = []
      devices.appliance[0].roomList.forEach((item) => {
        item.applianceList.forEach((ele) => {
          if (isSupportPlugin(ele.type, ele.sn8, ele.sn8, '0') && ele.ability.supportFindFriends) {
            ele.homegroupId = home[0].homegroupId
            masterDevices.push(ele)
          }
        })
      })
      if (masterDevices.length != 0) {
        try {
          wx.setStorageSync('masterDevices', masterDevices)
          this.sendFindFriendOrder()
        } catch (e) {
          console.log(e)
        }
      }
    }
  },

  //获取用户家庭
  getHomeGroup() {
    return new Promise((resolve, reject) => {
      if (this.data.homeList && this.data.homeList.length) {
        resolve(this.data.homeList)
      } else {
        let reqData = {
          reqId: getReqId(),
          stamp: getStamp(),
        }
        requestService.request('homeList', reqData).then(
          (resp) => {
            this.data.homeList = resp.data.data.homeList
            resolve(resp.data.data.homeList)
          },
          (error) => {
            reject(error)
          },
        )
      }
    })
  },

  //获取家庭设备信息
  getHomeDevices(homegroupId) {
    return new Promise((resolve, reject) => {
      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
        cardType: [
          {
            type: 'appliance',
            query: {
              homegroupId: homegroupId,
            },
            extra: ['uiTemplate', 'nfcDetail', 'status'],
          },
        ],
      }
      requestService.request('applianceListAggregate', reqData).then(
        (resp) => {
          resolve(resp.data.data)
        },
        (error) => {
          reject(error)
        },
      )
    })
  },

  //轮询获取云端发送的搜索附近朋友设备信息
  getFriendDevices() {
    console.log('轮询倒数', this.data.findFriendTime)
    if (this.data.findFriendTime <= 0) {
      this.clearTimer()
    } else {
      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('getFriendDevices', reqData)
        .then(async (resp) => {
          console.log('获取朋友设备信息结果', resp.data.data)
          if (!resp.data.data) {
            return
          }
          let found = []
          resp.data.data.forEach((item) => {
            item.friends.forEach((ele) => {
              ele.masterApplianceCode = item.masterApplianceCode
              let arr = ele.ssid.split('_')
              ele.category = arr[1].toUpperCase()
              let list = this.data.sceneIconList[ele.category] || ''
              let empty_img = this.data.baseImgUrl + 'scene/sence_img_lack.png'
              if (!list) {
                ele.deviceImg = empty_img
                ele.deviceName = ''
              } else {
                ele.deviceImg = list.common.icon != '' ? list.common.icon : empty_img
                ele.deviceName = list.common.name
              }
              ele.checked = true
              found.push(ele)
            })
          })
          let newFriendList = this.data.friendDevices.concat(found)
          let noRepeatFriendDevices = []
          newFriendList.reduce((prev, cur) => {
            if (!prev[cur.mac]) {
              noRepeatFriendDevices.push(cur)
              prev[cur.mac] = 1
            }
            return prev
          }, {})
          console.log('显示的朋友设备信息', noRepeatFriendDevices)
          this.setData({
            friendDevices: noRepeatFriendDevices,
          })
          app.globalData.friendDevices = noRepeatFriendDevices
          //自发现设备去重找朋友发现的设备
          let ssids = noRepeatFriendDevices.map((item) => {
            return item.ssid
          })
          let noRepeatFoundDevice = this.data.devices.filter((item) => {
            return !ssids.includes(item.SSID)
          })
          this.setData({
            devices: noRepeatFoundDevice,
          })
        })
        .catch((error) => {
          console.log('主设备找朋友设备失败', error)
        })
    }
  },

  getIotDeviceV3() {
    if (wx.getStorageSync('dcpDeviceImgList')) {
      let dcpDeviceImgList = isEmptyObject(app.globalData.dcpDeviceImgList)
        ? wx.getStorageSync('dcpDeviceImgList')
        : app.globalData.dcpDeviceImgList
      console.log(dcpDeviceImgList)
      console.log('dcpDeviceImgList' + 'look我是icon大数据')
      this.setData({
        sceneIconList: dcpDeviceImgList,
      })
    } else {
      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('getIotDeviceV3', reqData)
        .then((resp) => {
          this.setData({
            sceneIconList: resp.data.data.iconList,
          })
          wx.setStorageSync('dcpDeviceImgList', resp.data.data.iconList)
          app.globalData.dcpDeviceImgList = resp.data.data.iconList
        })
        .catch((error) => {
          console.log(error)
        })
    }
  },

  //朋友设备配网
  friendDeviceGoNetwork(e) {
    let targetIndex = e.currentTarget.dataset.index
    let target = this.data.friendDevices[targetIndex]
    this.friendDevicesNetworkClickTrack(target.category)
    if (this.data.friendDevices.length > 1) {
      let list = []
      let other = this.data.friendDevices.filter((item, index) => {
        return index != targetIndex
      })
      list = [target, ...other]
      this.batchNetworkViewTrack()
      this.setData({
        selectFriendDevices: list,
        isOpenModal: true,
      })
    } else {
      this.clearTimer()
      this.friendDeviceNetwork(target)
    }
  },

  //发送给设备配网指令
  friendDeviceNetwork(device) {
    let reqData = {
      reqId: getReqId(),
      stamp: getStamp(),
      appliancesInfo: [
        {
          masterApplianceCode: device.masterApplianceCode,
          mac: device.mac,
          ssid: device.ssid,
        },
      ],
    }
    requestService
      .request('friendDeviceNetwork', reqData)
      .then((resp) => {
        console.log('发送给设备配网指令结果', resp)
        device = JSON.stringify(device)
        wx.navigateTo({
          url: paths.friendDeviceNetWork + `?device=${device}`,
        })
      })
      .catch((error) => {
        wx.showToast({
          title: error.data.msg,
          icon: 'none',
        })
      })
  },
})
