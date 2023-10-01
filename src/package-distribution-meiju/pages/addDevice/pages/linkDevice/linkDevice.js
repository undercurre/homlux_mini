/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
const app = getApp()
const bleNeg = require('../../../../utils/ble/ble-negotiation')
const addDeviceMixin = require('../assets/js/addDeviceMixin')
const wahinMixin = require('../wahinProtocol/mixin/wahinMixin')
const netWordMixin = require('../../../assets/js/netWordMixin')
const paths = require('../../../../utils/paths')
const log = require('../../../../utils/log')
let checkLinkFamilyWifTimer
let timer
let udpCycTimer
import DeviceComDecorator from '../wahinProtocol/utils/ac-service/DeviceComDecorator'
import BluetoothConn from '../wahinProtocol/bluetooth/bluetooth-conn.js'
import {requestService} from '../../../../utils/requestService'
import {
  ab2hex,
  asiiCode2Str,
  cloudDecrypt,
  cloudEncrypt,
  concatUint8Array,
  formatTime,
  getRandomString,
  getReqId,
  getStamp,
  hex2bin,
  hexCharCodeToStr,
  hexString2Uint8Array,
  hexStringToArrayBuffer,
  isEmptyObject,
  requestWithTry,
  string2Uint8Array,
  toHexString,
  uintArray2String,
} from 'm-utilsdk/index'
import {checkFamilyPermission} from '../../../../utils/util'
import {getScanRespPackInfo, getSn8} from '../../../../utils/blueAdDataParse'
import {isSupportPlugin} from '../../../../utils/pluginFilter'
import {constructionBleOrder, paesrBleResponData} from '../../../../utils/ble/ble-order'
import {api, imgBaseUrl} from '../../../../common/js/api'
import {apParamsSet} from '../assets/js/apParamsSet'

import {blueParamsSet} from '../assets/js/blueParamsSet'

import {service} from '../assets/js/service'
import WifiMgr from '../assets/js/wifiMgr'
import {addDeviceSDK} from '../../../../utils/addDeviceSDK'
import computedBehavior from '../../../../utils/miniprogram-computed.js'
import {familyPermissionText} from '../../../../common/js/commonText.js'
import {bytesToHexString, IntToBytes, stringToHashCode} from '../../utils/util'
import {setWifiStorage} from '../../utils/wifiStorage'

import Dialog from '../../../../../miniprogram_npm/m-ui/mx-dialog/dialog'
import {imgesList} from '../../../assets/js/shareImg.js'

let appKey = api.appKey

const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
const brandStyle = require('../../../assets/js/brand.js')
const imgUrl = imgBaseUrl.url + '/shareImg/' + brandStyle.brand
let wifiMgr = new WifiMgr()

