/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
const app = getApp()
import { index, webView, download } from '../../../../utils/paths'
import { hasKey, getStamp, getReqId } from 'm-utilsdk/index'
import { checkFamilyPermission, getFullPageUrl } from '../../../../utils/util.js'
import { requestService, rangersBurialPoint } from '../../../../utils/requestService'
import { isSupportPlugin } from '../../../../utils/pluginFilter'
const bluetooth = require('../../../../common/mixins/bluetooth.js')
const dialogCommonData = require('../../../../common/mixins/dialog-common-data.js')
import { isAddDevice } from '../../../../utils/temporaryNoSupDevices'
import { addDeviceSDK } from '../../../../utils/addDeviceSDK'
import { checkPermission } from '../../../../common/js/checkPermissionTip'
import { baseImgApi } from '../../../../common/js/api'
import paths from '../../../../utils/paths.js'
import { familyPermissionText } from '../../../../common/js/commonText.js'
import { service } from '../../../assets/js/service.js'

Page({
  behaviors: [bluetooth, dialogCommonData],
  data: {
    isHourse: true,
    scanCodeRes: '',
    isScanCodeSuccess: false,
    selectFriendDevices: [], //选择需要配网的朋友设备
    sceneIconList: [], //设备图片和名字
    isOpenModal: false,
    hasOpenOrientation: false,
    hasOpenBluetooth: false,
    baseImgUrl: baseImgApi.url,
    location: {}, //位置权限
    bluetooth: {}, //蓝牙权限
    locationNotice: [], //位置权限相关提示
    bluetoothNotice: [], //蓝牙权限相关提示
    options: {}, //页面传进来的options值保存
    from: '', //从哪进来 scan 微信扫一扫 download H5下载落地页
    device: null, //设备信息
  },

  onLoad: function (options) {
    console.log('中间页参数', options)
    let defineOptions = ''
    let wetChatvirtualPlugin = wx.getStorageSync('wetChatvirtualPlugin')
    let wechatMiddleOptions = wx.getStorageSync('wechatMiddleOptions')
    app.globalData.isFromOtherPage = false //每次重进中间页重置状态
    if (options && options.q) {
      defineOptions = decodeURIComponent(options.q) // 处理options 扫码进入
      console.log('defineOptions', defineOptions)
      this.saveOptions(defineOptions, 'scan')
      this.toMakeGo(defineOptions)
      this.wechatViewTrack()
    } else if (wetChatvirtualPlugin) {
      defineOptions = wetChatvirtualPlugin
      this.saveOptions(defineOptions, 'scan')
      this.toMakeGo(defineOptions)
    } else if (options.tsn || wechatMiddleOptions) {
      //保存h5落地页进入小程序携带的参数,用于小程序未登录，跳转到登录页后，返回此中间页是可以使用携带的参数
      wx.setStorageSync('wechatMiddleOptions', options)
      getApp().globalData.from_download_page = true
      if (options.tsn) {
        this.viewReports()
        this.saveOptions(options, 'download')
        this.checkLogin() //微信扫设备二维码进入H5落地页，再从H5落地页进入小程序配网
      } else {
        this.saveOptions(wechatMiddleOptions, 'download')
        this.checkLogin() //微信扫设备二维码进入H5落地页，再从H5落地页进入小程序配网
      }
    }
  },
  //保存传递过来的options参数
  saveOptions(params, from) {
    this.setData({
      options: params,
      from: from,
    })
  },
  // 处理逻辑
  toMakeGo(defineOptions) {
    if (defineOptions) {
      wx.setStorageSync('wetChatvirtualPlugin', defineOptions)
    }
    let urlStr = this.parseUrl(defineOptions)
    console.log('urlStr', urlStr)
    if (urlStr) {
      this.checkLogin()
    }
  },
  /**
   * 提示不支持配网
   */
  noticeUnsupport() {
    app.globalData.isFromOtherPage = true //进入配网流程，设置是否从其他页面进入中间页为true
    wx.showModal({
      title: '',
      content: '该设备暂不支持小程序配网，我们会尽快开放，敬请期待',
      showCancel: false,
      confirmText: '我知道了',
      success(res) {
        if (res.confirm) {
          wx.switchTab({
            url: index,
          })
        }
      },
    })
  },
  navToLogin() {
    app.globalData.isLogon = false
    let from = true
    wx.setStorageSync('fromWetChat', from)
    wx.switchTab({
      url: index,
    })
  },
  // 校验是否登录
  getLoginStatus() {
    return app
      .checkGlobalExpiration()
      .then((res) => {
        console.log(res)
      })
      .catch((err) => {
        console.log(err)
        app.globalData.isLogon = false
      })
  },
  //解析链接参数
  parseUrl(url) {
    if (!url || typeof url !== 'string' || !url.includes('?')) return {}
    var urls = url.split('?')
    var arr = urls[1].split('&')
    var params = {}
    arr.forEach((str) => {
      let keyLen = this.dealKeyValue(str)
      let key = str.substr(0, keyLen)
      let value = str.substr(keyLen + 1, str.length - keyLen - 1)
      params[key] = value
    })
    return params
  },
  //计算value长度
  dealKeyValue(str) {
    var arr = str.split('=')
    return arr[0].length
  },
  async actionScan(defineOptions) {
    console.log('扫码结果去掉+前', defineOptions)
    defineOptions = defineOptions.replace(/\+/g, '')
    console.log('扫码结果去掉+后', defineOptions)
    if (defineOptions) {
      this.data.scanCodeRes = defineOptions
      const result = defineOptions.replace(/\s*/g, '') //移除空格
      const urlType = this.checkUrlType(result)
      const ifMideaQrcode = this.checkUrlQrcode(result)
      console.log('扫码成功返回', urlType, ifMideaQrcode, result)

      if (!ifMideaQrcode) {
        this.noticeUnsupport()
        return
      }
      if (ifMideaQrcode && !urlType) {
        this.noticeUnsupport()
        return
      }

      let data = {}
      if (urlType && result.includes('cd=')) {
        //美的的密文二维码
        let decodeRes = await this.scanCodeDecode(result)
        console.log('二维码解密接口返回======', decodeRes)
        let { deviceType, mode, sn8, ssid } = decodeRes
        data.category = deviceType
        data.mode = addDeviceSDK.getMode(mode)
        data.sn8 = sn8
        data.ssid = ssid
        console.log('scancodeDecode=========', data)
      } else {
        data = this.getUrlParamy(result)
      }
      //不校验配网灰度配置
      data.isCheckGray = false
      console.log('扫码解析出来数据', data)
      //不校验配网灰度配置
      data.isCheckGray = false
      if (!this.checkIsCanControl(data)) {
        return
      }
      const addDeviceInfo = this.getAddDeviceInfo(data)
      if (addDeviceInfo.moduleType == 0 && addDeviceInfo.category != '0F') {
        this.noticeUnsupport()
        return
      }
      this.clearStorage()
      app.globalData.isFromOtherPage = true //进入配网流程，设置是否从其他页面进入中间页为true
      this.actionGoNetwork(addDeviceInfo)
    }
  },
  //密文二维码扫码解析
  scanCodeDecode(qrCode) {
    let resq = {
      qrCode: qrCode,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('scancodeDecode', resq)
        .then((resp) => {
          console.log('密文二维码扫码解析', resp.data.data)
          resolve(resp.data.data)
        })
        .catch((error) => {
          console.log('密文二维码扫码解析error', error)
          reject(error)
        })
    })
  },
  checkUrlType(result) {
    let tag = false
    if (
      result.includes('//qrcode.midea.com') &&
      (result.includes('tsn') || result.includes('dsn') || result.includes('type'))
    ) {
      tag = true
    }
    if (result.includes('//qrcode.midea.com') && result.includes('cd=')) {
      //美的密文二维码支持
      tag = true
    }
    return tag
  },
  getUrlParamy(result) {
    const map = ['mode', 'type', 'tsn', 'dsn', 'type', 'v', 'SSID']
    if (
      result.includes('//qrcode.midea.com') &&
      (result.includes('tsn') || result.includes('dsn') || result.includes('type'))
    ) {
      const res = result.split('?')[1]
      let list = []
      let paramy = []
      if (res.includes(';')) {
        list = res.split(';')
        console.log('paramy11111111', list)
        list.forEach((item) => {
          let itemList = []

          itemList = item.split('&')
          console.log('paramy2222', itemList)
          paramy = paramy.concat(itemList)
        })
      } else {
        paramy = res ? res.split('&') : []
      }
      console.log('paramy---------', paramy)
      let obj = new Object()
      paramy.forEach((item) => {
        let key = item.split('=')[0]
        let value = item.split('=')[1]
        if (map.includes(key)) {
          obj[key] = value
          if (key == 'type') {
            const type = value
            obj.category = this.compatibleType(type.slice(4, 6))
            const len = type.length
            obj.sn8 = type.slice(len - 8)
          } else if (key == 'mode') {
            obj[key] = addDeviceSDK.getMode(value)
          } else if (key == 'dsn') {
            obj.category = this.compatibleType(value.slice(4, 6))
            obj.sn8 = value.substring(9, 17)
          }
        }
      })
      return obj
    }
  },
  checkUrlQrcode(result) {
    let tag = false
    if (result.includes('//qrcode.midea.com')) {
      tag = true
    }
    if (result.includes('www.midea.com')) {
      tag = true
    }
    return tag
  },
  getSsid(data) {
    if (data.ssid) return data.ssid
    if (data.SSID) return data.SSID
    return ''
  },
  getModuleType(item) {
    if (item.mode == 3 || item.mode == '003') return '1'
    if (item.mode == 5 || item.mode == '005') return '0'
  },
  getAddDeviceInfo(data) {
    const getModuleType = this.getModuleType(data)
    const mode = hasKey(data, 'mode') ? addDeviceSDK.getMode(data.mode) : ''

    const addDeviceInfo = {
      isFromScanCode: true,
      deviceName: '',
      deviceId: '', //设备蓝牙id
      mac: '', //设备mac 'A0:68:1C:74:CC:4A'
      category: hasKey(data, 'category') ? data.category : '', //设备品类 AC
      sn8: hasKey(data, 'sn8') ? data.sn8 : '',
      deviceImg: '', //设备图片
      moduleType: getModuleType, //模组类型 0：ble 1:ble+weifi
      blueVersion: '', //蓝牙版本 1:1代  2：2代
      mode: mode,
      tsn: hasKey(data, 'tsn') ? data.tsn : '',
      fm: 'scanCode',
      SSID: this.getSsid(data),
      isCheckGray: hasKey(data, 'isCheckGray') ? data.isCheckGray : true,
    }
    return addDeviceInfo
  },

  //解析品类兼容
  compatibleType(type) {
    if (type == '00' || type == 'AB') {
      //空调特殊转化
      type = 'ac'
    }
    return type.toLocaleUpperCase()
  },

  //检查登录状态
  checkLogin() {
    this.getLoginStatus().then(() => {
      if (app.globalData.isLogon) {
        this.auth()
      } else {
        this.navToLogin()
      }
    })
  },

  //判断位置和蓝牙授权情况
  async auth(e) {
    let _this = this
    //位置授权判断
    this.setData({
      device: await _this.getDeviceInfo(),
    })
    await this.getLocationRes(true)
    if (!this.data.location.permissionTypeList.locationSetting) {
      wx.authorize({
        scope: 'scope.userLocation',
        async success() {
          await _this.getLocationRes(true)
          await _this.gotoNetwork()
        },
        fail() {},
      })
    }
    //蓝牙授权判断
    await this.getBlueRes(true)
    if (!this.data.bluetooth.permissionTypeList.bluetoothSetting) {
      wx.authorize({
        scope: 'scope.bluetooth',
        async success() {
          await _this.getBlueRes(true)
          await _this.gotoNetwork()
        },
        fail() {},
      })
    }
    await this.gotoNetwork(e)
  },

  //获取位置授权情况
  async getLocationRes(isForceUpdate) {
    let location = await checkPermission.loaction(isForceUpdate)
    this.setData({
      location: location,
      locationNotice: location?.permissionTextList ? location.permissionTextList : [],
    })
    if (this.data.locationNotice.length != 0) {
      let { sn8, category } = this.data.device
      //曝光埋点
      rangersBurialPoint('user_page_view', {
        page_id: 'scan_code_locat_permiss',
        page_name: '扫码中间页-位置权限开启提示',
        module: 'appliance',
        page_path: getFullPageUrl(),
        device_info: {
          sn8: sn8, //sn8码
          widget_cate: category, //设备品类
        },
        ext_info: {
          notice: this.data.locationNotice.join('/'),
        },
      })
    }
  },

  //获取蓝牙授权情况
  async getBlueRes(isForceUpdate) {
    let bluetooth = await checkPermission.blue(isForceUpdate)
    this.setData({
      bluetooth: bluetooth,
      bluetoothNotice: bluetooth?.permissionTextList ? bluetooth.permissionTextList : [],
    })
    if (this.data.bluetoothNotice.length != 0) {
      let { sn8, category } = this.data.device
      //曝光埋点
      rangersBurialPoint('user_page_view', {
        page_id: 'scan_code_bluetooth_permiss',
        page_name: '扫码中间页-蓝牙权限开启提示',
        module: 'appliance',
        page_path: getFullPageUrl(),
        device_info: {
          sn8: sn8, //sn8码
          widget_cate: category, //设备品类
        },
        ext_info: {
          notice: this.data.bluetoothNotice.join('/'),
        },
      })
    }
  },

  //位置蓝牙授权通过后进入配网流程
  async gotoNetwork(e) {
    let { locationNotice, bluetoothNotice } = this.data
    if (locationNotice.length == 0 && bluetoothNotice.length == 0) {
      let go = () => {
        let { options, from } = this.data
        if (from == 'scan') {
          this.actionScan(options)
        } else if (from == 'download') {
          this.toNetwork(options)
        }
      }
      let homeList = await this.getHomeGrouplistService()
      // app.globalData.currentHomeGroupId = homeList[0].homegroupId
      console.log('当前用户家庭列表', homeList)
      if (homeList.length != 0) {
        //检查是否是当前家庭的创建者或管理员，只有创建者或管理员才可以添加设备
        let hasFamilyPermission = checkFamilyPermission({
          currentHomeInfo: homeList[0],
          permissionText: familyPermissionText.addDevice,
          callback: () => {
            wx.reLaunch({
              url: index,
            })
          },
        })
        console.log('hasFamilyPermission', hasFamilyPermission)
        if (hasFamilyPermission) {
          go()
        }
      } else {
        go()
      }
    } else if (e) {
      wx.showToast({
        title: '请按指引完成操作',
        icon: 'none',
        duration: 2000,
      })
    }
  },

  //获取家庭列表
  getHomeGrouplistService() {
    return new Promise((resolve, reject) => {
      service
        .getHomeGrouplistService()
        .then((resp) => {
          resolve(resp)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },

  //查看位置权限以及是否打开指引
  lookLocationGuide() {
    wx.navigateTo({
      url: paths.locationGuide + `?permissionTypeList=${JSON.stringify(this.data.location.permissionTypeList)}`,
    })
  },

  //查看蓝牙权限以及是否打开指引
  lookBluetoothGuide() {
    wx.navigateTo({
      url: paths.blueGuide + `?permissionTypeList=${JSON.stringify(this.data.bluetooth.permissionTypeList)}`,
    })
  },

  //获取设备信息用于埋点
  async getDeviceInfo() {
    let device = {
      sn8: '',
      category: '',
    }
    if (this.data.from == 'download') {
      let { sn8, category } = this.data.options
      device.sn8 = sn8
      device.category = category
    }
    if (this.data.from == 'scan') {
      let result = this.data.options.replace(/\s*/g, '') //移除空格
      let urlType = this.checkUrlType(result)
      if (urlType && result.includes('cd=')) {
        //美的的密文二维码
        let decodeRes = await this.scanCodeDecode(result)
        let { deviceType, mode, sn8, ssid } = decodeRes
        device.category = deviceType
        device.mode = addDeviceSDK.getMode(mode)
        device.sn8 = sn8
        device.ssid = ssid
      } else {
        device = this.getUrlParamy(result)
      }
    }
    return device
  },

  //微信扫码进入h5落地页，从h5落地页进入小程序配网
  toNetwork(options) {
    let { category, sn8, tsn, mode } = options

    let device = {
      category: category,
      sn8: sn8,
      tsn: tsn,
      fm: 'scanCode',
      isCheckGray: false, //不校验配网灰度配置
    }

    let param = {
      mode: addDeviceSDK.getMode(mode),
      category: category,
      code: sn8,
      queryType: 2,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    console.log('[获取配网指引参数]', param)
    requestService
      .request('multiNetworkGuide', param)
      .then((res) => {
        console.log('获取配网指引结果', res)
        let mode = res.data.data.mainConnectinfoList[0].mode
        let guideInfo = res
        if (mode == 1 || mode == '') {
          mode = 0
        }
        device['mode'] = mode
        device['guideInfo'] = guideInfo
        if (this.checkIsCanControl(device)) {
          this.clearStorage()
          app.globalData.isFromOtherPage = true //进入配网流程，设置是否从其他页面进入中间页为true
          this.actionGoNetwork(device)
        }
      })
      .catch((err) => {
        console.log('error=====', err)
        this.noticeUnsupport()
      })
  },

  //检查小程序是否支持设备配网以及是否能在小程序中控制该设备
  checkIsCanControl(deviceInfo) {
    //判断mode是否是小程序支持的配网方式
    if (!addDeviceSDK.isSupportAddDeviceMode(deviceInfo.mode)) {
      this.noticeUnsupport()
      return false
    }
    //判断是否是小程序支持的品类
    let formatType = '0x' + deviceInfo.category.toLocaleUpperCase()
    if (!isSupportPlugin(formatType, deviceInfo.sn8)) {
      this.noticeUnsupport()
      return false
    }
    //判断设备是否是未测试品类，未测试品类不支持小程序配网
    if (!isAddDevice(deviceInfo.category.toLocaleUpperCase(), deviceInfo.sn8)) {
      this.noticeUnsupport()
      return false
    }
    return true
  },

  clearStorage() {
    wx.setStorageSync('wetChatvirtualPlugin', '')
    wx.setStorageSync('wechatMiddleOptions', '')
  },

  onReady: function () {},

  onShow: function () {
    //判断是否是从其他页面返回到中间页，如果是则跳首页
    if (app.globalData.isFromOtherPage) {
      app.globalData.isFromOtherPage = false //跳转完重置状态
      wx.switchTab({
        url: paths.index,
      })
    }
  },

  onHide: function () {},

  onUnload: function () {
    getApp().onUnloadCheckingLog()
  },

  onPullDownRefresh: function () {},

  onReachBottom: function () {},
})