Page({
  behaviors: [bleNeg, addDeviceMixin, wahinMixin, netWordMixin, computedBehavior, getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    navTop: app.globalData.statusNavBarHeight,
    deviceName: '',
    deviceId: '', // 'A0:68:1C:74:CC:4A' 华凌：'A0:68:1C:BC:38:27'
    mode: app.addDeviceInfo.mode || null,
    negType: 2,
    moduleType: '',
    addDeviceInfo: {},
    combinedDeviceInfo: [{sn: '', a0: ''}],
    time: 80,
    curStep: 0,
    currentRoomId: 0,
    progressList: [
      {
        name: '连接准备',
        isFinish: false,
      },
      {
        name: '设备联网',
        isFinish: false,
      },
      {
        name: '帐号绑定',
        isFinish: false,
      },
    ],
    isOnbleResp: true,
    bindWifiInfo: {},
    isCancelHuaLinOn: false, //是否取消监听华凌直连
    isCancelOnwaHinLink: false, //是否取消监听华凌配网
    udpAdData: {}, //udp广播
    randomCode: '',
    blueRandomCode: '', //蓝牙配网随机数
    deviceImg: '',
    deviceImgLoaded: false,
    isLinkFamilyWifi: false, //是否连接上家庭wifi
    isBackLinkRoute: false, //是否成功回连路由
    customDialog: {}, //自定义放弃弹窗
    // startGetDeviceLinkCloud: false, //开始查询设备是否连上云
    isLinkcloud: false, //是否成功连上云
    isSuccessLinkDeviceAp: false, //是否成功连上设备ap
    isSuccessDirectConnect: false, //是否成功直连
    isMamualLinkFamilyWifi: false, //是否去主动连接家庭wifi
    isHasUdpData: false, //是否收到udp设备消息
    changePswDialog: {}, //密码错误重新输入弹窗
    isLinkTcpSuccess: false, //tcp连接是否成功
    curIp: '', //手机当前ip
    udpBroadcastAddress: '', //udp广播地址
    plainSn: '', //原始未加密32位的sn
    aplinkOrder: '', //ap配网完整指令
    apIsSendWifiInfo: false, //ap 配网是否发送了wifi消息
    apIsSendCombinedInfo: false, //ap 配网是否发送0074指令
    deviceRecWifiInfo: false, //设备是否收到wifi信息
    isEndTcpRetry: false, //设备是停止tcp重试
    checkExists: false, //是否已经调用过查云函数
    tcpRetryNum: 7, //tcp重试次数
    timeoutNum: 0,
    isPopupDeviceWifiYetSwitch: false, //是否弹出过设备wifi被切走的提示窗
    pageStatus: 'show',
    curLinkWifiInfo: null, //当前连接的wifi信息
    msmartBlueLinkNetYetWifiInfo: false, //msmart blue是否已发送wifi信息
    autoCloseBleConnection: false, //是否主动断开蓝牙连接
    isShowOpenlocaltNetTip: false, //是否已提示打开本地网络
    brand: '',
    ishowDialog: false, //是否显示组件库弹窗
    dialogStyle: brandStyle.brandConfig.dialogStyle, //弹窗样式
    unSupportDialogData: brandStyle.brandConfig.unSupportDialogData, //不支持插件弹窗内容
    messageContent: '',
    titleContent: '',
    brandConfig: brandStyle.brandConfig,
    tipIcon: './assets/img/icon_orange.svg',
  },
  bluePswFailDialogShowNum: 0, // 蓝牙配网密码错误弹窗已展示次数
  orderTimeout: 5000, // 指令未收到回报的超时时间
  isTcpRespond0074: false, // TCP是否响应0074指令
  ifLowUDPRespond0043: false, // UDP<2模组是否回报0043指令
  ifLowUDPRespond0020: false, // UDP<2模组是否回报0020指令
  ifLowUDPRespond0068: false, // UDP<2模组是否回报0068指令
  timeout0068: null, // 0068指令重试定时器
  errorMsgMap0068: {
    '01': 'WIFI硬件原因保存参数失败',
    '02': 'SSID长度大于32或小于1',
    '03': 'PASSWORD长度小于8或大于32',
    '04': '加密方式错误',
  }, // 0068指令错误码对照表
  ifLowUDPRespond0081: false, // UDP<2模组是否回报0081指令
  isBleRespond63: false, // 蓝牙是否响应0x63-03指令
  isBleRespond40: false, // 蓝牙是否响应0x40指令
  computed: {},
  async init() {
    const this_ = this
    setTimeout(() => {
      this.setData({
        curStep: 1,
        // 'progressList[1].isFinish':true
      })
    }, 2000)
    let {
      deviceId,
      deviceName,
      mac,
      type,
      sn8,
      moduleType,
      blueVersion,
      mode,
      deviceImg,
      adData, //广播
      fm,
      rssi,
      enterprise,
      curWifiInfo,
      apUtils,
      bigScreenScanCodeInfo, //触碰配网扫码info
      isCanDrivingLinkDeviceAp, //是否需要主动连接设备ap
      sn,
      msmartBleWrite,
    } = app.addDeviceInfo
    console.log('连接设备图片:', deviceImg)
    this.setData({
      addDeviceInfo: app.addDeviceInfo,
      combinedDeviceInfo: app.combinedDeviceInfo,
      deviceImg: deviceImg,
      deviceName: deviceName,
      btMac: mac,
      mode: mode,
    })
    this.apUtils = apUtils //分包异步加载
    console.log('app.addDeviceInfo =====', app.addDeviceInfo)
    this.logAddDivceInfo('添加设备参数', app.addDeviceInfo)
    this.apLogReportEven({
      msg: '添加设备参数',
      res: app.addDeviceInfo,
    })
    let needTimingMode = [0, 3, 5, 20, 21, 30, 31]
    if (needTimingMode.includes(mode)) {
      //蓝牙、ap相关才有倒计时
      this.timing(mode)
    }
    if (Number(mode) == 0) {
      if (!apUtils) {
        app.addDeviceInfo.apUtils = await require.async('../../../assets/asyncSubpackages/apUtils.js')
        this.apUtils = app.addDeviceInfo.apUtils
      }
    }
    if (mode != 0) {
      console.log('进度页其他配网家庭id', app.globalData.currentHomeGroupId)
      log.info('进度页其他配网家庭id', app.globalData.currentHomeGroupId)

      try {
        if (!app.globalData.currentHomeGroupId) {
          //无加载到默认家庭
          console.log('获取当前家庭id')
          app.globalData.currentHomeGroupId = await this.getCurrentHomeGroupId()
          console.log('进度页其他配网家庭id 获取到', app.globalData.currentHomeGroupId)
        }
        let {currentRoomId, currentRoomName, currentHomeGroupId} = app.globalData
        if (currentRoomId && currentRoomName) {
          console.log('已有家庭信息================')
          this.setData({
            currentRoomId: currentRoomId,
            currentRoomName: currentRoomName,
          })
          this.checkCurrentFamilyPermission(currentHomeGroupId, app.globalData.homeGrounpList)
        } else {
          let familyInfo = await this.getFamilyInfo(app.globalData.currentHomeGroupId)
        }
      } catch (err) {
        console.error(err)
      }
    }
    console.log('addDeviceInfo====', app.addDeviceInfo)
    let negType = 2
    let isDirectCon
    let orderType
    let systemInfo //系统信息
    let bindType = addDeviceSDK.mode2bindType(mode, moduleType)
    let ip = ''
    let model = app.globalData.systemInfo.brand
    let wifiInfoOrder
    let key
    let plainTextSn
    let key3
    let bindInfo
    let key4 = app.globalData.userData.key
    let plainSn
    let bindInfo8
    app.addDeviceInfo.bindType = bindType
    if (app.addDeviceInfo.adData) {
      app.addDeviceInfo.isFeature = getScanRespPackInfo(app.addDeviceInfo.adData).isFeature // 重新计算isFeature值
    }
    console.log('===最新isFeature值===', app.addDeviceInfo.isFeature)
    this.setData({
      addDeviceInfo: app.addDeviceInfo,
      deviceName: deviceName,
      bindType: bindType,
      btMac: mac,
      mode: mode,
      currentHomeGroupId: app.globalData.currentHomeGroupId,
    })
    //统一读取wifi缓存信息
    if (curWifiInfo) {
      // this.data.bindWifiInfo = this.apUtils.decodeWifi(wx.getStorageSync('bindWifiInfo'))
      this.data.bindWifiInfo = curWifiInfo
    }
    switch (Number(mode)) {
      case 0: //ap link
        this.data.udpAdData = await this.getUdpInfo()
        this.setData({
          curStep: 1,
          'progressList[0].isFinish': true,
        })
        if (this.data.udpAdData.tcpIp == '0.0.0.0') {
          this.data.udpAdData.tcpIp = '192.168.1.1'
        }
        udpCycTimer && clearInterval(udpCycTimer)
        this.getApLinkData() // 解析udp数据存入addDeviceInfo
        let isShowUnSupportDialog = false // 不支持插件弹窗显示标识
        let isShowColmoUnSupportDialog = false // colmo旧设备弹窗显示标识
        console.log('当前品牌：' + brandStyle.brand)
        if (this.data.brandConfig.supportPluginFlag) {
          if (brandStyle.brand == 'colmo') {
            if (!this.isColmoDeviceByDecodeSn(this.data.plainSn) && !this.isColmoDeviceBySn8(this.data.udpAdData.sn8)) {
              isShowColmoUnSupportDialog = true
              isShowUnSupportDialog = true
            } else {
              isShowUnSupportDialog = !isSupportPlugin(`0x${type.toLocaleUpperCase()}`, app.addDeviceInfo.sn8)
            }
          } else {
            isShowUnSupportDialog = !isSupportPlugin(
              `0x${type.toLocaleUpperCase()}`,
              app.addDeviceInfo.sn8,
              app.addDeviceInfo.a0,
              '0',
            )
          }
        }
        // 不支持插件弹窗提示
        if (isShowUnSupportDialog) {
          if (isShowColmoUnSupportDialog) {
            Dialog.confirm({
              title: '抱歉，该设备暂不支持小程序配网。',
              confirmButtonText: '返回首页',
              confirmButtonColor: this_.data.dialogStyle.confirmButtonColor2,
              cancelButtonColor: this_.data.dialogStyle.cancelButtonColor2,
            }).then((res) => {
              if (res.action == 'confirm') {
                wx.reLaunch({
                  url: paths.index,
                })
              }
            })
          } else {
            Dialog.confirm({
              confirmButtonColor: this_.data.dialogStyle.confirmButtonColor2,
              cancelButtonColor: this_.data.dialogStyle.cancelButtonColor2,
              ...this_.data.unSupportDialogData,
            })
              .then((res) => {
                if (res.action == 'confirm') {
                  // 点击埋点
                  this_.apLinkAbout()
                }
              })
              .catch((res) => {
                if (res.action == 'cancel') {
                  // 关闭相关进程和连接
                  clearInterval(timer)
                  if (mode == 0) {
                    // AP
                    this_.data.isStopGetExists = true // 停止查询设备是否联网
                    udpCycTimer && clearInterval(udpCycTimer)
                    this_.tcp && this_.finishTcp()
                  }
                  wx.reLaunch({
                    url: paths.index,
                  })
                }
              })
          }
        } else {
          this.apLinkAbout()
        }
        this.closeUdp()
        break
      case 5:
        //直连 绑定
        systemInfo = await this.wxGetSystemInfo()
        if (!systemInfo.bluetoothEnabled) {
          //未打开蓝牙
          this.noOpenBlue()
          return
        }
        isDirectCon = true
        this.bleNegotiation(deviceId, isDirectCon, moduleType, negType)
        this.resisterOnLinkBleSuccess((res) => {
          //蓝牙连接成功
        })
        this.resisterOnBlebindSuccess((res) => {
          console.log('on bind success----------------', res)
          log.info('AC direct connect success')
          app.addDeviceInfo.moduleVersion = this.data.wifi_version
          wx.closeBLEConnection({
            deviceId: app.addDeviceInfo.deviceId,
          })
          this.linkSuccess()
          // clearInterval(timer)
          // app.addDeviceInfo.sn = this.data.sn
          // wx.navigateTo({
          //     url: `/package-distribution-meiju/pages/addDevice/pages/addSuccess/addSuccess`
          // })
        })
        break
      case 3:
        systemInfo = await this.wxGetSystemInfo()
        if (!systemInfo.bluetoothEnabled) {
          //未打开蓝牙
          this.noOpenBlue()
          return
        }
        //蓝牙协商
        isDirectCon = false
        if (fm == 'bluePugin') {
          this.bleNegotiation(deviceId, true, moduleType, 3)
          this.resisterOnBlebindSuccess((res) => {
            key = app.globalData.isLogon ? app.globalData.userData.key : ''
            plainTextSn = cloudDecrypt(this.data.sn, key, api.appKey)
            this.data.plainSn = plainTextSn
            app.addDeviceInfo.plainSn = plainTextSn
            app.addDeviceInfo.moduleVersion = this.data.wifi_version
            console.log('sn解密后', plainTextSn)
            this.setData({
              curStep: 1,
              'progressList[0].isFinish': true,
            })
            //校验绑定码成功
            console.log('on neg success----------------', res)
            log.info('msmart bluetooht neg success')
            this.sendWifiInfo(this.data.bindWifiInfo, blueVersion)
            this.againGetAPExists(this.data.sn, this.data.blueRandomCode, async (resp) => {
              console.log('设备成功连上云', resp)
              this.setData({
                //完成进度条
                curStep: 2,
                'progressList[1].isFinish': true,
              })
              // 'progressList[2].isFinish': true,
              log.info('device success link cloud')
              wx.closeBLEConnection({
                deviceId: app.addDeviceInfo.deviceId,
              })
              this.data.autoCloseBleConnection = true
              let bindRes = await this.bindDeviceToHome()
              console.log('绑定设备至默认家庭房间', resp)

              let plainSn = addDeviceSDK.getDeviceSn(bindRes.data.data.sn)
              app.addDeviceInfo.cloudBackDeviceInfo = bindRes.data.data
              app.addDeviceInfo.cloudBackDeviceInfo.roomName = this.data.currentRoomName
              app.addDeviceInfo.cloudBackDeviceInfo.sn8 = addDeviceSDK.getDeviceSn8(plainSn)
              wx.reLaunch({
                url: paths.wifiSuccessSimple,
              })
            })
            this.resisterBleDataChanged(this.handleBLEDataChanged) // 注册蓝牙信息改变监听
          })
          return
        } else {
          app.addDeviceInfo.sn8 = getSn8(adData)
          this.bleNegotiation(deviceId, isDirectCon, moduleType, negType)
        }
        this.registerBLEConnectionStateChange((res) => {
          console.log('[蓝牙状态发生变化2]', res)
          if (
            !res.connected &&
            !this.data.msmartBlueLinkNetYetWifiInfo &&
            this.data.time > 20 &&
            !this.data.autoCloseBleConnection
          ) {
            console.log('[重新连接]')
            this.bleNegotiation(deviceId, isDirectCon, moduleType, negType)
          }
        })
        //蓝牙连接成功
        this.resisterOnLinkBleSuccess((res) => {
        })
        //密钥协商
        this.resisterOnBleNegSuccess(async (res) => {
          console.log('on neg success----------------', res)
          key = app.globalData.isLogon ? app.globalData.userData.key : ''
          plainTextSn = cloudDecrypt(this.data.sn, key, api.appKey)
          this.data.plainSn = plainTextSn
          app.addDeviceInfo.plainSn = plainTextSn
          app.addDeviceInfo.moduleVersion = this.data.wifi_version
          console.log('sn解密后', plainTextSn)
          let a0 = res.A0 || res.data.A0
          a0 = a0.split(',')
          a0.reverse()
          a0 = a0.join('')
          a0 = parseInt(a0, 16)
          app.addDeviceInfo.a0 = a0 // 截取主设备a0
          log.info('msmart bluetooht neg success')
          this.resisterBleDataChanged(this.handleBLEDataChanged) // 注册蓝牙信息改变监听
          // 组合设备新增指令
          console.info('是否查询0x63-03？' + app.addDeviceInfo.isFeature)
          if (this.data.brandConfig.combinedDevice && app.addDeviceInfo.isFeature) {
            let randomHex = this.data.blueRandomCode ? this.data.blueRandomCode : getRandomString(32) //密码错误重试复用随机数不变
            this.data.blueRandomCode = randomHex.toLocaleLowerCase()
            // 获取组合配网标识
            await this.delayAwait(2000)
            this.getCombinedFlag()
            await this.delayAwait(2000)
          } else {
            app.addDeviceInfo.combinedDeviceFlag = false
            this.sendWifiInfo(this.data.bindWifiInfo, blueVersion)
            this.data.msmartBlueLinkNetYetWifiInfo = true //发送了wifi信息
          }
          this.setData({
            curStep: 1,
            'progressList[0].isFinish': true,
          })
          this.againGetAPExists(this.data.sn, this.data.blueRandomCode, async (resp) => {
            console.log('设备成功连上云', resp)
            this.setData({
              //完成进度条
              curStep: 2,
              'progressList[1].isFinish': true,
            })
            log.info('device success link cloud')
            this.data.autoCloseBleConnection = true
            wx.closeBLEConnection({
              deviceId: app.addDeviceInfo.deviceId,
            })
            this.linkSuccess()
          })
          this.resisterBleDataChanged(this.handleBLEDataChanged) // 注册蓝牙信息改变监听
        })
        break
      case 20:
        //先直连 后配网 （遥控器协议）
        this.wahinBleBind(deviceId, adData, mode)
        break
      case 21:
        //后配网 遥控器
        console.log('adddviceinfo--------', app.addDeviceInfo)
        this.data.sn = app.addDeviceInfo.sn
        key = app.globalData.isLogon ? app.globalData.userData.key : ''
        plainTextSn = cloudDecrypt(this.data.sn, key, api.appKey)
        this.data.plainSn = plainTextSn
        app.addDeviceInfo.plainSn = plainTextSn
        console.log('sn解密后', plainTextSn)
        this.wahinBleBind(deviceId, adData, mode)
        break

      case 30:
        isDirectCon = true
        negType = 2
        this.bleNegotiation(deviceId, isDirectCon, moduleType, negType)
        // this.resisterOnLinkBleSuccess(res => { //蓝牙连接成功
        //     burialPoint.connectWifiDeviceHotspot({ //成功建立蓝牙协商埋点
        //         deviceSessionId: app.globalData.deviceSessionId,
        //         type: app.addDeviceInfo.type,
        //         sn8: app.addDeviceInfo.sn8,
        //         moduleVersion: app.addDeviceInfo.blueVersion,
        //         linkType: app.addDeviceInfo.linkType,
        //         ssid: app.addDeviceInfo.ssid,
        //         rssi: app.addDeviceInfo.rssi
        //     })
        // })
        this.resisterOnBlebindSuccess((res) => {
          if (this.data.isSuccessDirectConnect) return
          this.data.isSuccessDirectConnect = true
          console.log('on bind success----------------', res)
          if (!this.data.isOnbleResp) return
          key = app.globalData.isLogon ? app.globalData.userData.key : ''
          plainTextSn = cloudDecrypt(this.data.sn, key, api.appKey)
          this.data.plainSn = plainTextSn
          app.addDeviceInfo.plainSn = plainTextSn
          app.addDeviceInfo.moduleVersion = this.data.wifi_version
          console.log('sn解密后', plainTextSn)
          app.addDeviceInfo.msmartBleWrite = this.writeData //蓝牙写入方法暂存
          this.linkSuccess()
          // app.addDeviceInfo.sn = this.data.sn
        })
        break

      case 31:
        this.data.sn = sn
        key = app.globalData.isLogon ? app.globalData.userData.key : ''
        plainTextSn = cloudDecrypt(this.data.sn, key, api.appKey)
        this.data.plainSn = plainTextSn
        app.addDeviceInfo.plainSn = plainTextSn
        console.log('sn解密后', plainTextSn)
        console.log('msmart mode 31 sn--------', this.data.sn)
        log.info('msmart bluetooht neg success')
        wifiInfoOrder = this.sendWifiInfo(this.data.bindWifiInfo, blueVersion, false)
        if (msmartBleWrite) {
          console.log('msmartBleWrite--------', msmartBleWrite)
          msmartBleWrite(wifiInfoOrder) //蓝牙写入
          this.setData({
            curStep: 1,
            'progressList[0].isFinish': true,
          })
          // const key = app.globalData.isLogon ? app.globalData.userData.key : ''
          // const plainTextSn = cloudDecrypt(this.data.sn, key, api.appKey)
          // console.log("sn解密后", plainTextSn)
          this.againGetAPExists(this.data.sn, this.data.blueRandomCode, async (resp) => {
            console.log('设备成功连上云', resp)
            this.setData({
              //完成进度条
              curStep: 2,
              'progressList[1].isFinish': true,
            })
            // progressList[2].isFinish': true
            log.info('device success link cloud')
            let bindRes = await this.bindDeviceToHome()
            console.log('绑定设备至默认家庭房间', resp)
            let plainSn = addDeviceSDK.getDeviceSn(bindRes.data.data.sn)
            app.addDeviceInfo.cloudBackDeviceInfo = bindRes.data.data
            app.addDeviceInfo.cloudBackDeviceInfo.roomName = this.data.currentRoomName
            app.addDeviceInfo.cloudBackDeviceInfo.sn8 = addDeviceSDK.getDeviceSn8(plainSn)
            app.addDeviceInfo.cloudBackDeviceInfo.bindType = 2
            // let type0x = app.addDeviceInfo.cloudBackDeviceInfo.type
            // let deviceInfo = encodeURIComponent(JSON.stringify(app.addDeviceInfo.cloudBackDeviceInfo))
            // wx.closeBLEConnection({ //断开连接
            //     deviceId: app.addDeviceInfo.deviceId
            // })
            wx.reLaunch({
              url: paths.wifiSuccessSimple,
            })
            clearInterval(timer)
          })
          // 先取消直连阶段的特征值变化监听，再创建新的监听
          wx.offBLECharacteristicValueChange()
          wx.onBLECharacteristicValueChange((characteristic) => {
            console.log('@module linkDevice.js\n@method init\n@desc 收到设备消息\n', ab2hex(characteristic.value))
            const value = this.isGroup(ab2hex(characteristic.value))
            if (!value) {
              console.warn('@module linkDevice.js\n@method init\n@desc 未完成组包\n', ab2hex(characteristic.value))
              return
            }
            this.handleBLEDataChanged(value, characteristic)
          })
        } else {
          this.bleNegotiation(deviceId, true, moduleType, 3) //已做直连 传3校验绑定码
          this.resisterOnBlebindSuccess((res) => {
            //校验协商成功
            key = app.globalData.isLogon ? app.globalData.userData.key : ''
            plainTextSn = cloudDecrypt(this.data.sn, key, api.appKey)
            this.data.plainSn = plainTextSn
            app.addDeviceInfo.plainSn = plainTextSn
            app.addDeviceInfo.moduleVersion = this.data.wifi_version
            console.log('sn解密后', plainTextSn)
            console.log('on neg success----------------', res)
            log.info('msmart bluetooht neg success')
            // 组合设备新增指令
            // console.info('是否查询0x63-03？'+app.addDeviceInfo.isFeature)
            // if(this.data.brandConfig.combinedDevice && app.addDeviceInfo.isFeature){
            //   this.getCombinedFlag()
            // }
            this.sendWifiInfo(this.data.bindWifiInfo, blueVersion)
            this.data.msmartBlueLinkNetYetWifiInfo = true //发送了wifi信息
            this.setData({
              curStep: 1,
              'progressList[0].isFinish': true,
            })
            this.againGetAPExists(this.data.sn, this.data.blueRandomCode, async (resp) => {
              console.log('设备成功连上云', resp)
              this.setData({
                //完成进度条
                curStep: 2,
                'progressList[1].isFinish': true,
              })
              // progressList[2].isFinish': true
              log.info('device success link cloud')
              wx.closeBLEConnection({
                deviceId: app.addDeviceInfo.deviceId,
              })
              let bindRes = await this.bindDeviceToHome()
              console.log('绑定设备至默认家庭房间', resp)
              let plainSn = addDeviceSDK.getDeviceSn(bindRes.data.data.sn)
              app.addDeviceInfo.cloudBackDeviceInfo = bindRes.data.data
              app.addDeviceInfo.cloudBackDeviceInfo.roomName = this.data.currentRoomName
              app.addDeviceInfo.cloudBackDeviceInfo.sn8 = addDeviceSDK.getDeviceSn8(plainSn)
              app.addDeviceInfo.cloudBackDeviceInfo.bindType = 2
              // let type0x = app.addDeviceInfo.cloudBackDeviceInfo.type
              // let deviceInfo = encodeURIComponent(JSON.stringify(app.addDeviceInfo.cloudBackDeviceInfo))
              // wx.closeBLEConnection({ //断开连接
              //     deviceId: app.addDeviceInfo.deviceId
              // })
              wx.reLaunch({
                url: paths.wifiSuccessSimple,
              })
              clearInterval(timer)
            })
            this.resisterBleDataChanged(this.handleBLEDataChanged) // 注册蓝牙信息改变监听
          })
        }
        break
      case 100:
        key3 = app.globalData.userData.key
        this.data.sn = cloudEncrypt(bigScreenScanCodeInfo.sn, key3, appKey)
        console.log('key and enCOdesn', key3, this.data.sn)
        bindInfo = {
          mode: mode,
          verificationCode: bigScreenScanCodeInfo.verificationCode,
          verificationCodeKey: bigScreenScanCodeInfo.verificationCodeKey,
        }
        try {
          await this.bindDeviceToHome(bindInfo)
          app.addDeviceInfo.sn = this.data.sn
          this.setData({
            //完成进度条
            curStep: 2,
            'progressList[2].isFinish': true,
          })
          wx.reLaunch({
            url: paths.addSuccess,
          })
        } catch (error) {
          console.log('触屏绑定失败====', error)
          this.goLinkDeviceFailPage(1301)
        }
        break
      case 8:
        key4 = app.globalData.userData.key
        plainSn = app.addDeviceInfo.plainSn
        console.log('key and enCOdesn', plainSn, key4, appKey)
        this.data.sn = cloudEncrypt(plainSn, key4, appKey)
        console.log('key and enCOdesn')
        bindInfo8 = {
          mode: mode,
        }
        try {
          const bindReset = await this.bindDeviceToHome(bindInfo8)
          app.addDeviceInfo.deviceName = bindReset.data.data.name
          this.setData({
            //完成进度条
            curStep: 2,
            'progressList[2].isFinish': true,
          })
          wx.reLaunch({
            url: paths.addSuccess,
          })
        } catch (error) {
          this.goLinkDeviceFailPage(1301)
        }
        break
    }
  },

  /**
   * 设备图片加载成功
   */
  devivceImgSuccess(e) {
    console.log('@module linkDevice.js\n@method devivceImgSuccess\n@desc 设备图片加载成功\n', e)
    this.setData({
      deviceImgLoaded: true,
    })
  },

  /**
   * 设备图片加载失败
   */
  deviceImgError(e) {
    console.error('@module linkDevice.js\n@method deviceImgError\n@desc 设备图片加载失败\n', e)
    log.error('@module linkDevice.js\n@method deviceImgError\n@desc 设备图片加载失败\n', e)
  },

  //监听wifi切换
  async onWifiSwitch() {
    if (this.data.apIsSendWifiInfo) return //已发送wifi信息
    try {
      let wifiInfo = await wifiMgr.getConnectedWifi()
      this.data.curLinkWifiInfo = wifiInfo
      console.log('[on wifi switch]', wifiInfo)
      if (wifiInfo.SSID != app.addDeviceInfo.ssid) {
        //连接的不是设备wifi
        this.deviceWifiYetSwitchTip() //设备wifi被切提示重连
      } else {
        if (this.data.isPopupDeviceWifiYetSwitch && this.data.udpAdData) {
          //重新发wifi信息
          console.log('[重新发wifi信息]')
          let {tcpIp, tcpPort} = this.data.udpAdData
          this.createTCP(tcpIp, tcpPort)
        }
      }
      if (this.data.pageStatus == 'show') {
        this.delay(1500).then((end) => {
          this.onWifiSwitch()
        })
      }
    } catch (error) {
      console.log('[get connected wifi fail]', error)
      getApp().setMethodFailedCheckingLog(
        'wx.getConnectedWifi()',
        `调用微信接口wx.getConnectedWifi()异常。error=${JSON.stringify(error)}`,
      )
      if (this.data.pageStatus == 'show') {
        this.delay(1500).then((end) => {
          this.onWifiSwitch()
        })
      }
    }
  },

  //ap配网密码错误重新发送配网指令
  retrySendApLinknetOrder() {
    let self = this
    this.setData({
      //取消弹窗
      changePswDialog: {
        show: true,
        title: 'WiFi密码错误',
        desc: '请确认并重新输入密码',
        wifiInfo: self.data.bindWifiInfo,
        confirmText: this.data.brand == 'colmo' ? '确定' : '重试',
        confirmColor: '#267AFF',
        success(res) {
          console.log(res)
          if (res.confirm) {
            //重试
            self.data.bindWifiInfo.PswContent = res.psw
            app.addDeviceInfo.curWifiInfo = self.data.bindWifiInfo
            //重新发送wifi信息指令
            let linkOrder = self.constrLinknetorder()
            self.tcp.write(hexStringToArrayBuffer(linkOrder))
          }
        },
      },
    })
  },
  /**
   * 蓝牙配网密码错误弹窗
   */
  bluePswFailDialog() {
    const self = this
    const {blueVersion, mode, msmartBleWrite} = app.addDeviceInfo
    clearInterval(timer) // 暂停页面计时
    this.bluePswFailDialogShowNum++ // 增加已展示次数
    console.log(
      `@module linkDevice.js\n@method bluePswFailDialog\n@desc 密码错误弹窗第${this.bluePswFailDialogShowNum}次展示`,
    )
    // 显示弹窗
    this.setData({
      changePswDialog: {
        show: true,
        title: '请确认WiFi密码',
        wifiInfo: self.data.bindWifiInfo,
        confirmColor: '#267AFF',
        desc: this.data.brand == 'colmo' ? '请确认并重新输入密码' : '',
        confirmText: this.data.brand == 'colmo' ? '确定' : '确认',
        success(res) {
          console.log(res)
          if (res.confirm) {
            // 点击重试
            if (res.psw) {
              self.data.bindWifiInfo.PswContent = res.psw
              self.data.bindWifiInfo.PswLength = res.psw.length
              app.addDeviceInfo.curWifiInfo = self.data.bindWifiInfo
              setWifiStorage(self.data.bindWifiInfo)
            }
            self.setData({
              time: 60,
            })
            self.timing()
            if (mode == 31 && msmartBleWrite) {
              const wifiInfoOrder = self.sendWifiInfo(self.data.bindWifiInfo, blueVersion, false)
              msmartBleWrite(wifiInfoOrder)
            } else {
              // 组合设备新增指令
              if (self.data.brandConfig.combinedDevice && app.addDeviceInfo.isFeature) {
                self.getCombinedFlag()
              } else {
                self.sendWifiInfo(self.data.bindWifiInfo, blueVersion)
              }
            }
          }
          if (res.cancel) {
            // 点击关闭
            self.goLinkDeviceFailPage(4094)
          }
        },
      },
    })
  },
  // ap配网udp数据解析
  getApLinkData() {
    const {moduleVersion, sn8, mac, sonTypeH, sonTypeL} = this.data.udpAdData
    let a0 = sonTypeH + '' + sonTypeL
    a0 = parseInt(a0, 16)
    app.addDeviceInfo.a0 = a0 // 截取主设备a0
    app.addDeviceInfo.enterSn8 = app.addDeviceInfo.sn8 //这是选型、扫码得到的sn8
    app.addDeviceInfo.sn8 = sn8 //设置连接ap后获得的实际sn8
    app.addDeviceInfo.moduleVersion = moduleVersion //设置模块版本
    app.addDeviceInfo.mac = mac //设置mac
    this.data.btMac = mac
    let key = app.globalData.userData.key
    this.data.sn = this.apUtils.enCodeSn(this.data.udpAdData.sn, key, appKey)
    console.log('udpAdData=========', this.data.udpAdData, this.data.sn)
    log.info('@method getApLinkData @desc 收到udp响应设备信息包\n', this.data.udpAdData, this.data.sn)
    if (this.data.udpAdData.sn) {
      this.data.plainSn = asiiCode2Str(hexString2Uint8Array(this.data.udpAdData.sn))
      app.addDeviceInfo.plainSn = this.data.plainSn
    }
  },
  //ap 配网流程合
  async apLinkAbout() {
    const {tcpIp, tcpPort, moduleVersion, sn, type, sn8, udpVersion, mac, add2} = this.data.udpAdData
    // 获取组合配网标识
    if (this.data.brandConfig.combinedDevice && add2) {
      this.data.combinedDeviceFlag = hex2bin(add2)[4] == 1 // 标识位于附加信息的bit4: 1代表是，0代表否
      app.addDeviceInfo.combinedDeviceFlag = this.data.combinedDeviceFlag
      console.info('存在组合设备标识[AP通道]----------' + app.addDeviceInfo.combinedDeviceFlag)
    }
    let burialInfo = {
      //成功建立udp埋点
      deviceSessionId: app.globalData.deviceSessionId,
      type: this.data.addDeviceInfo.type,
      sn8: this.data.addDeviceInfo.sn8,
      sn: this.data.plainSn,
      moduleVersion: '', //ap配网没有像蓝牙的协议版本
      linkType: app.addDeviceInfo.linkType,
      ssid: app.addDeviceInfo.ssid,
      rssi: app.addDeviceInfo.rssi,
      curIp: this.data.curIp,
      udpBroadcastAddress: this.data.udpBroadcastAddress, //目前是固定地址
      wifi_version: moduleVersion, //模组版本埋点上报
    }
    if (this.data.udpAdData.udpVersion.slice(0, 2) < 2) {
      console.log('@module linkDevice.js\n@method apLinkAbout\n@desc 检测到UDP<2\n', this.data.udpAdData)
    }
    try {
      let ip = await this.getLocalIPAddress()
      console.log('做tcp时本机当前ip====', ip)
    } catch (error) {
      console.log('获取当前ip失败error', error)
    }

    //tcp前上报当前连接wifi
    let wifiInfo = null
    try {
      wifiInfo = await wifiMgr.getConnectedWifi()
      this.data.curLinkWifiInfo = wifiInfo
      console.log('[tcp时当前连接wifi]', wifiInfo)
    } catch (error) {
      console.log('tcp时获取当前连接wifi异常', `error=${JSON.stringify(error)}`)
    }
    if (this.data.curLinkWifiInfo.SSID != app.addDeviceInfo.ssid) {
      console.log('[tcp前设备wifi被切走]')
      return
    }
    this.createTCP(tcpIp, tcpPort)
  },
  /**
   * tcp消息响应处理
   */
  tcpOnMessage(res) {
    const decodeMsg = this.apUtils.decode2body(ab2hex(res.message))
    console.log('@module linkDevice.js\n@method tcpOnMessage\n@desc tcp消息响应\n', decodeMsg)
    // 组合设备（0074指令）模组回报
    if (decodeMsg.type == '8074') {
      this.isTcpRespond0074 = true
      // 解析设备信息 TLV格式
      this.parseTLVfor74(decodeMsg.body)
      // todo delete
      this.tcp.write(hexStringToArrayBuffer(this.data.aplinkOrder))
      console.log('AP配网发配网指令', this.data.aplinkOrder)
      this.data.apIsSendWifiInfo = true
      if (!this.data.checkExists) {
        this.data.checkExists = true
        this.sendApWifiAfter()
      }
    }
    if (decodeMsg.type == '8043') {
      // 写入临时ID（0043指令）模组回报
      this.ifLowUDPRespond0043 = true
      app.addDeviceInfo.temporaryID = decodeMsg.body
      console.log('@module linkDevice.js\n@method tcpOnMessage\n@desc 设备临时ID\n', decodeMsg.body)
      this.getDeviceSubType()
    }
    if (decodeMsg.type == '8020') {
      // 获取子类型（0020指令）模组回报
      this.ifLowUDPRespond0020 = true
      const subType = decodeMsg.body.substring(24, 28)
      console.log('@module linkDevice.js\n@method tcpOnMessage\n@desc 设备子类型\n', subType)
      this.configWiFiParams()
    }
    if (decodeMsg.type == '8068') {
      // WiFi连接参数配置（0068指令）模组回报
      if (decodeMsg.body == '0000') {
        this.ifLowUDPRespond0068 = true
        this.switchWiFiMode()
      } else {
        clearTimeout(this.timeout0068)
        const error0068 = {
          code: decodeMsg.body.substring(2, 4),
          msg: this.errorMsgMap0068[decodeMsg.body.substring(2, 4)],
        }
        console.error('@module linkDevice.js\n@method tcpOnMessage\n@desc WiFi配置失败\n', error0068)
        this.configWiFiParams(error0068)
      }
    }
    if (decodeMsg.type == '8081') {
      // WiFi工作模式切换STA（0081指令）模组回报
      this.ifLowUDPRespond0081 = true
    }
    if (decodeMsg.type == '8071') {
      //上次错误响应
      let lastErrorCode = decodeMsg.body.substr(4, 2) //截取错误code
      console.log('8071 error code  tcp onmessage:', lastErrorCode, decodeMsg.body)
      if (lastErrorCode != '00') {
        //00是正确
        app.addDeviceInfo.errorCode = '18' + this.padLen(lastErrorCode, 4)
        console.log('71 指令响应错误码:', app.addDeviceInfo.errorCode)
      }
    }
    if (decodeMsg.type == '8070') {
      //配网指令上行
      let code = parseInt(decodeMsg.body, 16)
      if (code == 0) {
        // showToast('模组收到wifi信息')
        console.log('模组响应收到wifi信息')
        this.data.deviceRecWifiInfo = true
      } else {
        //两次配网同样的错误才会响应 wb01
        console.log('8070 配网响应错误：', this.apUtils.linkAPerrorMsg[code])
        console.log('8070 响应错误码:', app.addDeviceInfo.errorCode)
        this.goLinkDeviceFailPage(180004)
      }
    }
  },
  // AP：解析TLV格式，获取组合设备信息
  parseTLVfor74(msg) {
    try {
      // const msg =  "01 03000000 a9 20 30303030423835313830303056523835303334303134315a3031383835354d34 aa 020000"
      let key = app.globalData.userData.key
      let tlvSnTag, snLen, snLenBit, snVal, tlvA0Tag, a0Len, a0LenBit, a0Val
      let readCursor = 10 // 从第5个字节位开始读
      let tlvNum = msg.substr(0, 2) // tlv个数
      let tlvNumBit = parseInt(tlvNum, 16)
      if (tlvNumBit > 0) {
        // tag a9：设备 SN，tag aa：A0
        for (let i = 0; i < tlvNumBit; i++) {
          tlvSnTag = msg.substr(readCursor, 2)
          if (tlvSnTag == 'a9') {
            snLen = msg.substr(readCursor + tlvSnTag.length, 2) // 0x20
            readCursor = readCursor + tlvSnTag.length + snLen.length // 14
            snLenBit = parseInt(snLen, 16) * 2
            snVal = msg.substr(readCursor, snLenBit)
            console.info('-----截取的sn=' + snVal)
            let temp = hexCharCodeToStr(snVal)
            app.combinedDeviceInfo[i].sn8 = temp.substr(9, 8) //截取sn8
            app.combinedDeviceInfo[i].type = temp.substr(4, 2) //截取品类
            // 32位的原始sn
            app.combinedDeviceInfo[i].plainSn = asiiCode2Str(hexString2Uint8Array(snVal))
            //未加密转加密sn
            app.combinedDeviceInfo[i].sn = this.apUtils.enCodeSn(snVal, key, appKey)
          }
          readCursor += snLenBit
          tlvA0Tag = msg.substr(readCursor, 2)
          if (tlvA0Tag == 'aa') {
            readCursor += tlvA0Tag.length
            a0Len = msg.substr(readCursor, 2) // 02
            a0LenBit = parseInt(a0Len, 16) * 2 // 4
            a0Val = msg.substr(readCursor + a0Len.length, a0LenBit) //0000
            // a0转成十进制，注意高位翻转
            let temp = this.apUtils.reverse(a0Val)
            temp = temp.join('')
            temp = parseInt(temp, 16)
            app.combinedDeviceInfo[i].a0 = temp
          }
        }
        console.info('-----组合设备信息-----', app.combinedDeviceInfo)
        if (app.combinedDeviceInfo[0].sn.length < 1) {
          throw 'parse sn fail'
        }
        if (app.combinedDeviceInfo[0].a0.length < 1) {
          throw 'parse a0 fail'
        }
        app.addDeviceInfo.combinedDeviceFlag = true
      } else {
        throw 'no combined devices'
      }
    } catch (error) {
      console.error('解析74指令失败 ', error)
      app.addDeviceInfo.combinedDeviceFlag = false
    }
  },
  // 蓝牙：解析TLV格式，获取组合设备信息
  parseTLVfor40(msg) {
    try {
      // const msg =  "010000000301 0600 20 30303030423835313830303056523835303334303134315a3031383835354d34 0700020000"
      let key = app.globalData.userData.key
      let tlvSnTag, snLen, snLenBit, snVal, tlvA0Tag, a0Len, a0LenBit, a0Val
      let readCursor = 10 // 从第5个字节位开始读
      let tlvNum = msg.substr(readCursor, 2) // tlv个数
      let tlvNumBit = parseInt(tlvNum, 16)
      if (tlvNumBit > 0) {
        // tlv 2,1,32 tag0006：设备 SN，tag0007：A0
        for (let i = 0; i < tlvNumBit; i++) {
          tlvSnTag = this.apUtils.reverse(msg.substr(readCursor + tlvNum.length, 4))
          if (tlvSnTag[1] == '06') {
            readCursor += 6 // 16
            snLen = msg.substr(readCursor, 2) // 20
            snLenBit = parseInt(snLen, 16) * 2
            readCursor += snLen.length
            snVal = msg.substr(readCursor, snLenBit)
            console.info('-----截取的sn=' + snVal)
            let temp = hexCharCodeToStr(snVal)
            app.combinedDeviceInfo[i].sn8 = temp.substr(9, 8) //截取sn8
            app.combinedDeviceInfo[i].type = temp.substr(4, 2) //截取品类
            // 32位的原始sn
            app.combinedDeviceInfo[i].plainSn = asiiCode2Str(hexString2Uint8Array(snVal))
            // 未加密转加密sn
            app.combinedDeviceInfo[i].sn = this.apUtils.enCodeSn(snVal, key, appKey)
          }
          readCursor += snLenBit
          tlvA0Tag = msg.substr(readCursor, 2) // 取高位
          if (tlvA0Tag == '07') {
            readCursor += 4 // 舍弃tag低位+4
            a0Len = msg.substr(readCursor, 2) // 02
            a0LenBit = parseInt(a0Len, 16) * 2
            readCursor += tlvA0Tag.length
            a0Val = msg.substr(readCursor, a0LenBit) //0000
            // a0转成十进制，注意高位翻转
            let temp = this.apUtils.reverse(a0Val)
            temp = temp.join('')
            temp = parseInt(temp, 16)
            app.combinedDeviceInfo[i].a0 = temp
          }
        }
        console.info('-----组合设备信息-----', app.combinedDeviceInfo)
        if (app.combinedDeviceInfo[0].sn.length < 1) {
          throw 'parse sn fail'
        }
        if (app.combinedDeviceInfo[0].a0.length < 1) {
          throw 'parse a0 fail'
        }
        app.addDeviceInfo.combinedDeviceFlag = true
      } else {
        throw 'no combined devices'
      }
    } catch (error) {
      console.error('解析40指令失败 ', error)
      app.addDeviceInfo.combinedDeviceFlag = false
      console.info('-----组合设备信息-----', app.combinedDeviceInfo)
    }
  },
  /**
   * 蓝牙：解析TLV格式，获取组合设备标识
   */
  parseTLVfor63(msg) {
    // const msg =  "0301020106010100000003"
    app.addDeviceInfo.combinedDeviceFlag == false // 重置标识
    let readCursor = 2 // 从第3位开始读
    let tlvNum = msg.substr(readCursor, 2) // tlv个数
    let combinedNum = 0
    if (parseInt(tlvNum, 16) > 0) {
      // tlv格式解析
      let tlvTag = this.apUtils.reverse(msg.substr(readCursor + 2, 4))
      if (tlvTag[1] == '02') {
        combinedNum = msg.substr(readCursor + 8, 2)
      }
      // 判断组合设备数量
      if (parseInt(combinedNum, 16) > 0) {
        app.addDeviceInfo.combinedDeviceFlag = true
        console.info('存在组合设备标识[ble通道]----------' + app.addDeviceInfo.combinedDeviceFlag)
        // 查询组合设备具体数据
        this.getCombinedDevice()
      } else {
        app.addDeviceInfo.combinedDeviceFlag = false
        this.sendWifiInfo(this.data.bindWifiInfo, app.addDeviceInfo.blueVersion)
        this.data.msmartBlueLinkNetYetWifiInfo = true //发送了wifi信息
      }
    } else {
      app.addDeviceInfo.combinedDeviceFlag = false
      this.sendWifiInfo(this.data.bindWifiInfo, app.addDeviceInfo.blueVersion)
      this.data.msmartBlueLinkNetYetWifiInfo = true //发送了wifi信息
    }
  },

  //生成ap log params
  createAplogData(params) {
    return {
      pageId: 'page_connect',
      pageName: '连接设备页',
      log: params.log,
    }
  },

  // //主动连接设备ap
  // async drivingDeviceAp() {
  //   let self = this
  //   let { ssid, type, enterprise } = app.addDeviceInfo
  //   let brandName = this.getBrandBname(enterprise)
  //   let res = wx.getSystemInfoSync()
  //   if (res.system.includes('Android')) {
  //     //安卓 或者 有ssid
  //     wx.startWifi({
  //       success: (res) => {
  //         wifiMgr.getWifiList(
  //           async (wifiList) => {
  //             console.log('获取到wifi list', wifiList)
  //             let deviceApSsid = wifiList.find((item) => {
  //               if (item.SSID == ssid || item.SSID.includes(`${brandName}_${type.toLocaleLowerCase()}`)) {
  //                 return item.SSID
  //               }
  //             })
  //             if (deviceApSsid) {
  //               console.log('找到对应设备wifi开始连接', deviceApSsid.SSID)
  //               self.tryConectWifi(
  //                 {
  //                   ssid: deviceApSsid.SSID, //deviceApSsid.SSID
  //                   password: addDeviceSDK.deviceApPassword,
  //                 },
  //                 2,
  //                 (success) => {
  //                   self.data.isSuccessLinkDeviceAp = true
  //                   self.apLinkAbout()
  //                 }
  //               )
  //             } else {
  //               wx.getWifiList({
  //                 fail: (res) => {},
  //               })
  //             }
  //           },
  //           (error) => {
  //             console.log('获取wifi列表失败', error)
  //           }
  //         )
  //       },
  //     })
  //     setTimeout(() => {
  //       self.data.isStopLinkWifi = true //停止
  //       if (!self.data.isSuccessLinkDeviceAp) {
  //         app.addDeviceInfo.isCanDrivingLinkDeviceAp = false //手动连接设备ap
  //         wx.reLaunch({
  //           url: paths.linkAp,
  //         })
  //       }
  //     }, linkDeviceApTimeOut * 1000)
  //   } else if (ssid) {
  //     self.tryConectWifi(
  //       {
  //         ssid: ssid,
  //         password: addDeviceSDK.deviceApPassword,
  //       },
  //       2,
  //       (success) => {
  //         console.log('连接设备ap成功')
  //         self.data.isSuccessLinkDeviceAp = true
  //         self.apLinkAbout()
  //       }
  //     )
  //     setTimeout(() => {
  //       self.data.isStopLinkWifi = true //停止
  //       if (!self.data.isSuccessLinkDeviceAp) {
  //         app.addDeviceInfo.isCanDrivingLinkDeviceAp = false //手动连接设备ap
  //         wx.reLaunch({
  //           url: paths.linkAp,
  //         })
  //       }
  //     }, linkDeviceApTimeOut * 1000)
  //   }
  // },
  // //ap配网40s未成功重新连接配网
  // apAddDeiveTimeOutRetry() {
  //   let { apDeviceWifiInfo } = app.addDeviceInfo
  //   let { isLinkcloud, startGetDeviceLinkCloud } = this.data
  //   let timeTemp = 0
  //   let timeOutLen = 45
  //   apRetryTime = setInterval(async () => {
  //     timeTemp = timeTemp + 1
  //     console.log('apAddDeiveTimeOutRetry====', timeTemp, isLinkcloud, apDeviceWifiInfo)
  //     if (timeTemp > timeOutLen && !isLinkcloud && apDeviceWifiInfo) {
  //       //40s 内未连上云
  //       clearInterval(apRetryTime)
  //       await this.connectWifi(apDeviceWifiInfo.SSID, apDeviceWifiInfo.password)
  //       this.apLinkAbout()
  //       if (startGetDeviceLinkCloud) {
  //         console.log('停止轮循查询')
  //         this.data.isStopGetExists = true //停止轮循查询
  //       }
  //     }
  //   }, 1000)
  // },

  //获取上次配网错误指令
  getLastErrorCode() {
    let params = {
      type: '0071',
      body: '010000',
    }
    let order0071 = this.apUtils.construOrder(params)
    return order0071
  },
  //是否需要二次确权配网
  isAgainCheck(firmwareList, type, moduleVersion) {
    let softwareVersion = moduleVersion.slice(6, 12) //软件版本
    let formatType = type.includes('0x') ? type.toLocaleUpperCase() : '0x' + type.toLocaleUpperCase()
    console.log('isAgainCheck====', firmwareList, formatType, softwareVersion)
    if (!firmwareList) {
      //名单不存在就不去二次确权
      return false
    }
    let obj = firmwareList.find((item, index) => {
      return item.applianceType == formatType && item.wifiVersion == softwareVersion
    })
    console.log('obj====', obj)
    return obj != undefined ? true : false
    // return true
  },
  //自启热点无后确权 交互处理
  noCheckDo() {
    let self = this
    let {type, sn8, linkType, moduleVersion} = app.addDeviceInfo
    type = type.includes('0x') ? type.substr(2, 2).toLocaleUpperCase() : type.toLocaleUpperCase()
    let conctent = '为保证连接的安全性，请重新连接设备，以完成安全性验证'
    let confirmText = (confirmText = '重新连接')
    if (type == 'DA' || type == 'DB') {
      //洗衣需要去扫码
      app.addDeviceInfo.isWashingMachine = true
      conctent = '为保证连接的安全性，请扫描机身的二维码重新连接设备，以完成安全性验证'
    }
    Dialog.confirm({
      title: conctent,
      cancelButtonText: '取消',
      cancelButtonColor: this.data.dialogStyle.cancelButtonColor,
      confirmButtonText: confirmText,
      // confirmButtonColor:'#0078FF',
      confirmButtonColor: this.data.dialogStyle.confirmButtonColor,
    })
      .then(async (res) => {
        if (res.action == 'confirm') {
          //设置
          clearInterval(timer)
          //非洗衣机重新获取配网指引
          try {
            if (!app.addDeviceInfo.isWashingMachine) {
              let guide = await self.getNetworkGuide()
              if (guide) {
                app.addDeviceInfo.guideInfo = guide
              }
            }
            wx.reLaunch({
              //洗衣机去扫码页
              url: app.addDeviceInfo.isWashingMachine ? paths.scanDevice + '?openScan=true' : paths.addGuide,
            })
          } catch (error) {
            self.guideDialogFail()
          }
        }
      })
      .catch((error) => {
        if (error.action == 'cancel') {
          //取消
          self.goLinkDeviceFailPage(4200) // 4200：自启热点无后确权
        }
      })

    // wx.showModal({
    //   title: conctent,
    //   cancelText: '取消',
    //   cancelColor: '#000000',
    //   confirmText: confirmText,
    //   confirmColor: '#267AFF',
    //   async success(res) {
    //     if (res.confirm) {
    //       //设置
    //       clearInterval(timer)
    //       burialPoint.clickSettingSecurityDialog({
    //         deviceSessionId: app.globalData.deviceSessionId,
    //         type: type,
    //         sn8: sn8,
    //         sn: self.data.sn,
    //         linkType: linkType,
    //         moduleVison: moduleVersion,
    //       })
    //       //非洗衣机重新获取配网指引
    //       if (!app.addDeviceInfo.isWashingMachine) {
    //         let guide = await self.getNetworkGuide()
    //         if (guide) {
    //           app.addDeviceInfo.guideInfo = guide
    //         }
    //       }
    //       wx.reLaunch({
    //         //洗衣机去扫码页
    //         url: app.addDeviceInfo.isWashingMachine ? paths.scanDevice + '?openScan=true' : paths.addGuide,
    //       })
    //     } else if (res.cancel) {
    //       //取消
    //       burialPoint.clickCancelSecurityDialog({
    //         deviceSessionId: app.globalData.deviceSessionId,
    //         type: type,
    //         sn8: sn8,
    //         sn: self.data.sn,
    //         linkType: linkType,
    //         moduleVison: moduleVersion,
    //       })
    //       self.goLinkDeviceFailPage(4200) // 4200：自启热点无后确权
    //     }
    //   },
    // })
  },
  guideDialogFail() {
    let self = this
    Dialog.confirm({
      title: '未获取到该产品的操作指引，请检查网络后重试，若仍失败，请联系售后处理',
      cancelButtonText: '返回首页',
      cancelButtonColor: this.data.dialogStyle.cancelButtonColor,
      confirmButtonText: '重试',
      // confirmButtonColor:'#0078FF',
      confirmButtonColor: this.data.dialogStyle.confirmButtonColor,
    })
      .then(async (res) => {
        if (res.action == 'confirm') {
          try {
            //非洗衣机重新获取配网指引
            if (!app.addDeviceInfo.isWashingMachine) {
              let guide = await this.getNetworkGuide()
              if (guide) {
                app.addDeviceInfo.guideInfo = guide
              }
            }
            wx.reLaunch({
              //洗衣机去扫码页
              url: app.addDeviceInfo.isWashingMachine ? paths.scanDevice + '?openScan=true' : paths.addGuide,
            })
          } catch (error) {
            self.guideDialogFail()
          }
        }
      })
      .catch((error) => {
        if (error.action == 'cancel') {
          wx.reLaunch({
            url: paths.index,
          })
        }
      })
  },

  //获取配网指引
  getNetworkGuide() {
    let self = this
    return new Promise((resolve, reject) => {
      let {type, sn8, mode, ssid, enterprise} = app.addDeviceInfo
      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
        ssid: ssid,
        enterpriseCode: enterprise,
        category: type.includes('0x') ? type.substr(2, 2) : type,
        sn: this.data.plainSn,
        code: sn8,
        mode: mode + '',
        queryType: 2,
      }
      console.log('二次验证-重新连接-配网指引请求参数', reqData)
      requestService
        .request('multiNetworkGuide', reqData, 'POST', '', 2000)
        .then((resp) => {
          if (resp?.data?.data?.mainConnectinfoList) {
            console.log('二次验证-重新连接-配网指引信息', resp.data.data.mainConnectinfoList)
            resolve(resp.data.data.mainConnectinfoList)
          } else {
            console.log('二次验证-重新连接-获取配网指引失败-resolve', resp)
            resolve(null)
          }
        })
        .catch((error) => {
          console.log('二次验证-重新连接-获取配网指引失败-catch', error)
          reject(null)
        })
    })
  },
  //添加配网一次性记录
  addLinkNetRecord(udpDeviceInfo) {
    let {type, sn, moduleVersion} = udpDeviceInfo
    let linkNetRecord = {}
    if (wx.getStorageSync('linkNetRecord')) {
      linkNetRecord = wx.getStorageSync('linkNetRecord')
    }
    linkNetRecord[sn] = {
      type: type,
      moduleVersion,
      stamp: getStamp(),
    }
    console.log('添加记录', linkNetRecord)
    log.info('add once connect net record', linkNetRecord)
    wx.setStorageSync('linkNetRecord', linkNetRecord)
  },
  //判断是家庭wifi
  async checkLinkFamilyWif(brandName, type, duration, callBack, callFail) {
    let self = this
    type = type.toLocaleLowerCase()
    if (this.data.isLinkFamilyWifi) return //已连上设备wifi
    let netType = await this.nowNetType()
    await this.startWifi() //初始化wifi
    checkLinkFamilyWifTimer = setInterval(() => {
      if (netType == 'wifi') {
        wx.getConnectedWifi({
          success(res) {
            console.log('family wifi info', res)
            if (!res.wifi.SSID.includes(`${brandName}_${type}_`) && !self.data.isLinkFamilyWifi) {
              self.data.isLinkFamilyWifi = true
              clearInterval(checkLinkFamilyWifTimer)
              console.log('连上了家庭wifi')
              callBack && callBack(res)
            }
          },
          fail(error) {
            console.log('判断是家庭wifi 获取当前wifi error', error)
            callFail && callFail(error)
          },
        })
      }
    }, duration)
  },
  //未打开蓝牙处理
  noOpenBlue() {
    let self = this
    Dialog.confirm({
      title: '请开启蓝牙后再试',
      message: '1.开启手机蓝牙\n2.授予微信使用蓝牙的权限',
      confirmButtonText: '我知道了',
      confirmButtonColor: this.data.dialogStyle.confirmButtonColor,
      showCancelButton: false,
    }).then((res) => {
      if (res.action == 'confirm') {
        setTimeout(() => {
          // colmo 点击我知道了按钮，效果不明显，美居没问题，加个定时器影响不大
          self.init()
        }, 500)
      }
    })
    // wx.showModal({
    //   showCancel: false,
    //   title: '请开启蓝牙后再试',
    //   content: '1.开启手机蓝牙\n2.授予微信使用蓝牙的权限',
    //   confirmText: '我知道了',
    //   confirmColor: '#0078FF',
    //   success(res) {
    //     if (res.confirm) {
    //       self.init()
    //     }
    //   },
    // })
  },
  // ----------ap start-----------
  //设备wifi被切换提示
  deviceWifiYetSwitchTip() {
    let self = this
    let {mode} = app.addDeviceInfo
    if (this.data.isPopupDeviceWifiYetSwitch) return //只弹一次
    this.data.isPopupDeviceWifiYetSwitch = true
    console.log('[连接中断弹窗弹出]', formatTime(new Date()))
    this.finishTcp() //关闭tcp

    wx.showModal({
      content: `设备连接中断,请将手机连接的wifi切换为"${app.addDeviceInfo.ssid}"`,
      cancelColor: '#000000',
      cancelText: '我知道了',
      confirmText: '去连接',
      confirmColor: '#0078FF',
      success(res) {
        if (res.confirm) {
          console.log('[连接中断弹窗 点击去连接]', formatTime(new Date()))
          self.data.isEndTcpRetry = true //终止重试
          self.switchWifi()
        } else {

          console.log('[连接中断弹窗 点击我知道了]', formatTime(new Date()))
          if (mode == 0) {
            self.data.isEndTcpRetry = true //终止重试
            wx.navigateBack({
              //返回连接设备页
              delta: 1,
            })
          }
        }
      },
    })
  },
  //获取udp广播包消息
  async openbroadcast() {
    // var msg = '5A5A01114800920000000000992C3B130806151400000000000000000000000000000000000000007F75BD6B3E4F8B762E849C6E578D6590AB77CD526E688D5C3DBD16E5AA3495B6'
    let {type} = app.addDeviceInfo
    this.data.udpBroadcastAddress = '255.255.255.255' //默认
    try {
      let res = await this.getLocalIPAddress()
      console.log('udp时本机当前ip====', res)
      this.data.curIp = res.localip
      if (res.localip && res.localip != 'unknown' && res.netmask) {
        //有ip和子网掩码 则根据两者计算广播地址
        this.data.udpBroadcastAddress = addDeviceSDK.getBroadcastAddress(res.localip, res.netmask)
      }
    } catch (error) {
      console.log('获取当前ip失败error', error)
    }
    return new Promise((resolve, reject) => {
      let parmas = {
        type: '0092',
        body: 'ff00',
      }
      let msg = this.apUtils.construOrder(parmas)
      console.log('msg==', msg)
      // var order9200='ff00'
      this.udp = wx.createUDPSocket()
      if (this.udp === null) {
        console.log('暂不支持udp')
        log.info('now phone on support udp')
        getApp().setMethodFailedCheckingLog('wx.createUDPSocket()', '不支持udp')
        this.apLogReportEven({
          msg: '本机不支持udp',
        })
        return
      }
      this.udp.bind()
      this.udp.onListening(function (res) {
        console.log('监听中...')
        log.info('onMessage udp...')
      })
      this.udp.onMessage((res) => {
        console.log(res)
        this.apLogReportEven({
          msg: 'udp单波响应信息',
          res: res,
        })
        if (res) {
          //udp广播信息
          let hexMsg = ab2hex(res.message).toLocaleLowerCase()
          console.log('udp message', hexMsg)
          if (this.apUtils.decode2body(hexMsg).type == '807a') {
            this.data.udpMsgBody = this.apUtils.decode2body(hexMsg).body
            let adData = this.apUtils.parseUdpBody(this.data.udpMsgBody)
            console.log('获取udp返回', adData)
            this.setIfSupportAds(adData)
            if (hexCharCodeToStr(adData.ssid).toLocaleLowerCase() == app.addDeviceInfo.ssid.toLocaleLowerCase()) {
              //校验响应包
              resolve(adData)
            }
          }
        }
      })
      this.udp.onError((res) => {
        console.log('udp error', res)
        this.udpErrTips(res)
        // reject(res)
      })
      console.log('发送udp时的地址====', this.data.udpBroadcastAddress)
      if (this.udp) {
        this.udp.send({
          setBroadcast: true, //允许广播
          address: this.data.udpBroadcastAddress,
          port: 6445,
          message: hexStringToArrayBuffer(msg),
        })
      }
      udpCycTimer = setInterval(() => {
        if (!isEmptyObject(this.data.udpAdData)) {
          clearInterval(udpCycTimer)
        } else {
          //取消重复建立实例导致崩溃的问题
          // this.udp = wx.createUDPSocket()
          // this.udp.bind()
          let msg = this.apUtils.construOrder(parmas)
          console.log('发送udp时的地址====', this.data.udpBroadcastAddress)
          if (this.udp) {
            this.udp.send({
              setBroadcast: true, //允许广播
              address: this.data.udpBroadcastAddress,
              port: 6445,
              message: hexStringToArrayBuffer(msg),
            })
          }
          console.log('再次发送udp======')
          getApp().setMethodFailedCheckingLog('再次发送udp请求消息')
          this.apLogReportEven({
            msg: '再次发送udp单波消息给设备',
          })
        }
      }, 2000)
      console.log('发送成功')
      log.info('send udp broadcast success')
    })
  },
  //监听设备自启广播
  onDeviceAutoUdp() {
    let {type} = app.addDeviceInfo
    return new Promise((resolve, reject) => {
      this.udp2 = wx.createUDPSocket() //新建udp2实例
      if (this.udp2 === null) {
        console.log('暂不支持')
        log.info('now phone on support udp')
        getApp().setMethodFailedCheckingLog('wx.createUDPSocket()', '不支持udp')
        this.apLogReportEven({
          msg: '本机不支持udp',
        })
        this.apLogReportEven({
          error: '当前手机无法使用udp',
        })
        return
      } else {
        console.log('this.udp2===', this.udp2)
        this.udp2.bind(15000)
        this.udp2.onListening(function (res) {
          console.log('监听中...')
          log.info('onMessage udp...')
          this.apLogReportEven({
            success: '成功监听udp广播',
          })
          console.log(res)
        })
        this.udp2.onMessage((res) => {
          console.log(res)
          this.apLogReportEven({
            msg: 'udp广播响应信息',
            res: res,
          })
          if (res) {
            //udp2广播信息
            let hexMsg = ab2hex(res.message).toLocaleLowerCase()
            console.log('udp2 message', hexMsg)
            if (this.apUtils.decode2body(hexMsg).type == '007a') {
              this.data.udpMsgBody = this.apUtils.decode2body(hexMsg).body
              let adData = this.apUtils.parseUdpBody(this.data.udpMsgBody)
              this.setIfSupportAds(adData)
              if (hexCharCodeToStr(adData.ssid).toLocaleLowerCase() == app.addDeviceInfo.ssid.toLocaleLowerCase()) {
                //过滤偶现没有版本信息的包
                resolve(adData)
              }
            }
          }
        })
        this.udp2.onError((res) => {
          console.log('udp2 error', res)
          this.udpErrTips(res)
          // reject(res)
        })
      }
    })
  },
  //获取udp设备信息
  getUdpInfo() {
    let openbroadcast = this.openbroadcast()
    let onDeviceAutoUdp = this.onDeviceAutoUdp()
    return Promise.race([onDeviceAutoUdp, openbroadcast])
  },

  closeUdp() {
    this.udp.offMessage()
    this.udp.close()
    this.udp2.offMessage()
    this.udp2.close()
  },

  //udp 错误提示
  udpErrTips(error) {
    let self = this
    if (error.errMsg.includes('No route to host')) {
      if (this.checkPhoneSystemVerion('14.0.0')) {
        if (this.data.isShowOpenlocaltNetTip) return
        Dialog.confirm({
          title: '手机与设备通信中断，请确认手机设置已授权微信获取“本地网络权限”',
          confirmButtonText: '查看指引',
          cancelButtonText: '放弃',
          // cancelButtonColor:'#0078FF',
          // confirmButtonColor:'#0078FF',
          cancelButtonColor: this.data.dialogStyle.cancelButtonColor2,
          confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
        })
          .then((res) => {
            if (res.action == 'confirm') {
              self.closeUdp()
              clearInterval(timer) //停止计时
              clearInterval(udpCycTimer) //停止udp重试
              let permissionTypeList = {localNet: false} //本地网络未开
              wx.navigateTo({
                url: paths.localNetGuide + `?permissionTypeList=${JSON.stringify(permissionTypeList)}`,
              })
              let localNetDialogClickLookGuide = {
                deviceSessionId: app.globalData.deviceSessionId,
                type: app.addDeviceInfo.type,
                sn8: app.addDeviceInfo.sn8,
                sn: self.data.plainSn,
                moduleVersion: app.addDeviceInfo.moduleVersion,
                linkType: app.addDeviceInfo.linkType,
              }
              app.apNoNetBurialPoint.localNetDialogClickLookGuide = localNetDialogClickLookGuide //暂存
            }
          })
          .catch((error) => {
            if (error.action == 'cancel') {
              clearInterval(udpCycTimer) //停止udp重试
              clearInterval(timer) //停止计时
              self.closeUdp()
              //回到首页
              wx.reLaunch({
                url: paths.index,
              })
              let localNetDialogClickConfirm = {
                deviceSessionId: app.globalData.deviceSessionId,
                type: app.addDeviceInfo.type,
                sn8: app.addDeviceInfo.sn8,
                sn: self.data.plainSn,
                moduleVersion: app.addDeviceInfo.moduleVersion,
                linkType: app.addDeviceInfo.linkType,
              }
              app.apNoNetBurialPoint.localNetDialogClickConfirm = localNetDialogClickConfirm
            }
          })
        // this.setData({
        //   //取消弹窗
        //   customDialog: {
        //     show: true,
        //     content: '手机与设备通信中断，请确认手机设置已授权微信获取“本地网络权限”',
        //     cancelText: '放弃',
        //     cancelColor: '#0078FF',
        //     confirmText: '查看指引',
        //     confirmColor: '#0078FF',
        //     success(res) {
        //       console.log('page dialog res', res)
        //       if (res.confirm) {
        //         self.closeUdp()
        //         clearInterval(timer) //停止计时
        //         clearInterval(udpCycTimer) //停止udp重试
        //         let permissionTypeList = { localNet: false } //本地网络未开
        //         wx.navigateTo({
        //           url: paths.localNetGuide + `?permissionTypeList=${JSON.stringify(permissionTypeList)}`,
        //         })
        //         let localNetDialogClickLookGuide = {
        //           deviceSessionId: app.globalData.deviceSessionId,
        //           type: app.addDeviceInfo.type,
        //           sn8: app.addDeviceInfo.sn8,
        //           sn: self.data.plainSn,
        //           moduleVersion: app.addDeviceInfo.moduleVersion,
        //           linkType: app.addDeviceInfo.linkType,
        //         }
        //         burialPoint.localNetDialogClickLookGuide(localNetDialogClickLookGuide)
        //         app.apNoNetBurialPoint.localNetDialogClickLookGuide = localNetDialogClickLookGuide //暂存
        //       } else if (res.cancel) {
        //         clearInterval(udpCycTimer) //停止udp重试
        //         clearInterval(timer) //停止计时
        //         self.closeUdp()
        //         //回到首页
        //         wx.reLaunch({
        //           url: paths.index,
        //         })
        //         let localNetDialogClickConfirm = {
        //           deviceSessionId: app.globalData.deviceSessionId,
        //           type: app.addDeviceInfo.type,
        //           sn8: app.addDeviceInfo.sn8,
        //           sn: self.data.plainSn,
        //           moduleVersion: app.addDeviceInfo.moduleVersion,
        //           linkType: app.addDeviceInfo.linkType,
        //         }
        //         burialPoint.localNetDialogClickConfirm(localNetDialogClickConfirm)
        //         app.apNoNetBurialPoint.localNetDialogClickConfirm = localNetDialogClickConfirm
        //       }
        //     },
        //   },
        // })
        this.data.isShowOpenlocaltNetTip = true
      }
    }
  },
  /**
   * ap配网发送wifi信息
   * @param {string} address 要连接的地址
   * @param {number} port 要连接的端口
   */
  async createTCP(address, port) {
    this.tcp = wx.createTCPSocket()
    console.log('createTCPSocket', this.tcp)

    this.tcp.onConnect(() => {
      console.log('tcp connect 成功')
      this.data.isLinkTcpSuccess = true
      if (this.data.udpAdData.udpVersion.slice(0, 2) < 2) {
        /**
         * UDP版本小于2
         * 技术方案：https://xclsj81w8v.feishu.cn/docx/doxcnmzbAzXco9CUoJ2EE8ayrIf#doxcnOi4SsGyCeyQKW3c7ELU1st
         */
        if (this.ifLowUDPRespond0068) {
          this.switchWiFiMode()
          return
        }
        if (this.ifLowUDPRespond0020) {
          this.configWiFiParams()
          return
        }
        if (this.ifLowUDPRespond0043) {
          this.getDeviceSubType()
          return
        }
        this.writeTemporaryID()
      } else {
        if (!this.data.aplinkOrder) {
          this.data.aplinkOrder = this.constrLinknetorder()
        }
        // this.tcp.write(hexStringToArrayBuffer(this.getLastErrorCode()))
        if (this.tcp) {
          // 发送0074指令查组合设备
          if (app.addDeviceInfo.combinedDeviceFlag) {
            this.tcp.write(hexStringToArrayBuffer(this.constrCombinedDeviceOrder()))
            console.info('AP配网发 查询组合设备指令')
            this.data.apIsSendCombinedInfo = true
          } else {
            this.tcp.write(hexStringToArrayBuffer(this.data.aplinkOrder))
            console.log('AP配网发配网指令', this.data.aplinkOrder)
            this.data.apIsSendWifiInfo = true
            //发送完wifi信息就开始查询云
            if (!this.data.checkExists) {
              this.data.checkExists = true
              this.sendApWifiAfter()
            }
          }
        }
      }
    })

    this.tcp.onMessage((res) => {
      this.tcpOnMessage(res)
    })

    this.tcp.onError(async (error) => {
      //监听tcp错误
      console.log('link tcp error', error)
      getApp().setMethodFailedCheckingLog('tcp.onError', `tcp响应错误，error=${JSON.stringify(error)}`)
      app.addDeviceInfo.errorCode = this.creatErrorCode({
        errorCode: 4038,
        isCustom: true,
      })
      log.info('link tcp error', error)
      app.apNoNetBurialPoint.apLocalLog.push(
        this.createAplogData({
          log: {
            msg: 'tcp错误',
            error: error,
          },
        }),
      )
      /**
       * 3 - 绑定 wifi 网络失败，BSSID 不合法
       * 4 - 绑定 wifi 网络失败，系统错误
       * 5 - 不支持 bindWifi
       * 6 - 低版本基础库不支持
       */
      let tcpBindWifiErrCodes = [3, 4, 5, 6]
      if (tcpBindWifiErrCodes.includes(error.errCode)) {
        console.log('[tcp bind wifi error]')
        this.tcp.connect({
          address: address,
          port: port,
          timeout: 5, //wx 8.0.22 add
        })
        return
      }

      this.finishTcp()

      if (!this.data.deviceRecWifiInfo && this.data.tcpRetryNum > 0 && !this.data.isEndTcpRetry) {
        setTimeout(() => {
          this.createTCP(address, port)
          this.data.tcpRetryNum = this.data.tcpRetryNum - 1
        }, 3000)
      }
    })
    if (app.globalData.systemInfo.system.includes('Android') && typeof this.tcp.bindWifi === 'function') {
      //安卓支持tcp.bindWifi 则先bindWifi
      console.log('[support tcp bind wifi]')
      this.tcp.onBindWifi(async () => {
        console.log('[tcp bind wifi success]')
        this.tcp.connect({
          address: address,
          port: port,
          timeout: 5, //wx 8.0.22 add
        })
      })
      this.tcp.bindWifi({
        BSSID: app.addDeviceInfo.BSSID,
      })
    } else {
      console.log('[unsupport tcp bind wifi]')
      const self = this
      wx.getNetworkType({
        success(res) {
          const networkType = res.networkType
          if (networkType == 'wifi') {
            //如果当前已经连接wifi,则直接连接
            self.tcp.connect({
              address: address,
              port: port,
              timeout: 5, //wx 8.0.22 add
            })
          } else {
            //如果当前还没有连接wifi，通过监听wifi状态变化，转为wifi后再连接
            wx.onNetworkStatusChange(function connectTCPOnWiFi(res) {
              console.log('@module linkDevice.js\n@method apSendWifiInfo\n@desc 网络状态变化回调\n', res)
              if (res.isConnected && res.networkType == 'wifi') {
                if (self.tcp) {
                  self.tcp.connect({
                    address: address,
                    port: port,
                    timeout: 5, //wx 8.0.22 add
                  })
                } else {
                  wx.offNetworkStatusChange(connectTCPOnWiFi)
                }
              }
            })
          }
        },
      })
    }
  },

  //结束tcp
  finishTcp() {
    if (this.tcp) {
      this.tcp.offMessage()
      this.tcp.offError()
      this.tcp.offClose()
      this.tcp.close()
      this.tcp = null
    }
  },
  /**
   * 写入临时ID（0043指令）
   * UDP < 2 使用
   */
  writeTemporaryID() {
    const snHashCode = bytesToHexString(IntToBytes(stringToHashCode(this.data.plainSn), 4)).toUpperCase()
    const type = app.addDeviceInfo.type || this.data.plainSn.substring(4, 6)
    const temporaryID = snHashCode + type + 'FF'
    const params = {
      type: '0043',
      body: this.data.udpAdData.sn + temporaryID,
    }
    console.log('@module linkDevice.js\n@method writeTemporaryID\n@desc 写入临时ID\n', params)
    const order0043 = this.apUtils.construOrder(params)
    if (this.tcp) {
      this.tcp.write(hexStringToArrayBuffer(order0043))
      // 超时未收到模组回报则重发指令
      setTimeout(() => {
        if (!this.ifLowUDPRespond0043) this.writeTemporaryID()
      }, this.orderTimeout)
    } else {
      console.error('@module linkDevice.js\n@method writeTemporaryID\n@desc 不存在TCP实例')
      const {tcpIp, tcpPort} = this.data.udpAdData
      this.createTCP(tcpIp, tcpPort)
    }
  },
  /**
   * 获取子类型（0020指令）
   * UDP < 2 使用
   */
  getDeviceSubType() {
    // 构建UART数据包
    let datagram = ['AA', '0B', '00', '00', '00', '00', '00', '00', '00', 'A0', '00', '00']
    datagram[2] = app.addDeviceInfo.type
    datagram = datagram.join('')
    datagram = hexString2Uint8Array(datagram)
    // 计算校验码
    for (let i = 1; i < 10; i++) {
      datagram[11] += datagram[i]
    }
    datagram[11] = ~datagram[11] + 1
    datagram = toHexString(datagram)
    const params = {
      type: '0020',
      body: datagram,
      deviceId: app.addDeviceInfo.temporaryID,
    }
    console.log('@module linkDevice.js\n@method getDeviceSubType\n@desc 获取设备子类型\n', params)
    const order0020 = this.apUtils.construOrder(params)
    if (this.tcp) {
      this.tcp.write(hexStringToArrayBuffer(order0020))
      // 超时未收到模组回报则重发指令
      setTimeout(() => {
        if (!this.ifLowUDPRespond0020) this.getDeviceSubType()
      }, this.orderTimeout)
    } else {
      console.error('@module linkDevice.js\n@method getDeviceSubType\n@desc 不存在TCP实例')
      const {tcpIp, tcpPort} = this.data.udpAdData
      this.createTCP(tcpIp, tcpPort)
    }
  },
  /**
   * WiFi连接参数配置（0068指令）
   * UDP < 2 使用
   * @param {Object} error 模组回报错误信息
   */
  configWiFiParams(error) {
    this.data.randomCode = getRandomString(32).toLocaleLowerCase() // 生成随机数，但是不需要发送给模组
    let info = new Object()
    info.encryMode = this.data.bindWifiInfo.PswContent ? '02' : '00' // WiFi加密方式：有密码的传2，无密码的传0
    if (error?.code == '04' && info.encryMode == '02') {
      info.encryMode = '01'
    }
    info.ssidLen = toHexString([this.data.bindWifiInfo.SSIDLength])
    info.pswLen = toHexString([this.data.bindWifiInfo.PswLength]) || '00'
    info.ssidContent = toHexString(string2Uint8Array(this.data.bindWifiInfo.SSIDContent))
    info.pswContent = toHexString(string2Uint8Array(this.data.bindWifiInfo.PswContent)) || ''
    console.log('@module linkDevice.js\n@method configWiFiParams\n@desc WiFi连接参数\n', info)
    info.total = Object.values(info).join('')
    const params = {
      type: '0068',
      body: info.total,
      deviceId: app.addDeviceInfo.temporaryID,
    }
    console.log('@module linkDevice.js\n@method configWiFiParams\n@desc WiFi连接参数配置\n', params)
    const order0068 = this.apUtils.construOrder(params)
    if (this.tcp) {
      this.tcp.write(hexStringToArrayBuffer(order0068))
      // 超时未收到模组回报则重发指令
      this.timeout0068 = setTimeout(() => {
        if (!this.ifLowUDPRespond0068) this.configWiFiParams()
      }, this.orderTimeout)
    } else {
      console.error('@module linkDevice.js\n@method configWiFiParams\n@desc 不存在TCP实例')
      const {tcpIp, tcpPort} = this.data.udpAdData
      this.createTCP(tcpIp, tcpPort)
    }
  },
  /**
   * WiFi工作模式切换STA（0081指令）
   * UDP < 2 使用
   */
  switchWiFiMode() {
    const params = {
      type: '0081',
      body: '02',
      deviceId: app.addDeviceInfo.temporaryID,
    }
    console.log('@module linkDevice.js\n@method switchWiFiMode\n@desc WiFi工作模式切换STA\n', params)
    const order0081 = this.apUtils.construOrder(params)
    if (this.tcp) {
      this.tcp.write(hexStringToArrayBuffer(order0081))
      this.data.apIsSendWifiInfo = true
      this.data.deviceRecWifiInfo = true
      // 开始广域网查找（不强制校验随机数）
      if (!this.data.checkExists) {
        this.data.checkExists = true
        this.sendApWifiAfter(false)
      }
    } else {
      console.error('@module linkDevice.js\n@method switchWiFiMode\n@desc 不存在TCP实例')
      const {tcpIp, tcpPort} = this.data.udpAdData
      this.createTCP(tcpIp, tcpPort)
    }
  },
  /**
   * 构造获取组合设备信息指令
   */
  constrCombinedDeviceOrder() {
    const params = {
      type: '0074',
      body: '00',
    }
    console.log('@module linkDevice.js\n@method combinedDeviceOrder\n@desc 获取组合设备信息\n', params)
    const order0074 = this.apUtils.construOrder(params)
    return order0074
  },
  /**
   * 构造AP配网指令
   */
  constrLinknetorder() {
    if (!this.data.bindWifiInfo) return
    let bindWifiInfo = this.data.bindWifiInfo
    let order = {}
    order.randomCode = getRandomString(32).toLocaleLowerCase() //'241205fca8bb549178cd1e5b7c4f8893'
    this.data.randomCode = order.randomCode
    order.ssidLen = toHexString([bindWifiInfo.SSIDLength])
    order.ssidcontent = toHexString(string2Uint8Array(bindWifiInfo.SSIDContent))
    order.pswlen = toHexString([bindWifiInfo.PswLength]) || '00'
    order.psw = toHexString(string2Uint8Array(bindWifiInfo.PswContent)) || ''
    if (bindWifiInfo.BSSID) {
      order.bssidLen = toHexString([bindWifiInfo.BSSID.split(':').join('').length / 2])
      order.bssid = bindWifiInfo.BSSID.split(':').join('')
    } else {
      log.error('bindWifiInfo.BSSID为空', bindWifiInfo)
      getApp().setMethodFailedCheckingLog('bindWifiInfo.BSSID为空', `bindWifiInfo=${JSON.stringify(bindWifiInfo)}`)
    }
    order.gbkssidLen = toHexString([bindWifiInfo.SSIDLength]) //backUp ssid
    order.gbkssid = toHexString(string2Uint8Array(bindWifiInfo.SSIDContent))
    order.chain = '00' //信道  toHexString([bindWifiInfo.chain])
    order.setReplyPswError = apParamsSet.setReplyPswError()
    order.setCountryTimezoneChannelList = apParamsSet.setCountryTimezoneChannelList()
    order.setRegionId = apParamsSet.setRegionId()
    order.setModuleServerDomain = apParamsSet.setModuleServerDomain()
    order.setModuleServerPort = apParamsSet.setModuleServerPort()
    order.setfeature = apParamsSet.setfeature()
    if (app.addDeviceInfo.ifSupportAds) {
      // 支持ADS集群ID
      const setAdsId = apParamsSet.setAdsId()
      if (!setAdsId) {
        this.goLinkDeviceFailPage(4160)
        return
      }
      order.setAdsId = setAdsId
    }
    console.log('@module linkDevice.js\n@method constrLinknetorder\n@desc 配网指令对象\n', order)
    order.total = Object.values(order).join('')
    console.log('@module linkDevice.js\n@method constrLinknetorder\n@desc 配网指令对象值连接结果\n', order.total)
    let params = {
      type: '0070',
      body: order.total,
    }
    let order7000 = this.apUtils.construOrder(params)
    return order7000
  },
  //判断是否回连家庭wifi
  isLinkFamilyWifi() {
    let isLinkFamilyWifi = false
    let res = wx.getSystemInfoSync()
    console.log('res=====', res)
    if (res.system.includes('Android')) {
      isLinkFamilyWifi = true
    }
    return isLinkFamilyWifi
  },
  /**
   * ap配网发送完成wifi信息后
   * @param {Boolean} forceValidRandomCode 是否强制校验随机数
   */
  async sendApWifiAfter(forceValidRandomCode = true) {
    let self = this
    let randomCode = this.data.randomCode
    // if (this.isLinkFamilyWifi() || true) {
    //   //安卓主动 IOS自动

    //   //IOS
    // }
    let wifiInfo = this.data.bindWifiInfo
    wx.onWifiConnected((res) => {
      //自动回连成功wifi
      this.data.isBackLinkRoute = true //成功回连路由
      let wifiInfo = res.wifi
      console.log('连上了wifi', res)
      log.info('connect wifi success')
      wx.offWifiConnected()
    })
    let searchDevieLinkCloud = {
      //开始查询云
      deviceSessionId: app.globalData.deviceSessionId,
      type: this.data.addDeviceInfo.type,
      sn8: this.data.addDeviceInfo.sn8,
      sn: this.data.plainSn,
      moduleVersion: '', //ap配网没有像蓝牙的协议版本
      linkType: app.addDeviceInfo.linkType,
      wifi_version: app.addDeviceInfo.moduleVersion, //模组版本埋点上报
    }
    app.apNoNetBurialPoint.searchDevieLinkCloud = searchDevieLinkCloud //暂存
    log.info('开始查询设备是否连接云端')
    let timeout = 5000
    this.newAgainGetAPExists(
      this.data.sn,
      forceValidRandomCode,
      randomCode,
      timeout,
      async (resp) => {
        if (this.data.time == 0) {
          return
        } //页面计时已结束
        this.data.isLinkcloud = true
        console.log('设备成功连2上云', resp)
        app.addDeviceInfo.errorCode = this.creatErrorCode({
          errorCode: 4013,
          isCustom: true,
        })
        log.info('设备成功连上云', resp)
        let {type, againCheckList, moduleVersion, sn8, linkType, apNoNetBurialPoint} = app.addDeviceInfo
        console.log('app.apNoNetBurialPoint=========', app.apNoNetBurialPoint)
        if (!isEmptyObject(app.apNoNetBurialPoint)) {
          this.sendApNoNetBurialpoint(app.apNoNetBurialPoint) //批量上报ap 无网触发埋点
          app.apNoNetBurialPoint = {apLocalLog: []}
        }
        //sta阶段
        if (this.isAgainCheck(againCheckList, type, moduleVersion)) {
          //是 自启热点无后确权设备 CA '031844031844'
          let linkNetRecord = wx.getStorageSync('linkNetRecord')
          if (!linkNetRecord || !linkNetRecord[this.data.udpAdData.sn]) {
            //无第一次配网
            console.log('无记一次配网录')
            this.addLinkNetRecord(this.data.udpAdData) //添加一次配网记录
            clearInterval(timer)
            this.noCheckDo()
            return
          } else {
            console.log('有一次配网记录')
            app.addDeviceInfo.isTwice = true //是第二次配网
          }
        }
        console.log('进度页AP配网家庭id', app.globalData.currentHomeGroupId)
        if (!app.globalData.currentHomeGroupId) {
          app.globalData.currentHomeGroupId = await this.getCurrentHomeGroupId()
          console.log('进度页AP配网家庭id 从云端获取', app.globalData.currentHomeGroupId)

          this.data.currentHomeGroupId = app.globalData.currentHomeGroupId
        }
        let {currentRoomId, currentRoomName} = app.globalData
        if (currentRoomId && currentRoomName) {
          console.log('已有家庭信息================')
          this.setData({
            currentRoomId: currentRoomId,
            currentRoomName: currentRoomName,
          })
        } else {
          try {
            await this.getFamilyInfo(app.globalData.currentHomeGroupId)
          } catch (error) {
            console.error(error)
          }
        }
        let bindRes = null
        try {
          bindRes = await requestWithTry(this.bindDeviceToHome, 3) //防止超时提前绑定
        } catch (error) {
          console.error(error)
        }
        this.setData({
          curStep: 2,
        })
        if (bindRes) {
          this.setData({
            'progressList[2].isFinish': true,
          })
          clearInterval(timer)
          if (this.tcp) {
            this.finishTcp()
          }
          app.addDeviceInfo.sn = this.data.sn
          app.addDeviceInfo.cloudBackDeviceInfo = bindRes.data.data
          app.addDeviceInfo.cloudBackDeviceInfo.roomName = this.data.currentRoomName
          app.composeApplianceList = []
          // 组合配网新增跳转
          let {applianceCode, combinedDeviceFlag} = app.addDeviceInfo
          if (combinedDeviceFlag) {
            app.composeApplianceList.push(app.addDeviceInfo.cloudBackDeviceInfo)
            const {data} = await this.getApplianceAuthType(applianceCode)
            console.warn('---有组合设备，查询主设备确权中---', data)
            app.addDeviceInfo.status = data.data.status
            app.addDeviceInfo.randomCode = self.data.blueRandomCode || self.data.randomCode
            if (data.data.status == '1' || data.data.status == '2') {
              wx.reLaunch({
                url: `/package-distribution-meiju/pages/addDevice/pages/afterCheck/afterCheck?backTo=/pages/index/index&randomCode=${
                  self.data.blueRandomCode || self.data.randomCode
                }`,
              })
            } else {
              // 已确权
              wx.reLaunch({
                url: `${paths.linkCombinedDevice}?randomCode=${self.data.blueRandomCode || self.data.randomCode}`,
              })
            }
          } else {
            wx.reLaunch({
              url: paths.addSuccess,
            })
          }
        } else {
          //绑定设备接口失败，跳转配网失败页
          this.goLinkDeviceFailPage()
        }
      },
      async (error) => {
        this.data.timeoutNum = this.data.timeoutNum + 1
        console.log('接口超时错误=========', this.data.timeoutNum)
        if (this.data.timeoutNum == 4) {
          //超时3次
          clearInterval(timer) //停止计时

          Dialog.confirm({
            title: `请将手机连上家庭WiFi "${wifiInfo.SSIDContent}",\n以完成设备联网,连接后返回小程序`,
            confirmButtonText: '去连接',
            cancelButtonText: '取消',
            // cancelButtonColor:'#267AFF',
            // confirmButtonColor:'#267AFF',
            cancelButtonColor: this.data.dialogStyle.cancelButtonColor3,
            confirmButtonColor: this.data.dialogStyle.confirmButtonColor,
          })
            .then((res) => {
              if (res.action == 'confirm') {
                self.data.isMamualLinkFamilyWifi = true
                self.switchWifi(false)
              }
            })
            .catch((error) => {
              if (error.action == 'cancel') {
                self.timing()
              }
            })
        }
      },
    )
  },
  //ap end
  async wahinBleBind(deviceId, adData, mode) {
    let wahinLogonRes
    try {
      // 添加重试机制，解决没有网的时候，重试失败的问题
      wahinLogonRes = await requestWithTry(this.wahinLogin, 3) //华凌登录
      console.log('华凌登录成功===============', wahinLogonRes)
    } catch (error) {
      console.log('华凌登录失败===============', error)
    }
    if (!wahinLogonRes) {
      return
    }
    let device = {}
    device.advertisData = hexStringToArrayBuffer(adData)
    let category = device.advertisData.slice(11, 13)
    device.category = uintArray2String(new Uint8Array(category))
    category = hexString2Uint8Array(uintArray2String(category))
    let sn8 = device.advertisData.slice(3, 11)
    device.sn8 = uintArray2String(sn8)
    device.sn3 = device.sn8.substring(0, 3)
    let mac = new Uint8Array(device.advertisData.slice(21, 27)).reverse()
    device.mac = ab2hex(mac)
    device.deviceId = deviceId
    device.advertisData = concatUint8Array([category, sn8, mac])
    console.log('pppppppp--------', device)
    console.log('bluetoothCon--------', deviceId, app.openId6)
    await this.refreshCacheOpenBluetoothAdapter() //重启蓝牙模块
    app.bluetoothConn = new BluetoothConn({
      device,
      openId6: app.openId6,
      deviceId: deviceId,
      sessionKey: '',
      advertisData: device.advertisData,
      success: (res) => {
        console.log('blue success=============')
        let bindType = 1
        app.globalData.DeviceComDecorator = new DeviceComDecorator(app.bluetoothConn, deviceId, bindType)
        if (mode == 21) {
          //数字遥控配网
          this.remoteSendWifiInfo(this.data.bindWifiInfo)
          //使用查询云端设备是否连上云会有1321的问题 所以使用监听设备返回
          app.bluetoothConn.event.on('receiveMessage', async (data) => {
            if (mode != 21) return
            if (this.data.isCancelOnwaHinLink) return
            console.log('receiveMessage', data)
            //判断04，
            if (data[0] == 0x00) {
              console.log('收到00 进入待配网')
              this.setData({
                isReady: 1,
              })
            }
            if (data[0] == 0x04 && this.data.isReady == 1) {
              console.log('开始绑定设备')
              // app.bluetoothConn.event.off("receiveMessage")
              this.data.sn = app.addDeviceInfo.sn
              let resp = await requestWithTry(this.bindDeviceToHome, 3)
              console.log('app.addDeviceInfo.sn', app.addDeviceInfo.sn)
              app.addDeviceInfo.cloudBackDeviceInfo = resp.data.data
              app.addDeviceInfo.cloudBackDeviceInfo.roomName = this.data.currentRoomName
              this.data.isCancelOnwaHinLink = true
              clearInterval(timer)
              wx.navigateTo({
                url: paths.wifiSuccessSimple,
              })
              let btMac = this.data.btMac ? this.data.btMac.toLocaleUpperCase() : ''
              let remoteDeviceList = wx.getStorageSync('remoteDeviceList') ? wx.getStorageSync('remoteDeviceList') : []
              remoteDeviceList = remoteDeviceList.filter((item) => item.btMac != btMac)
              wx.setStorageSync('remoteDeviceList', remoteDeviceList)
              app.addDeviceInfo.mode = '' //置空模式
            } else if (data[0] == 0x02) {
              // this.showToast('不支持该指定的入网模式')
              console.log('不支持该指定的入网模式')
            } else if (data[0] == 0x03) {
              // this.showToast('连接路由器成功')
              console.log('连接路由器成功')
            } else if (data[0] == 0x05 && this.data.isReady == 1) {
              console.log('连接路由器失败，请重试')
              this.data.isCancelOnwaHinLink = true
              this.goLinkDeviceFailPage()
            }
          })

          // this.againGetAPExists(this.data.sn, this.data.blueRandomCode, async (respon) => {
          //   console.log('设备成功连上云', respon)
          //   console.log('开始绑定设备')
          //   let resp = await this.bindDeviceToHome()
          //   console.log('绑定设备至默认家庭房间', resp)
          //   app.addDeviceInfo.cloudBackDeviceInfo = resp.data.data
          //   app.addDeviceInfo.cloudBackDeviceInfo.roomName = this.data.currentRoomName
          //   clearInterval(timer)
          //   wx.reLaunch({
          //     url: paths.wifiSuccessSimple,
          //   })
          //   let btMac = this.data.btMac ? this.data.btMac.toLocaleUpperCase() : ''
          //   let remoteDeviceList = wx.getStorageSync('remoteDeviceList') ? wx.getStorageSync('remoteDeviceList') : []
          //   remoteDeviceList = remoteDeviceList.filter((item) => item.btMac != btMac)
          //   wx.setStorageSync('remoteDeviceList', remoteDeviceList)
          //   app.addDeviceInfo.mode = '' //置空模式
          // })
          return
        }
        app.globalData.DeviceComDecorator.querySN()
        app.bluetoothConn.event.on('receiveMessage', async (data) => {
          if (mode != 20) return
          if (this.data.isCancelHuaLinOn) return
          console.log('receiveMessage eeeeeeeeee', data)
          if (ab2hex(data).slice(0, 12) == '303030303030') {
            let snAsiiArr = hexString2Uint8Array(ab2hex(data))
            let sn = asiiCode2Str(snAsiiArr)
            this.data.plainSn = sn
            app.addDeviceInfo.plainSn = sn
            console.log('原始sn--------------', sn)
            let key = app.globalData.userData.key
            let appKey = api.appKey
            let applianceType = app.addDeviceInfo.type.includes('0x')
              ? app.addDeviceInfo.type
              : '0x' + app.addDeviceInfo.type
            let btMac = this.data.btMac ? this.data.btMac.replace(/:/g, '') : ''
            this.data.sn = cloudEncrypt(sn, key, appKey)
            app.addDeviceInfo.sn = this.data.sn
            console.log('sn--------------', this.data.sn)
            clearInterval(timer)
            // await this.bindDeviceToHome() //防止超时提前绑定
            let reqData = {
              applianceName: this.data.deviceName,
              homegroupId: this.data.currentHomeGroupId,
              roomId: this.data.currentRoomId,
              sn: this.data.sn,
              applianceType: applianceType,
              btMac: btMac,
              modelNumber: '',
            }
            let bindRemoteDeviceResp = null
            try {
              bindRemoteDeviceResp = await service.bindRemoteDevice(reqData)
              Object.assign(bindRemoteDeviceResp, {
                btMac: btMac,
                sn8: this.data.addDeviceInfo.sn8,
                sn: this.data.sn,
                name: this.data.deviceName,
                deviceImg: this.data.deviceImg,
              })
              console.log('遥控设备绑定结果', bindRemoteDeviceResp)
            } catch (error) {
              // showToast('遥控设备绑定失败', error)
              console.log('遥控设备绑定失败', error)
            }
            this.setData({
              curStep: 2,
            })
            // app.addDeviceInfo.mode = 21
            // wx.navigateTo({
            //     url: paths.inputWifiInfo,
            // })
            // let type0x = bindRemoteDeviceResp.type
            // let deviceInfo = encodeURIComponent(JSON.stringify(bindRemoteDeviceResp))
            // wx.closeBLEConnection({ //断开连接
            //     deviceId: app.addDeviceInfo.deviceId
            // })
            // wx.redirectTo({
            //     url: `/plugin/T${type0x}/index/index?backTo=/pages/index/index&deviceInfo=${deviceInfo}`
            // })
            wx.navigateTo({
              url: paths.addSuccess,
            })
            wx.closeBLEConnection({
              //断开连接
              deviceId: app.addDeviceInfo.deviceId,
            })
          }
        })
      },
    })
  },
  refreshCacheOpenBluetoothAdapter() {
    return new Promise((r, j) => {
      wx.openBluetoothAdapter({
        refreshCache: true,
        success() {
          r()
        },
        fail(error) {
          j(error)
        },
      })
    })
  },
  timing(mode) {
    if (timer) {
      clearInterval(timer)
    }
    //  this.data.time = 20
    // if (mode == 0) { //ap时长为70
    //     this.data.time = 70
    // } else {
    //     this.data.time = 60
    // }
    timer = setInterval(() => {
      if (this.data.time > 0) {
        this.setData({
          time: this.data.time - 1,
        })
      }
      if (this.data.time == 0) {
        getApp().setMethodFailedCheckingLog('连接设备进度页超时，跳转失败页')
        const {mode} = app.addDeviceInfo
        let errorCode
        if (mode == 30) {
          errorCode = 901006
        }
        this.goLinkDeviceFailPage(errorCode)
      }
      if (mode == 0 && this.data.time == 0 && !this.data.isBackLinkRoute) {
        //超时还未自动回连成功路由
        console.log('自动回连成功wifi失败埋点')
      }
    }, 1000)
  },

  /**
   * 0x63指令
   * 查询家电信息
   */
  getCombinedFlag() {
    const data = '0300000000000000000000000000000000000000' // 03+19个00
    console.log('@module linkDevice.js\n@method \n@desc 获取模组功能支持信息\n', data)
    let order = constructionBleOrder(0x63, data, app.globalData.bleSessionSecret)
    order = toHexString(order)
    this.writeData(order)
  },
  /**
   * 0x40指令
   * 查询家电信息
   */
  getCombinedDevice() {
    const data = '01'
    console.log('@module linkDevice.js\n@method getCombinedDevice\n@desc 查询家电信息\n', data)
    let order = constructionBleOrder(0x40, data, app.globalData.bleSessionSecret)
    order = toHexString(order)
    this.writeData(order)
  },
  /**
   * 构造配网指令
   * @param {object} bindWifiInfo wifi信息
   * @param {number} blueVersion 蓝牙版本
   * @param {boolean} [ifWrite = true] 是否发送
   */
  sendWifiInfo(bindWifiInfo, blueVersion, ifWrite = true) {
    this.data.bindWifiTest = bindWifiInfo
    let bssid = this.data.bindWifiTest.BSSID.split(':').join('')
    let encryptType = this.data.bindWifiTest.EncryptType
    let lengthArr = []
    lengthArr[0] = this.data.bindWifiTest.SSIDLength
    lengthArr[1] = this.data.bindWifiTest.PswLength
    let ssidLengthAndPswLength = toHexString(lengthArr)
    let ssidAndPsw = this.data.bindWifiTest.SSIDContent + this.data.bindWifiTest.PswContent
    let ssidAndPsw8Arr = string2Uint8Array(ssidAndPsw)
    let ssidAndPswHex = toHexString(ssidAndPsw8Arr)
    let randomHex = this.data.blueRandomCode ? this.data.blueRandomCode : getRandomString(32) //密码错误重试复用随机数不变
    this.data.blueRandomCode = randomHex.toLocaleLowerCase()
    let chain = []
    chain[0] = this.data.bindWifiTest.chain
    let chainHex = toHexString(chain)

    let setRegionId = blueParamsSet.setRegionId()
    let setfeature = blueParamsSet.setfeature()
    let setCountryTimezone = blueParamsSet.setCountryTimezone()
    let setModuleServerDomain = blueParamsSet.setModuleServerDomain()
    let setModuleServerPort = blueParamsSet.setModuleServerPort()
    let setChannels = blueParamsSet.setChannels()
    let order
    let data
    console.log('@module linkDevice.js\n@method sendWifiInfo\n@desc 会话密钥\n', app.globalData.bleSessionSecret)
    if (blueVersion == 1) {
      data = bssid + encryptType + ssidLengthAndPswLength + ssidAndPswHex + randomHex + chainHex
      console.log('@module linkDevice.js\n@method sendWifiInfo\n@desc 一代蓝牙原始配网指令\n', data)
      order = constructionBleOrder(0x68, data, app.globalData.bleSessionSecret)
    }
    if (blueVersion == 2) {
      let mode = app.addDeviceInfo.isCheck ? '02' : '01' //0x01：连接，存储配网参数； 0x02：连接，存储配网参数，并无需确权。
      this.setIfSupportAds(app.addDeviceInfo.adData)
      if (app.addDeviceInfo.ifSupportAds) {
        // 支持ADS集群ID
        const setAdsId = blueParamsSet.setAdsId()
        if (!setAdsId) {
          this.goLinkDeviceFailPage(4164)
          return
        }
        data =
          mode +
          bssid +
          encryptType +
          ssidLengthAndPswLength +
          ssidAndPswHex +
          randomHex +
          chainHex +
          setRegionId +
          setfeature +
          setCountryTimezone +
          setModuleServerDomain +
          setModuleServerPort +
          setChannels +
          setAdsId
      } else {
        data = mode + bssid + encryptType + ssidLengthAndPswLength + ssidAndPswHex + randomHex + chainHex
      }
      console.log('@module linkDevice.js\n@method sendWifiInfo\n@desc 二代蓝牙原始配网指令\n', data)
      order = constructionBleOrder(0x69, data, app.globalData.bleSessionSecret)
    }
    order = toHexString(order)
    console.log('@module linkDevice.js\n@method sendWifiInfo\n@desc 编码后配网指令\n', order)
    if (ifWrite) {
      this.writeData(order)
    } else {
      return order
    }
  },
  remoteSendWifiInfo(bindWifiInfo) {
    this.data.bindWifiTest = bindWifiInfo
    console.log('kkkkkkkk', this.data.bindWifiTest)
    let bssid = this.data.bindWifiTest.BSSID.split(':').join('')
    let encryptType = this.data.bindWifiTest.EncryptType
    let lengthArr = []
    lengthArr[0] = this.data.bindWifiTest.SSIDLength
    lengthArr[1] = this.data.bindWifiTest.PswLength
    let ssidLengthAndPswLength = toHexString(lengthArr)
    let ssidAndPsw = this.data.bindWifiTest.SSIDContent + this.data.bindWifiTest.PswContent
    let ssidAndPsw8Arr = string2Uint8Array(ssidAndPsw)
    let ssidAndPswHex = toHexString(ssidAndPsw8Arr)
    let randomHex = getRandomString(32)
    this.data.blueRandomCode = randomHex
    let chain = []
    chain[0] = this.data.bindWifiTest.chain
    let chainHex = toHexString(chain)
    let final = bssid + encryptType + ssidLengthAndPswLength + ssidAndPswHex + randomHex + chainHex
    app.globalData.DeviceComDecorator.bindDeviceTest(final)
  },
  clickCancel() {
    let {
      deviceId,
      deviceName,
      mac,
      type,
      sn8,
      sn,
      moduleType,
      blueVersion,
      mode,
      moduleVersion,
      cloudBackDeviceInfo,
    } = app.addDeviceInfo
    let linkNet = ''
    if (mode === 3 || mode === 21) {
      //配网
      linkNet = '配网'
    }
    this.setData({
      ishowDialog: true,
      messageContent: `请再等一等，${this.data.deviceName}正在努力连接中`,
      titleContent: `要放弃添加${this.data.deviceName}${linkNet}吗？`,
    })
    // this.setData({
    //   //取消弹窗
    //   customDialog: {
    //     show: true,
    //     title: `要放弃添加${this.data.deviceName}${linkNet}吗？`,
    //     content: `请再等一等，${this.data.deviceName}正在努力连接中`,
    //     cancelText: '放弃添加',
    //     cancelColor: '#267AFF',
    //     confirmText: '再等等',
    //     confirmColor: '#267AFF',
    //     success(res) {
    //       console.log('page dialog res', res)
    //       if (res.confirm) {
    //         burialPoint.clickWait({
    //           deviceSessionId: app.globalData.deviceSessionId,
    //           type: type,
    //           sn8: sn8,
    //           moduleVersion: blueVersion || '',
    //           sn: sn || '',
    //           linkType: app.addDeviceInfo.linkType,
    //         })
    //       } else if (res.cancel) {
    //   burialPoint.clickAbandon({
    //     deviceSessionId: app.globalData.deviceSessionId,
    //     type: type,
    //     sn8: sn8,
    //     moduleVersion: blueVersion || '',
    //     sn: sn || '',
    //     linkType: app.addDeviceInfo.linkType,
    //   })
    //   // 关闭相关进程和连接
    //   clearInterval(timer)
    //   if (mode == 0) {
    //     // AP
    //     self.data.isStopGetExists = true // 停止查询设备是否联网
    //     udpCycTimer && clearInterval(udpCycTimer)
    //     self.tcp && self.finishTcp()
    //   }
    //   const needCloseBLEConnection = [3, 5, 20, 21, 31]
    //   if (needCloseBLEConnection.includes(mode)) {
    //     self.data.isOnbleResp = false
    //     self.data.autoCloseBleConnection = true
    //     wx.closeBLEConnection({
    //       deviceId: app.addDeviceInfo.deviceId,
    //     })
    //   }
    //   if (mode == 20) {
    //     self.data.isCancelHuaLinOn = true
    //   }
    //   if (mode == 21) {
    //     app.addDeviceInfo.mode = '' //置空模式
    //   }
    //   if (mode == 31) {
    //     const type0x = type.includes('0x') ? type : '0x' + type
    //     const deviceInfo = encodeURIComponent(JSON.stringify(cloudBackDeviceInfo))
    //     wx.reLaunch({
    //       url: `/plugin/T${type0x}/index/index?backTo=/pages/index/index&deviceInfo=${deviceInfo}`,
    //     })
    //     return
    //   }
    //   wx.reLaunch({
    //     url: paths.index,
    //   })
    // }
    //     },
    //   },
    // })
  },
  clickWaitAminute() {
    let {type, sn8, sn, blueVersion} = app.addDeviceInfo
    this.setData({
      ishowDialog: false,
    })
  },
  discardAdd() {
    let {
      deviceId,
      deviceName,
      mac,
      type,
      sn8,
      sn,
      moduleType,
      blueVersion,
      mode,
      moduleVersion,
      cloudBackDeviceInfo,
    } = app.addDeviceInfo
    const self = this
    let linkNet = ''
    if (mode === 3 || mode === 21) {
      //配网
      linkNet = '配网'
    }
    // 关闭相关进程和连接
    clearInterval(timer)
    if (mode == 0) {
      // AP
      self.data.isStopGetExists = true // 停止查询设备是否联网
      udpCycTimer && clearInterval(udpCycTimer)
      self.tcp && self.finishTcp()
    }
    const needCloseBLEConnection = [3, 5, 20, 21, 31]
    if (needCloseBLEConnection.includes(mode)) {
      self.data.isOnbleResp = false
      self.data.autoCloseBleConnection = true
      wx.closeBLEConnection({
        deviceId: app.addDeviceInfo.deviceId,
      })
    }
    if (mode == 20) {
      self.data.isCancelHuaLinOn = true
    }
    if (mode == 21) {
      app.addDeviceInfo.mode = '' //置空模式
    }
    if (mode == 31) {
      const type0x = type.includes('0x') ? type : '0x' + type
      const deviceInfo = encodeURIComponent(JSON.stringify(cloudBackDeviceInfo))
      wx.reLaunch({
        url: `/plugin/T${type0x}/index/index?backTo=/pages/index/index&deviceInfo=${deviceInfo}`,
      })
      return
    }
    this.setData({
      ishowDialog: false,
    })
    wx.reLaunch({
      url: paths.index,
    })
  },
  bindDeviceToHome(bindInfo) {
    console.log('开始绑定设备')
    let type = app.addDeviceInfo.type.includes('0x') ? app.addDeviceInfo.type : '0x' + app.addDeviceInfo.type
    let reqData = null
    if (bindInfo && bindInfo.mode == 100) {
      reqData = {
        homegroupId: this.data.currentHomeGroupId,
        // roomId: this.data.currentRoomId,
        sn: this.data.sn,
        applianceType: type,
        verificationCodeKey: bindInfo.verificationCodeKey,
        verificationCode: bindInfo.verificationCode,
        reqId: getReqId(),
        stamp: getStamp(),
      }
    } else {
      reqData = {
        applianceName: app.addDeviceInfo.mode == 21 ? this.data.deviceName : '',
        homegroupId: this.data.currentHomeGroupId,
        // roomId: this.data.currentRoomId,
        sn: this.data.sn,
        applianceType: type,
        btMac: this.data.btMac ? this.data.btMac.replace(/:/g, '') : '',
        reqId: getReqId(),
        stamp: getStamp(),
        bindType: this.data.bindType, //绑定方式，0是AP配网，1是单蓝牙模组的蓝牙绑定, 2是combo的蓝牙配网,3是combo模组的蓝牙绑定, 不传默认都是AP配网
      }
    }
    console.log('bind reqData===', reqData)
    log.info('bind device reqData', reqData)
    //设置默认家庭
    // service.homegroupDefaultSetService(this.data.currentHomeGroupId)
    return new Promise((reslove, reject) => {
      requestService
        .request('bindDeviceToHome', reqData, 'POST', '', 3000)
        .then((resp) => {
          console.log('@module linkDevice.js\n@method bindDeviceToHome\n@desc 绑定设备结果\n', resp.data)
          log.info('bind device result', resp.data)
          if (resp.data.code == 0) {
            app.addDeviceInfo.applianceCode = resp.data.data.applianceCode
            app.addDeviceInfo.lastBindName = resp.data.data.name
            app.globalData.currentRoomId = resp.data.data.roomId
            reslove(resp)
          }
        })
        .catch((error) => {
          console.error('@module linkDevice.js\n@method bindDeviceToHome\n@desc 绑定设备错误\n', error)
          app.addDeviceInfo.errorCode = this.creatErrorCode({
            errorCode: error?.data?.code,
            isCustom: true,
          })
          reject(error)
        })
    })
  },
  async linkSuccess() {
    let self = this
    console.log('触发了----------linkSuccess')
    try {
      let bindRes = await requestWithTry(this.bindDeviceToHome, 3)
      self.setData({
        curStep: 2,
        'progressList[2].isFinish': true,
      })
      clearInterval(timer)
      self.data.isOnbleResp = false
      app.addDeviceInfo.sn = self.data.sn
      self.data.wifi_version = '' //重置蓝牙配网模组版本为空
      app.addDeviceInfo.cloudBackDeviceInfo = bindRes.data.data
      app.addDeviceInfo.cloudBackDeviceInfo.roomName = this.data.currentRoomName
      app.composeApplianceList = []
      // 组合配网新增跳转
      let {applianceCode, combinedDeviceFlag} = app.addDeviceInfo
      if (combinedDeviceFlag) {
        app.composeApplianceList.push(app.addDeviceInfo.cloudBackDeviceInfo)
        const {data} = await this.getApplianceAuthType(applianceCode)
        console.warn('---有组合设备，查询主设备确权中---', data)
        app.addDeviceInfo.status = data.data.status
        app.addDeviceInfo.randomCode = self.data.blueRandomCode
        if (data.data.status == '1' || data.data.status == '2') {
          wx.reLaunch({
            url: `/package-distribution-meiju/pages/addDevice/pages/afterCheck/afterCheck?backTo=/pages/index/index&randomCode=${
              self.data.blueRandomCode || self.data.randomCode
            }`,
          })
        } else {
          // 已确权
          wx.reLaunch({
            url: `${paths.linkCombinedDevice}?randomCode=${self.data.blueRandomCode || self.data.randomCode}`,
          })
        }
      } else {
        wx.reLaunch({
          url: paths.addSuccess,
        })
      }
    } catch (error) {
      console.log('[bind device to home fail]', error)
    }
  },
  // 校验家庭权限
  checkCurrentFamilyPermission(homeGroupId, homeInfo) {
    let currentHomeInfo = []
    if (homeGroupId) {
      currentHomeInfo = homeInfo.find((item) => item.homegroupId === homeGroupId)
    } else {
      currentHomeInfo = homeInfo
    }
    const hasFamilyPermission = checkFamilyPermission({
      currentHomeInfo,
      permissionText: familyPermissionText.distributionNetwork,
      callback: () => {
        wx.switchTab({
          url: '/pages/index/index',
        })
      },
    })
    if (!hasFamilyPermission) {
      this.checkFamilyPermissionBurialPoint()
    }
  },
  getFamilyInfo(groupId, currentRoomId, retryNum = 3, timeout = 2000) {
    let reqData = {
      homegroupId: groupId,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('applianceList', reqData, 'POST', '', timeout)
        .then((resp) => {
          console.log('默认家庭信息', resp.data.data.homeList[0])
          this.checkCurrentFamilyPermission(null, resp.data.data.homeList[0])
          this.setData({
            familyInfo: resp.data.data.homeList[0],
          })
          app.globalData.isCreateFamily =
            resp.data.data.homeList[0].roleId == '1001' || resp.data.data.homeList[0].roleId == '1002' //是否是当前家庭的创建者
          if (currentRoomId) {
            this.setData({
              currentRoomId: currentRoomId,
            })
          } else {
            this.setData({
              currentRoomId: resp.data.data.homeList[0].roomList[0].roomId,
              currentRoomName: resp.data.data.homeList[0].roomList[0].name,
            })
          }
          resolve(resp)
        })
        .catch((error) => {
          console.log('获取家庭信息失败', error)
          if (retryNum > 0) {
            retryNum--
            setTimeout(() => {
              //继续重试
              this.getFamilyInfo(groupId, currentRoomId, retryNum, timeout)
            }, 2000)
          } else {
            reject(error)
          }
        })
    })
  },
  /**
   * 处理蓝牙信息改变
   * @param {string} respHexData 组包后信息
   * @param {object} characteristic 原始设备消息
   */
  handleBLEDataChanged(respHexData, characteristic) {
    const {blueVersion, mode} = app.addDeviceInfo
    if (mode != 31) {
      this.setData({
        curStep: 1,
      })
    }
    if (!this.data.isOnbleResp) return
    app.addDeviceInfo.sn = this.data.sn
    const respHexDataArray = respHexData.split('aa55')
    const order = 'aa55' + respHexDataArray[respHexDataArray.length - 1] // 取最后一个包解析
    const orderBody = paesrBleResponData(order, app.globalData.bleSessionSecret)
    const orderType = order.substring(8, 10)
    console.log('@module linkDevice.js\n@method handleBLEDataChanged\n@desc 蓝牙配网响应数据\n', {
      respHexData,
      order,
      orderBody,
      orderType,
    })
    if (orderType == '0d') {
      this.bluetoothOdErrorCode(orderBody, blueVersion)
    }
    // 组合设备新增响应
    if (orderType == '63' && orderBody.substr(0, 2) == '03') {
      console.log('------0x63-03响应-----')
      this.isBleRespond63 = true
      this.parseTLVfor63(orderBody)
    }
    if (orderType == '40') {
      console.log('------0x40响应-----')
      this.isBleRespond40 = true
      this.parseTLVfor40(orderBody)
      this.sendWifiInfo(this.data.bindWifiInfo, app.addDeviceInfo.blueVersion || '2')
      this.data.msmartBlueLinkNetYetWifiInfo = true //发送了wifi信息
    }
  },
  //蓝牙配网模组OD指令返回的错误信息
  bluetoothOdErrorCode(orderBody, blueVersion) {
    let type = orderBody.substring(4, 6)
    let code = ''
    let code02 = () => {
      // 模组返回WiFi密码错误
      if (blueVersion == 1) {
        // 一代蓝牙
        console.log('@module linkDevice.js\n@method handleBLEDataChanged\n@desc 一代蓝牙返回密码错误')
      } else {
        // 二代蓝牙
        console.log('@module linkDevice.js\n@method handleBLEDataChanged\n@desc 二代蓝牙返回密码错误')
        if (this.bluePswFailDialogShowNum < 3) {
          this.bluePswFailDialog() // 密码错误弹窗
        } else {
          console.log('@module linkDevice.js\n@method handleBLEDataChanged\n@desc 密码错误弹窗超过3次，跳转失败页')
        }
      }
    }
    switch (type) {
      case '01':
        code = '4056' //找不到ssid
        break
      case '02':
        code = '4094' //连接路由失败，密码错误
        code02()
        break
      case '03':
        code = '4058' //DNS解析失败/域名解析失败
        break
      case '04':
        code = '4059' //与服务器建立TCP连接失败（重试次数 或是 通过时间 判断）
        break
      case '05':
        code = '4060' //心跳包超时
        break
      case '06':
        code = '4061' //登录过程sst错误
        break
      case '07':
        code = '4062' //模组主动重启
        break
      case '08':
        code = '4063' //模组被动重启
        break
      case '09':
        code = '4064' //SDK认证失败
        break
      case '0A':
        code = '4065' //登陆过程被服务器主动关闭
        break
      case '0B':
        code = '4066' //登陆过程发送数据失败
        break
      case '0C':
        code = '4098' //连接路由失败,信号弱
        break
      case '0D':
        code = '4099' //DHCP失败
        break
      case '0E':
        code = '4100' //路由器认证错误
        break
      case '0F':
        code = '4101' //路由器关联错误
        break
      case '10':
        code = '4115' //服务器登陆超时
        break
      case '11':
        code = '4116' //APP发送的信道在1~13之间，且SSID包含有“5G/-5G/_5G”等有5G标识的相关字符集，WiFi模块扫描路由器AP失败
        break
      case '12':
        code = '4117' //APP发送的信道在1-13之间，且SSID没有包含“5G/-5G/_5G”相关字符集，wifi模块扫描路由器AP失败。
        break
      case '13':
        code = '4118' //APP发送的信道是0，且SSID中没有包含“5G/-5G/_5G”相关字符集wifi模块扫描路由器AP失败。
        break
      case '14':
        code = '4119' //APP发送的信道是>13，且SSID中没有包含“5G/-5G/_5G”相关字符集wifi模块扫描路由器AP失败。
        break
      case '15':
        code = '4120' //APP发送的信道>13，且SSID包含有“5G/-5G/_5G”等有5G标识的相关字符集，wifi模块扫描路由器AP失败。
        break
      case '16':
        code = '4121' //APP发送的信道是0，且SSID包含有“5G/-5G/_5G”等有5G标识的相关字符集，wifi模块扫描路由器AP失败。
        break
      case '17':
        code = '4165' //ADS DNS解析失败
        break
      case '18':
        code = '4166' //与ADS建立TCP连接失败（重试次数 或是 通过时间 判断）
        break
      case '19':
        code = '4173' //平台集群 ID 错误
        break
      case '20':
        code = '4174' //请求接入层域名错误
        break
      case '21':
        code = '4175' //连接路由中，但路由信号弱
        break
    }
    if (code != '' && code != '4094') {
      this.goLinkDeviceFailPage(code) // 跳转失败页
    }
  },
  /**
   * 创建错误码并跳转失败页
   * @param {number} [errorCode] 错误码
   * @param {boolean} [isCustom] 是否定制
   */
  goLinkDeviceFailPage(errorCode, isCustom = true) {
    // step1: 创建错误码
    if (errorCode) {
      app.addDeviceInfo.errorCode = this.creatErrorCode({
        errorCode: errorCode,
        isCustom: isCustom,
      })
    }

    const {mode} = app.addDeviceInfo

    // step2: 关闭相关进程和连接
    clearInterval(timer) // 清除定时器
    if (mode == 0) {
      // AP
      this.data.isStopGetExists = true // 停止查询设备是否联网
      udpCycTimer && clearInterval(udpCycTimer)
      this.tcp && this.finishTcp()
    }
    const needCloseBLEConnection = [3, 5, 20, 21, 31]
    if (needCloseBLEConnection.includes(mode)) {
      this.data.isOnbleResp = false
      this.data.autoCloseBleConnection = true
      wx.closeBLEConnection({
        deviceId: app.addDeviceInfo.deviceId,
      })
    }
    if (mode == 31) {
      // 置空蓝牙传输方法
      app.addDeviceInfo.msmartBleWrite = null
    }

    // step3: 跳转失败页
    if ([5, 20].includes(mode)) {
      //单蓝牙
      wx.reLaunch({
        url: paths.addFail,
      })
    } else {
      wx.reLaunch({
        url: paths.linkNetFail,
      })
    }
  },
  /**
   * 判断是否支持集群功能
   * @param {object|string} adData 广播包信息
   */
  setIfSupportAds(adData) {
    const {mode} = app.addDeviceInfo
    let binArrayADS
    if (mode == 0) {
      // AP
      binArrayADS = hex2bin(adData.add2)
      app.addDeviceInfo.ifSupportAds = binArrayADS[0] ? true : false
    } else {
      // 二代蓝牙
      const hex = adData.substr(38, 2)
      binArrayADS = hex2bin(hex)
      app.addDeviceInfo.ifSupportAds = binArrayADS[2] && binArrayADS[3] ? true : false
    }
    console.log('@module linkDevice.js\n@method setIfSupportAds\n@desc 判断是否支持集群功能\n', {
      adData,
      mode,
      binArrayADS,
      ifSupportAds: app.addDeviceInfo.ifSupportAds,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad() {
    this.data.brand = brandStyle.brand
    this.setData({
      brand: this.data.brand,
      dms_img_lack:
        this.data.brand != 'colmo' ? './assets/img/dms_img_lack@3x.png' : './assets/img/dms_img_lack_colmo@3x.png',
      // meiPhone:imgUrl+ imgesList['meiPhone'],
      meiPhone:
        this.data.brand !== 'colmo' ? './assets/img/ic_meiphone@1x.png' : './assets/img/ic_meiphone_colmo@1x.png',
      // loadingImg:imgUrl+ imgesList['loading'],
      loadingImg: this.data.brand != 'colmo' ? './assets/img/loading_spot.png' : './assets/img/loading_spot_colmo.png',
      closeImg: imgUrl + imgesList['closeImg'],
    })
    // 清空组合设备数据
    ;(app.combinedDeviceInfo = [{sn: '', a0: ''}]), this.init()
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
    let {isShowOpenlocaltNetTip} = this.data
    this.data.pageStatus = 'show'
    let {mode} = app.addDeviceInfo
    if (mode == 0) {
      this.onWifiSwitch()
    }
    if (this.data.isMamualLinkFamilyWifi || this.data.customDialog.confirmText == '去连接') {
      //手动连接家庭wifi后继续倒计时
      this.timing()
    }
    if (isShowOpenlocaltNetTip && isEmptyObject(this.data.udpAdData)) {
      this.init()
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.data.pageStatus = 'hide'
    clearInterval(checkLinkFamilyWifTimer)
    //先注释掉-yzh
    // let page = getCurrentPages()
    // if (!page[page.length - 1].route.includes(paths.linkDevice) && this.data.customDialog.show) {
    //   //跳转关闭 取消弹窗
    //   this.setData({
    //     ['customDialog.show']: false,
    //   })
    // }
    // if (!page[page.length - 1].route.includes(paths.locationGuide) && this.data.customDialog.show) {
    //   //跳转关闭 取消弹窗
    //   this.setData({
    //     ['customDialog.show']: false,
    //   })
    // }
    if (!isEmptyObject(app.apNoNetBurialPoint)) {
      this.sendApNoNetBurialpoint(app.apNoNetBurialPoint) //批量上报ap 无网触发埋点
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.data.pageStatus = 'unload'
    app.onUnloadCheckingLog()
    app.globalData.scanObj = {} //配网成功了后，需要清除数据，不然下次自发现会用到旧的数据状态
    console.log('页面返回清除了定时器')
    clearInterval(timer)
    clearInterval(udpCycTimer)
    this.data.isStopGetExists = true //停止查询设备联网
    if (this.tcp) {
      this.finishTcp()
    }
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
})
