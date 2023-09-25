// addDevice/pages/addGuide/addGuide.js
const app = getApp()
const log = require('../../../../utils/log')
const addDeviceMixin = require('../assets/js/addDeviceMixin')
const checkAuthMixin = require('../../mixins/checkAuthMixin')
const netWordMixin = require('../../../assets/js/netWordMixin')
const bluetooth = require('../../../../pages/common/mixins/bluetooth')
const dialogCommonData = require('../../../../pages/common/mixins/dialog-common-data.js')
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')

import { isSupportPlugin, isColmoDeviceByDecodeSn } from '../../../../utils/pluginFilter'
import { addDeviceTime } from '../../../assets/js/utils'
import { deviceImgMap } from '../../../../utils/deviceImgMap'
import computedBehavior from '../../../../utils/miniprogram-computed.js'
import { deviceImgApi, baseImgApi, imgBaseUrl } from '../../../../api'
import { burialPoint } from './assets/js/burialPoint'
import { openAdapter } from '../utils/blueApi'
import { getStamp, getReqId, ab2hex } from 'm-utilsdk/index'
import { creatDeviceSessionId, showToast, getFullPageUrl } from '../../../../utils/util'
import { getScanRespPackInfo, getDeviceCategoryAndSn8 } from '../../../../utils/blueAdDataParse'
import { requestService } from '../../../../utils/requestService'
import paths from '../../../../utils/paths'
import { addDeviceSDK } from '../../../../utils/addDeviceSDK'
import { checkPermission } from '../../../../pages/common/js/permissionAbout/checkPermissionTip'
import { typesPreserveAfterCheckGuideByA0 } from '../../config/index'
import Dialog from '../../../../miniprogram_npm/m-ui/mx-dialog/dialog'
const brandStyle = require('../../../assets/js/brand.js')
import { imgesList } from '../../../assets/js/shareImg.js'
const imgUrl = imgBaseUrl.url + '/shareImg/' + app.globalData.brand
let timer

Page({
  behaviors: [
    addDeviceMixin,
    netWordMixin,
    computedBehavior,
    bluetooth,
    dialogCommonData,
    getFamilyPermissionMixin,
    checkAuthMixin,
  ],
  /**
   * 页面的初始数据
   */
  data: {
    mode: null,
    deviceName: '',
    deviceId: '',
    moduleType: Number,
    time: 60,
    distance: '',
    deviceImg: '',
    checkGuideInfo: {
      connectDesc: '',
      connectUrlA: '',
    },
    addDeviceInfo: {},
    guideType: '', //set 设置  near 靠近
    noFound: false, //没发现附近
    isFinishUpAp: false, //是否起ap
    selTypeImg: '', //勾选状态图片
    blueArrowImg: imgUrl + imgesList['network_icon'],
    readingTimer: 4, //阅读指引等待时间 s
    curDeviceISCheck: false,
    guideIndex: 0, //当前显示配网所在的数组索引
    guideInfo: [], //配网指引数组
    ifAllowSkipNear: false, // 是否允许跳过靠近确权
    brand: '',
    dialogStyle: brandStyle.config[app.globalData.brand].dialogStyle, //弹窗样式
    ishowBlueRes: false, //蓝牙权限弹窗
    bluePermissionTextAll: '', //蓝牙权限弹窗-内容
    sel: imgUrl + imgesList['sel'],
    noSel: imgUrl + imgesList['noSel'],
    noFoundImg: imgUrl + imgesList['noFound'],
    guideFlag: false,
    guideBlueRes: '',
    bigScreenBind: brandStyle.config[app.globalData.brand].bigScreenBind,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    getApp().onLoadCheckingLog()
    this.data.brand = app.globalData.brand
    this.setData({
      brand: this.data.brand,
    })
    this.localToast = this.selectComponent('#localToast')
    // this.getAddDeviceInfo()
    console.log('adddeviceinfo===', app.addDeviceInfo)
    this.logAddDivceInfo('添加设备参数', app.addDeviceInfo)
    this.getLoginStatus().then(() => {
      console.log('getLoginStatus===', app.globalData.isLogon)
      this.checkFamilyPermission()
      if (app.globalData.isLogon) {
        this.initAddGuide()
      } else {
        this.navToLogin()
      }
    })
  },
  computed: {
    currGuideInfo() {
      let { connectDesc, connectUrlA } = this.data.checkGuideInfo
      let currConnectDesc = connectDesc
      let currConnectUrl = connectUrlA
      return {
        currConnectDesc,
        currConnectUrl,
      }
    },
    showSwitchFlag() {
      return this.data.guideInfo.length > 1 ? true : false
    },
    isShowBleWifiguide() {
      let { blueVersion, mode, guideType, noFound } = this.data
      let res1 = false
      let res2 = false
      if (blueVersion != 1 && mode != 0 && mode != 5 && guideType == 'near' && !noFound) {
        res1 = true
      }
      if (mode == 20 && !noFound) {
        res2 = true
      }
      return res1 || res2
    },
  },
  switchSet() {
    getApp().setActionCheckingLog('switchSet', '点击切换配网指引')
    const { guideIndex, guideInfo } = this.data
    const nextIndex = guideIndex < guideInfo.length - 1 ? guideIndex + 1 : 0
    this.setData({
      time: 60,
      guideIndex: nextIndex,
      ['checkGuideInfo.connectDesc']: this.guideDescFomat(guideInfo[nextIndex].connectDesc),
      ['checkGuideInfo.connectUrlA']: guideInfo[nextIndex].connectUrlA,
    })
    this.localToast.showToast(`已切换至第${nextIndex + 1}种方式`)
    this.clickNewDeviceGuideInfoViewTrack()
  },
  async initAddGuide() {
    const self = this
    let {
      isFromScanCode,
      moduleType,
      deviceName,
      type,
      sn8,
      ssid,
      deviceId,
      blueVersion,
      deviceImg,
      mode,
      fm, //无来源 默认扫码
      guideInfo, //配网指引
      ifNearby,
      hadChangeBlue, //是否ap转蓝牙
    } = app.addDeviceInfo
    let needTimingMode = [3, 5, 20, 21, 30]
    if (needTimingMode.includes(mode)) {
      clearTimeout(timer)
      console.log('蓝牙相关的配网方式才有----------------------------')
      //蓝牙相关的配网方式才有
      this.timing()
    }
    if (!deviceImg || !deviceName) {
      // 设备图片或名称缺失则补全
      let typeAndName
      if (fm == 'selectType') {
        typeAndName = this.getDeviceImgAndName(type)
      } else {
        typeAndName = this.getDeviceImgAndName(type, sn8)
      }
      if (!deviceImg) app.addDeviceInfo.deviceImg = typeAndName.deviceImg
      if (!deviceName) app.addDeviceInfo.deviceName = typeAndName.deviceName
    }
    console.log('mode===', mode)
    //设置连接方式
    app.addDeviceInfo.linkType = this.getLinkType(mode)
    console.log('进入倒计时')
    this.readingGuideTiming() //开始阅读计时
    this.setData({
      deviceName: app.addDeviceInfo.deviceName,
      moduleType: moduleType,
      addDeviceInfo: app.addDeviceInfo,
      deviceImg: app.addDeviceInfo.deviceImg,
      mode: mode,
      isFromScanCode: isFromScanCode,
      blueVersion: blueVersion,
      guideInfo: guideInfo || [],
    })
    app.globalData.deviceSessionId = app.globalData.deviceSessionId
      ? app.globalData.deviceSessionId
      : creatDeviceSessionId(app.globalData.userData.uid)
    // app.globalData.bluetoothFail = !(await this.checkBluetoothAuth()) //蓝牙配网检查蓝牙是否开启以及是否蓝牙授权
    if (addDeviceSDK.bluetoothAuthModes.includes(mode)) {
      console.log('[需要校验蓝牙权限]')
      let isCanBlue = await this.checkBluetoothAuth()
      console.log('[是否可以使用蓝牙]', isCanBlue)
      if (!isCanBlue) {
        clearInterval(timer)
        // 修改没有开蓝牙时，靠近确权页会跑到配网指引页的问题
        if (
          fm == 'noActive' ||
          fm == 'nfc' ||
          isFromScanCode ||
          blueVersion == 1 ||
          mode == 0 ||
          (mode == 30 && fm != 'autoFound') ||
          mode == 5 ||
          mode == 9 ||
          mode == 10 ||
          mode == 100 ||
          mode == 103 ||
          (mode == 3 && !ifNearby)
        ) {
          this.setData({
            guideType: 'set',
          })
        }
        if ((mode == 3 && ifNearby) || mode == 20 || (mode == 30 && fm == 'autoFound')) {
          this.setData({
            guideType: 'near',
          })
        }
        return
      } else {
        app.globalData.bluetoothFail = false
      }
    }

    if (
      fm == 'noActive' ||
      fm == 'nfc' ||
      isFromScanCode ||
      blueVersion == 1 ||
      mode == 0 ||
      (mode == 30 && fm != 'autoFound') ||
      mode == 5 ||
      mode == 9 ||
      mode == 10 ||
      mode == 100 ||
      mode == 103 ||
      (mode == 3 && !ifNearby)
    ) {
      this.setData({
        guideType: 'set',
      })
      burialPoint.addGuideView({
        deviceSessionId: app.globalData.deviceSessionId,
        sn8: sn8,
        type: type,
        moduleVersion: blueVersion || '',
        linkType: app.addDeviceInfo.linkType,
        fm: fm,
      })
      console.log('上报了配网指引页埋点')
      console.log('fm=====', fm)
      this.getGuideFormat(guideInfo, fm) //获取指引格式化显示
      // if (mode == 0) {
      //   this.setData({
      //     selTypeImg: imgBaseUrl + noSel,
      //   })
      // }
      console.log('---------------Yoram---------------')
      console.log(type + ' ' + mode + ' ' + sn8 + ' ' + fm)
      if (mode == 3 || mode == 5 || mode == 30) {
        //单蓝牙
        let scanObj = {
          mode: mode,
          type: type,
          sn8: sn8,
          fm: fm,
          checkSetConfig: true,
        }
        app.globalData.scanObj = scanObj
        console.log(app.globalData.scanObj)
        // if(fm == 'autoFound' || fm == 'selectType' || fm == 'scanCode' ) {
        this.checkSetConfig(type, sn8, fm)
        // }
      }
      if (mode == 0 && fm != 'autoFound' && !hadChangeBlue) {
        // AP配网非自发现入口，扫描蓝牙信号
        this.searchBlueByType(type, sn8, ssid).then((device) => {
          console.log('@module addGuide.js\n@method initAddGuide\n@desc 匹配到设备信息\n', device)
          // if(!getFullPageUrl().includes('addDevice/pages/addGuide/addGuide')) return //只在本页面弹框
          Dialog.confirm({
            title: '搜索到设备蓝牙信号，可为您自动完成连接',
            confirmButtonText: '自动连接',
            cancelButtonText: '取消',
            confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
            cancelButtonColor: this.data.dialogStyle.cancelButtonColor3,
          })
            .then((res) => {
              if (res.action == 'confirm') {
                // 埋点
                burialPoint.changeBlueDialog({
                  deviceSessionId: app.globalData.deviceSessionId,
                  blueVersion: app.addDeviceInfo.blueVersion,
                  deviceId: app.addDeviceInfo.deviceId,
                  linkType: app.addDeviceInfo.linkType,
                  sn: app.addDeviceInfo.sn,
                  sn8: app.addDeviceInfo.sn8,
                  type: app.addDeviceInfo.type,
                })
                // 转换为蓝牙配网
                app.addDeviceInfo.adData = device.adData
                app.addDeviceInfo.blueVersion = self.getBluetoothType(device.adData)
                app.addDeviceInfo.deviceId = device.deviceId
                app.addDeviceInfo.mac = self.getIosMac(device.advertisData)
                if (!app.addDeviceInfo.referenceRSSI) {
                  app.addDeviceInfo.referenceRSSI = self.getReferenceRSSI(device.adData)
                }
                app.addDeviceInfo.sn8 = self.getBlueSn8(device.adData)
                app.addDeviceInfo.ssid = self.getBluetoothSSID(
                  device.adData,
                  app.addDeviceInfo.blueVersion,
                  device.type,
                  device.localName,
                )
                app.addDeviceInfo.mode = 3
                app.addDeviceInfo.linkType = addDeviceSDK.getLinkType(3)
                app.addDeviceInfo.hadChangeBlue = true
                console.log('@module addGuide.js\n@method initAddGuide\n@desc 更新设备信息\n', app.addDeviceInfo)
                // 埋点
                burialPoint.confirmChangeBlueDialog({
                  deviceSessionId: app.globalData.deviceSessionId,
                  blueVersion: app.addDeviceInfo.blueVersion,
                  deviceId: app.addDeviceInfo.deviceId,
                  linkType: app.addDeviceInfo.linkType,
                  sn: app.addDeviceInfo.sn,
                  sn8: app.addDeviceInfo.sn8,
                  type: app.addDeviceInfo.type,
                })
                // 解析蓝牙功能状态
                const packInfo = getScanRespPackInfo(device.adData)
                console.log('@module addGuide.js\n@method initAddGuide\n@desc 蓝牙功能状态\n', packInfo)
                if (packInfo.isWifiCheck || packInfo.isBleCheck || packInfo.isCanSet) {
                  // 设备已确权
                  app.addDeviceInfo.isCheck = true
                  wx.navigateTo({
                    url: paths.linkDevice,
                  })
                } else if (app.addDeviceInfo.blueVersion == 1) {
                  // 一代蓝牙
                  wx.navigateTo({
                    url: paths.linkDevice,
                  })
                } else {
                  // 二代蓝牙
                  app.addDeviceInfo.ifNearby = true
                  wx.redirectTo({
                    url: paths.addGuide,
                  })
                }
              }
            })
            .catch((error) => {
              // 埋点
              burialPoint.changeBlueDialog({
                deviceSessionId: app.globalData.deviceSessionId,
                blueVersion: app.addDeviceInfo.blueVersion,
                deviceId: app.addDeviceInfo.deviceId,
                linkType: app.addDeviceInfo.linkType,
                sn: app.addDeviceInfo.sn,
                sn8: app.addDeviceInfo.sn8,
                type: app.addDeviceInfo.type,
              })
              // 埋点
              burialPoint.cancelChangeBlueDialog({
                deviceSessionId: app.globalData.deviceSessionId,
                blueVersion: app.addDeviceInfo.blueVersion,
                deviceId: app.addDeviceInfo.deviceId,
                linkType: app.addDeviceInfo.linkType,
                sn: app.addDeviceInfo.sn,
                sn8: app.addDeviceInfo.sn8,
                type: app.addDeviceInfo.type,
              })
            })
          // wx.showModal({
          //   title: '',
          //   content: '搜索到设备蓝牙信号，可为您自动完成连接',
          //   cancelText: '取消',
          //   cancelColor: '#267AFF',
          //   confirmText: '自动连接',
          //   confirmColor: '#267AFF',
          //   success(res) {
          //     // 埋点
          //     burialPoint.changeBlueDialog({
          //       deviceSessionId: app.globalData.deviceSessionId,
          //       blueVersion: app.addDeviceInfo.blueVersion,
          //       deviceId: app.addDeviceInfo.deviceId,
          //       linkType: app.addDeviceInfo.linkType,
          //       sn: app.addDeviceInfo.sn,
          //       sn8: app.addDeviceInfo.sn8,
          //       type: app.addDeviceInfo.type,
          //     })
          //     if (res.confirm) {
          //       // 转换为蓝牙配网
          //       app.addDeviceInfo.adData = device.adData
          //       app.addDeviceInfo.blueVersion = self.getBluetoothType(device.adData)
          //       app.addDeviceInfo.deviceId = device.deviceId
          //       app.addDeviceInfo.mac = self.getIosMac(device.advertisData)
          //       if (!app.addDeviceInfo.referenceRSSI) {
          //         app.addDeviceInfo.referenceRSSI = self.getReferenceRSSI(device.adData)
          //       }
          //       app.addDeviceInfo.sn8 = self.getBlueSn8(device.adData)
          //       app.addDeviceInfo.ssid = self.getBluetoothSSID(
          //         device.adData,
          //         app.addDeviceInfo.blueVersion,
          //         device.type,
          //         device.localName
          //       )
          //       app.addDeviceInfo.mode = 3
          //       app.addDeviceInfo.linkType = addDeviceSDK.getLinkType(3)
          //       app.addDeviceInfo.hadChangeBlue = true
          //       console.log('@module addGuide.js\n@method initAddGuide\n@desc 更新设备信息\n', app.addDeviceInfo)
          //       // 埋点
          //       burialPoint.confirmChangeBlueDialog({
          //         deviceSessionId: app.globalData.deviceSessionId,
          //         blueVersion: app.addDeviceInfo.blueVersion,
          //         deviceId: app.addDeviceInfo.deviceId,
          //         linkType: app.addDeviceInfo.linkType,
          //         sn: app.addDeviceInfo.sn,
          //         sn8: app.addDeviceInfo.sn8,
          //         type: app.addDeviceInfo.type,
          //       })
          //       // 解析蓝牙功能状态
          //       const packInfo = getScanRespPackInfo(device.adData)
          //       console.log('@module addGuide.js\n@method initAddGuide\n@desc 蓝牙功能状态\n', packInfo)
          //       if (packInfo.isWifiCheck || packInfo.isBleCheck || packInfo.isCanSet) {
          //         // 设备已确权
          //         app.addDeviceInfo.isCheck = true
          //         wx.navigateTo({
          //           url: paths.linkDevice,
          //         })
          //       } else if (app.addDeviceInfo.blueVersion == 1) {
          //         // 一代蓝牙
          //         wx.navigateTo({
          //           url: paths.linkDevice,
          //         })
          //       } else {
          //         // 二代蓝牙
          //         app.addDeviceInfo.ifNearby = true
          //         wx.redirectTo({
          //           url: paths.addGuide,
          //         })
          //       }
          //     } else if (res.cancel) {
          //       // 埋点
          //       burialPoint.cancelChangeBlueDialog({
          //         deviceSessionId: app.globalData.deviceSessionId,
          //         blueVersion: app.addDeviceInfo.blueVersion,
          //         deviceId: app.addDeviceInfo.deviceId,
          //         linkType: app.addDeviceInfo.linkType,
          //         sn: app.addDeviceInfo.sn,
          //         sn8: app.addDeviceInfo.sn8,
          //         type: app.addDeviceInfo.type,
          //       })
          //     }
          //   },
          // })
        })
      }
    }
    if ((mode == 3 && ifNearby) || mode == 20 || (mode == 30 && fm == 'autoFound')) {
      burialPoint.nearDecieView({
        deviceSessionId: app.globalData.deviceSessionId,
        sn8: sn8,
        type: type,
        moduleVison: blueVersion,
      })
      if (mode == 3) app.addDeviceInfo.ifNearby = false
      this.setData({
        guideType: 'near',
      })
      await this.getNearbyParams()
      this.checkNearby(
        deviceId,
        app.addDeviceInfo.referenceRSSI,
        app.addDeviceInfo.downlinkThreshold,
        this.data.distance,
        true,
      ).then(() => {
        clearInterval(timer)
        wx.navigateTo({
          url: paths.linkDevice,
        })
      })
    }
  },
  /**
   * 获取靠近确权相关参数
   */
  async getNearbyParams() {
    const { mode, sn8, type } = app.addDeviceInfo
    try {
      // 获取确权距离阈值
      const threshold = await this.getNetworkThreshold(type, sn8)
      console.log('@module addGuide.js\n@method initAddGuide\n@desc 确权距离阈值接口返回\n', threshold)
      this.setData({
        distance: threshold.distanceThreshold || '1.2',
      })
      app.addDeviceInfo.downlinkThreshold = threshold.downlinkThreshold || -60
      if (threshold.signalReference) {
        app.addDeviceInfo.referenceRSSI = threshold.signalReference
      }
    } catch (err) {
      console.error(err)
      this.setData({
        distance: '1.2',
      })
      app.addDeviceInfo.downlinkThreshold = -60
    }
    if (mode == 3) {
      // 部分品类使用A0获取后确权指引，此时没有A0需展示跳过按钮
      if (typesPreserveAfterCheckGuideByA0.includes(type)) {
        console.log('@module addGuide.js\n@method initAddGuide\n@desc A0获取后确权指引品类，展示跳过按钮')
        this.setData({
          ifAllowSkipNear: true,
        })
        return
      }
      // 获取后确权指引
      const afterCheckReq = {
        category: type,
        code: sn8,
        enterprise: '0000',
      }
      console.log('@module addGuide.js\n@method initAddGuide\n@desc 后确权指引请求参数\n', afterCheckReq)
      requestService
        .request('getIotConfirmInfoV2', afterCheckReq, 'POST', '', 10000)
        .then((resp) => {
          console.log('@module addGuide.js\n@method initAddGuide\n@desc 后确权指引请求结果\n', resp.data.data)
          if (resp.data.data.confirmDesc || resp.data.data.confirmImgUrl) {
            this.setData({
              ifAllowSkipNear: true,
            })
          }
        })
        .catch((error) => {
          console.error('@module addGuide.js\n@method initAddGuide\n@desc 后确权指引请求失败\n', error)
        })
    }
  },
  /**
   * 重试靠近确权
   */
  async retryCheckNearby() {
    const this_ = this
    if (this.retryClickFlag) return
    this.retryClickFlag = true
    this.timing()
    await this.getNearbyParams()
    this.checkNearby(
      app.addDeviceInfo.deviceId,
      app.addDeviceInfo.referenceRSSI,
      app.addDeviceInfo.downlinkThreshold,
      this.data.distance,
      true,
    )
      .then(() => {
        clearInterval(timer)
        wx.navigateTo({
          url: paths.linkDevice,
          complete() {
            this_.retryClickFlag = false
          },
        })
      })
      .catch(() => {
        this_.retryClickFlag = false
      })
  },
  getLoginStatus() {
    return app
      .checkGlobalExpiration()
      .then(() => {
        this.setData({
          isLogon: app.globalData.isLogon,
        })
      })
      .catch(() => {
        app.globalData.isLogon = false
        this.setData({
          isLogin: app.globalData.isLogon,
        })
      })
  },
  navToLogin() {
    app.globalData.isLogon = false
    this.setData({
      isLogin: app.globalData.isLogon,
    })
    wx.navigateTo({
      url: paths.login,
    })
  },

  getAddDeviceInfo() {
    let addDeviceInfo = {
      deviceName: '滚筒洗衣机',
      deviceId: '', //设备蓝牙id
      mac: 'A0:68:1C:BC:38:27', //设备mac combo:'A0:68:1C:74:CC:4A'  一代：'84:7C:9B:77:2D:47' 华凌：'A0:68:1C:BC:38:27'
      type: 'DB', //设备品类 AC
      sn8: '14392',
      deviceImg: 'https://www.smartmidea.net/projects/sit/meiju-lite-assets/mainContent/images/img_wushebei.png', //设备图片
      moduleType: 1, //模组类型 0：ble 1:ble+weifi
      blueVersion: null, //蓝牙版本 1:1代  2：2代
      mode: 0,
      adData: 'a806013232303430303235414339333831011100322738bc1c68a0',
      fm: 'autoFound',
      productId: '',
      enterprise: '0000',
      isFromScanCode: false,
    }
    app.addDeviceInfo = addDeviceInfo
  },
  //跳转反馈
  feedback() {
    burialPoint.clickFeedback({
      deviceSessionId: app.globalData.deviceSessionId,
      moduleType: app.addDeviceInfo.moduleType,
      type: app.addDeviceInfo.type,
      sn8: app.addDeviceInfo.sn8,
    })
    wx.navigateTo({
      url: paths.feedback,
    })
  },
  //获取指引格式化显示
  getGuideFormat(guideInfo, fm) {
    let {
      type,
      sn8,
      mode,
      enterprise, //企业码
      productId,
      tsn, //扫码解析出
      ssid,
      sn,
    } = app.addDeviceInfo
    //guideInfo 有可能为null, 逻辑都进不去，没有请求到配网指引，故添加 guideInfo是否存在的判断
    if (guideInfo && guideInfo.length != 0) {
      //有提前获取的配网指引
      this.setData({
        ['checkGuideInfo.connectDesc']: this.guideDescFomat(guideInfo[0].connectDesc),
        ['checkGuideInfo.connectUrlA']: guideInfo[0].connectUrlA,
      })
      this.getNewDeviceGuideInfoViewTrack(guideInfo)
    } else {
      switch (
        fm //根据入口不同获取不同的指引
      ) {
        case 'autoFound':
          this.getAutoFoundGuide(mode, type, sn8, enterprise, productId, ssid)
          break
        case 'selectType':
          this.getSelectTypeGuide(type, sn8, enterprise, productId)
          break
        case 'scanCode':
          this.getScanCodeGuide(mode, type, sn8, (enterprise = '0000'), tsn, ssid, (sn = ''))
          break
        default:
          this.getSelectTypeGuide(type, sn8, enterprise, productId)
      }
    }
  },
  //阅读指引计时
  readingGuideTiming() {
    let { readingTimer } = this.data
    const timer = setInterval(() => {
      if (readingTimer >= 0) {
        console.log('倒计时')
        this.setData({
          readingTimer: readingTimer--,
        })
      } else {
        clearInterval(timer)
      }
    }, 1000)
  },
  timing(time) {
    let self = this
    this.setData({
      time: time || 60,
    })
    timer = setInterval(() => {
      if (this.data.time > 0) {
        this.setData({
          time: this.data.time - 1,
        })
      }
      if (this.data.time == 0) {
        clearInterval(timer)
        if (this.data.guideType == 'near') {
          wx.offBluetoothDeviceFound()
          wx.stopBluetoothDevicesDiscovery()
          let page = getFullPageUrl()
          console.log('靠近确权============getFullPageUrl', page)
          if (page.includes('addDevice/pages/addGuide/addGuide')) {
            if (!this.data.ifAllowSkipNear) {
              Dialog.confirm({
                title: '未靠近设备',
                message: '请尝试重新靠近',
                confirmButtonText: '重试',
                cancelButtonText: '退出',
                confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
                cancelButtonColor: this.data.dialogStyle.cancelButtonColor3,
              })
                .then((res) => {
                  if (res.action == 'confirm') {
                    burialPoint.nearTimeoutDialogView({
                      deviceSessionId: app.globalData.deviceSessionId,
                      blueVersion: app.addDeviceInfo.blueVersion,
                      deviceId: app.addDeviceInfo.deviceId,
                      linkType: app.addDeviceInfo.linkType,
                      sn: app.addDeviceInfo.sn,
                      sn8: app.addDeviceInfo.sn8,
                      type: app.addDeviceInfo.type,
                    })

                    // 重试
                    this.retryClickFlag = false
                    self.retryCheckNearby()
                    burialPoint.confirmNearTimeoutDialog({
                      deviceSessionId: app.globalData.deviceSessionId,
                      blueVersion: app.addDeviceInfo.blueVersion,
                      deviceId: app.addDeviceInfo.deviceId,
                      linkType: app.addDeviceInfo.linkType,
                      sn: app.addDeviceInfo.sn,
                      sn8: app.addDeviceInfo.sn8,
                      type: app.addDeviceInfo.type,
                    })
                  }
                })
                .catch((error) => {
                  if (error.action == 'cancel') {
                    // 退出
                    wx.reLaunch({
                      url: paths.index,
                    })
                    burialPoint.cancelNearTimeoutDialog({
                      deviceSessionId: app.globalData.deviceSessionId,
                      blueVersion: app.addDeviceInfo.blueVersion,
                      deviceId: app.addDeviceInfo.deviceId,
                      linkType: app.addDeviceInfo.linkType,
                      sn: app.addDeviceInfo.sn,
                      sn8: app.addDeviceInfo.sn8,
                      type: app.addDeviceInfo.type,
                    })
                  }
                })

              // 不允许跳过
              // wx.showModal({
              //   title: '未靠近设备',
              //   content: '请尝试重新靠近',
              //   cancelText: '退出',
              //   cancelColor: '#267AFF',
              //   confirmText: '重试',
              //   confirmColor: '#267AFF',
              //   success(res) {
              //     burialPoint.nearTimeoutDialogView({
              //       deviceSessionId: app.globalData.deviceSessionId,
              //       blueVersion: app.addDeviceInfo.blueVersion,
              //       deviceId: app.addDeviceInfo.deviceId,
              //       linkType: app.addDeviceInfo.linkType,
              //       sn: app.addDeviceInfo.sn,
              //       sn8: app.addDeviceInfo.sn8,
              //       type: app.addDeviceInfo.type,
              //     })
              //     if (res.confirm) {
              //       // 重试
              //       self.retryCheckNearby()
              //       burialPoint.confirmNearTimeoutDialog({
              //         deviceSessionId: app.globalData.deviceSessionId,
              //         blueVersion: app.addDeviceInfo.blueVersion,
              //         deviceId: app.addDeviceInfo.deviceId,
              //         linkType: app.addDeviceInfo.linkType,
              //         sn: app.addDeviceInfo.sn,
              //         sn8: app.addDeviceInfo.sn8,
              //         type: app.addDeviceInfo.type,
              //       })
              //     } else if (res.cancel) {
              //       // 退出
              //       wx.reLaunch({
              //         url: paths.index,
              //       })
              //       burialPoint.cancelNearTimeoutDialog({
              //         deviceSessionId: app.globalData.deviceSessionId,
              //         blueVersion: app.addDeviceInfo.blueVersion,
              //         deviceId: app.addDeviceInfo.deviceId,
              //         linkType: app.addDeviceInfo.linkType,
              //         sn: app.addDeviceInfo.sn,
              //         sn8: app.addDeviceInfo.sn8,
              //         type: app.addDeviceInfo.type,
              //       })
              //     }
              //   },
              // })
            } else {
              Dialog.confirm({
                title: '未靠近设备',
                message: '你可以跳过该步骤，后续再通过操作设备进行验证',
                confirmButtonText: '跳过',
                cancelButtonText: '重试',
                confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
                cancelButtonColor: this.data.dialogStyle.cancelButtonColor3,
              })
                .then((res) => {
                  if (res.action == 'confirm') {
                    burialPoint.skipDialogView({
                      deviceSessionId: app.globalData.deviceSessionId,
                      sn8: app.addDeviceInfo.sn8,
                      type: app.addDeviceInfo.type,
                      moduleVersion: app.addDeviceInfo.blueVersion,
                    })
                    //跳过
                    app.addDeviceInfo.isCheck = false
                    wx.navigateTo({
                      url: paths.linkDevice,
                    })
                    burialPoint.clickAbandonNearSkip({
                      deviceSessionId: app.globalData.deviceSessionId,
                      sn8: app.addDeviceInfo.sn8,
                      type: app.addDeviceInfo.type,
                      moduleVersion: app.addDeviceInfo.blueVersion,
                    })
                  }
                })
                .catch((error) => {
                  if (error.action == 'cancel') {
                    burialPoint.skipDialogView({
                      deviceSessionId: app.globalData.deviceSessionId,
                      sn8: app.addDeviceInfo.sn8,
                      type: app.addDeviceInfo.type,
                      moduleVersion: app.addDeviceInfo.blueVersion,
                    })
                    //重试
                    this.retryClickFlag = false
                    self.retryCheckNearby()
                    burialPoint.clickAbandonNearRetry({
                      deviceSessionId: app.globalData.deviceSessionId,
                      sn8: app.addDeviceInfo.sn8,
                      type: app.addDeviceInfo.type,
                      moduleVersion: app.addDeviceInfo.blueVersion,
                    })
                  }
                })
              // 允许跳过
              // wx.showModal({
              //   title: '未靠近设备',
              //   content: '你可以跳过该步骤，后续再通过操作设备进行验证',
              //   cancelText: '重试',
              //   cancelColor: '#267AFF',
              //   confirmText: '跳过',
              //   confirmColor: '#267AFF',
              //   success(res) {
              //     burialPoint.skipDialogView({
              //       deviceSessionId: app.globalData.deviceSessionId,
              //       sn8: app.addDeviceInfo.sn8,
              //       type: app.addDeviceInfo.type,
              //       moduleVersion: app.addDeviceInfo.blueVersion,
              //     })
              //     if (res.confirm) {
              //       //跳过
              //       app.addDeviceInfo.isCheck = false
              //       wx.navigateTo({
              //         url: paths.linkDevice,
              //       })
              //       burialPoint.clickAbandonNearSkip({
              //         deviceSessionId: app.globalData.deviceSessionId,
              //         sn8: app.addDeviceInfo.sn8,
              //         type: app.addDeviceInfo.type,
              //         moduleVersion: app.addDeviceInfo.blueVersion,
              //       })
              //     } else if (res.cancel) {
              //       //重试
              //       self.retryCheckNearby()
              //       burialPoint.clickAbandonNearRetry({
              //         deviceSessionId: app.globalData.deviceSessionId,
              //         sn8: app.addDeviceInfo.sn8,
              //         type: app.addDeviceInfo.type,
              //         moduleVersion: app.addDeviceInfo.blueVersion,
              //       })
              //     }
              //   },
              // })
            }
          }
        }
        if (this.data.guideType == 'set') {
          this.setData({
            noFound: true,
          })
          if (this.data.mode == 3) {
            wx.offBluetoothDeviceFound()
            wx.stopBluetoothDevicesDiscovery()
          }
          burialPoint.notFoundDeviceWifiPopupView({
            deviceSessionId: app.globalData.deviceSessionId,
            sn8: app.addDeviceInfo.sn8,
            type: app.addDeviceInfo.type,
            moduleType: app.addDeviceInfo.moduleType,
          })
        }
      }
    }, 1000)
  },
  //勾选
  finish() {
    if (this.data.readingTimer > 0) {
      //未阅读完毕
      return
    }
    getApp().setActionCheckingLog('finish', '点击勾选完成事件')
    this.setData({
      isFinishUpAp: !this.data.isFinishUpAp,
    })
  },
  //ap完成手动确权
  async next() {
    let { mode, ssid, sn8, fm, hadChangeBlue } = app.addDeviceInfo
    if (!this.data.isFinishUpAp) {
      showToast('请先勾选')
      return
    }
    if (hadChangeBlue && mode) {
      // AP转换蓝牙配网，配网进度页手势右滑返回时转回AP配网
      app.addDeviceInfo.mode = 0
      mode = 0
      app.addDeviceInfo.linkType = addDeviceSDK.getLinkType(0)
    }
    getApp().setActionCheckingLog('next', '点击下一步按钮事件')
    burialPoint.clickGuideNext({
      deviceSessionId: app.globalData.deviceSessionId,
      sn8: app.addDeviceInfo.sn8,
      type: app.addDeviceInfo.type,
      moduleVersion: app.addDeviceInfo.blueVersion,
      linkType: app.addDeviceInfo.linkType,
    })
    wx.offBluetoothDeviceFound()
    wx.stopBluetoothDevicesDiscovery()
    if (mode == 0) {
      this.searchBlueStopTimeout && clearTimeout(this.searchBlueStopTimeout)
      //ap
      if (this.isCanDrivingLinkDeviceAp(ssid)) {
        // app.addDeviceInfo.isCanDrivingLinkDeviceAp = true
        wx.navigateTo({
          url: paths.linkAp,
        })
      } else {
        wx.navigateTo({
          url: paths.linkAp, //手动连接ap页
          events: {
            backFn: (backParams) => {
              console.log(backParams)
              if (backParams.backPath == 'linkAp' || backParams.backPath == 'linkNetFail') {
                //页面返回
                this.setData({
                  isFinishUpAp: false,
                })
              }
            },
          },
        })
      }
    }
  },
  async retry() {
    this.setData({
      noFound: false,
    })
    getApp().setActionCheckingLog('retry', '点击重试按钮')
    this.timing()
    app.globalData.bluetoothFail = !(await this.checkBluetoothAuth()) //蓝牙配网检查蓝牙是否开启以及是否蓝牙授权
    const { type, sn8, fm } = app.addDeviceInfo
    if (this.data.guideType == 'near') {
      this.checkNearby(
        app.addDeviceInfo.deviceId,
        app.addDeviceInfo.referenceRSSI,
        app.addDeviceInfo.downlinkThreshold,
        this.data.distance,
        true,
      ).then(() => {
        clearInterval(timer)
        wx.navigateTo({
          url: paths.linkDevice,
        })
      })
    } else {
      this.checkSetConfig(type, sn8, fm)
    }
    burialPoint.clickretrySetDevice({
      deviceSessionId: app.globalData.deviceSessionId,
      moduleType: app.addDeviceInfo.moduleType,
      type: app.addDeviceInfo.type,
      sn8: app.addDeviceInfo.sn8,
    })
  },
  //本地蓝牙跳转  储存
  async openPlugin() {
    getApp().setActionCheckingLog('openPlugin', '本地蓝牙点击跳转插件')
    let { type, A0, sn8, deviceName, deviceImg, linkType } = app.addDeviceInfo
    burialPoint.clickDownLoadOpenPlugin({
      deviceSessionId: app.globalData.deviceSessionId,
      type,
      sn8,
      linkType,
    })
    let currentHomeGroupId = app.globalData.currentHomeGroupId
    let typeFomat = type.includes('0x') ? type.toLocaleUpperCase() : '0x' + type.toLocaleUpperCase()
    console.log('is has plugin', isSupportPlugin(typeFomat, sn8), currentHomeGroupId)
    if (!currentHomeGroupId) {
      //无加载到默认家庭
      console.log('获取当前家庭id')
      app.globalData.currentHomeGroupId = await this.getCurrentHomeGroupId()
      currentHomeGroupId = app.globalData.currentHomeGroupId
      console.log('当前家庭id===', app.globalData.currentHomeGroupId)
    }
    let homeList = await this.getFamilyInfo(currentHomeGroupId)
    let roomName = homeList[0].roomList[0].name
    let roomId = homeList[0].roomList[0].roomId
    let deviceInfo = {
      modelNumber: A0,
      name: deviceName,
      sn8,
      type: typeFomat,
      deviceImg,
      roomId,
      roomName,
      activeTime: addDeviceTime(new Date()),
      cardType: 'localBlue', //本地蓝牙
    }
    console.log('deviceInfo', deviceInfo)

    let localBlueDevices = wx.getStorageSync('localBlueDevices') || {}
    console.log('当前家庭id', currentHomeGroupId, localBlueDevices)
    if (currentHomeGroupId && localBlueDevices[currentHomeGroupId]) {
      localBlueDevices[currentHomeGroupId].push(deviceInfo)
    } else {
      localBlueDevices[currentHomeGroupId] = new Array()
      localBlueDevices[currentHomeGroupId].push(deviceInfo)
    }
    console.log('local blue devices =====', localBlueDevices)
    wx.setStorageSync('localBlueDevices', localBlueDevices)
    if (isSupportPlugin(typeFomat, sn8)) {
      // goTopluginPage(deviceInfo, paths.index, true)
      wx.reLaunch({
        url: paths.unSupportDevice,
      })
    } else {
      wx.reLaunch({
        url: paths.unSupportDevice,
      })
    }
  },

  async touchScanCode() {
    if (!this.data.isFinishUpAp) {
      return
    }
    getApp().setActionCheckingLog('touchScanCode', '点击大屏扫码按钮事件')
    //大屏这里是扫码按钮
    let { deviceName, type, sn } = app.addDeviceInfo
    let scanResult = {}
    try {
      scanResult = await this.scanCode()
      console.log('scanResult==================:', scanResult)
    } catch (error) {
      console.log('扫码失败====', error)
      if (!error.errMsg.includes('fail cancel')) {
        Dialog.confirm({
          title: '该二维码无法识别，请扫描设备屏幕二维码',
          confirmButtonText: '我知道了',
          confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
          cancelButtonColor: this.data.dialogStyle.cancelButtonColor3,
          showCancelButton: false,
        }).then((res) => {
          if (res.action == 'confirm') {
          }
        })
        //非主动取消扫码
        // wx.showModal({
        //   title: '',
        //   content: '该二维码无法识别，请扫描设备屏幕二维码',
        //   confirmText: '我知道了',
        //   confirmColor: '#267AFF',
        //   showCancel: false,
        //   success() {},
        // })
      }
      getApp().setMethodFailedCheckingLog('wx.scanCode()', `微信扫码接口返回异常，error=${JSON.stringify(error)}`)
      return
    }
    let scanCdoeResObj = addDeviceSDK.dynamicCodeAdd.getTouchScreenScanCodeInfo(scanResult.result)
    console.log('bigScreenScanCodeInfo=======', scanCdoeResObj)
    if (scanCdoeResObj.verificationCode && scanCdoeResObj.verificationCodeKey) {
      //有验证码信息
      app.addDeviceInfo.type = scanCdoeResObj.type.toUpperCase()
      app.addDeviceInfo.sn = scanCdoeResObj.sn
      app.addDeviceInfo.bigScreenScanCodeInfo = scanCdoeResObj
      burialPoint.touchScreenDiolog({
        deviceSessionId: app.globalData.deviceSessionId,
        type: type,
        sn: app.addDeviceInfo.sn,
        msg: '触屏配网扫码成功',
      })

      Dialog.confirm({
        title: `你正在添加${deviceName},确定要继续吗？`,
        confirmButtonText: '确定',
        cancleButtonText: '取消',
        confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
        cancelButtonColor: this.data.dialogStyle.cancelButtonColor3,
      })
        .then((res) => {
          if (res.action == 'confirm') {
            //确定
            wx.navigateTo({
              url: paths.linkDevice,
            })
            burialPoint.touchScreenDiologConfirm({
              deviceSessionId: app.globalData.deviceSessionId,
              type: type,
              sn: app.addDeviceInfo.sn,
            })
          }
        })
        .catch((error) => {
          if (res.action == 'cancle') {
            //取消
            burialPoint.touchScreenDiologCancel({
              deviceSessionId: app.globalData.deviceSessionId,
              type: type,
              sn: app.addDeviceInfo.sn,
            })
          }
        })

      // wx.showModal({
      //   title: '',
      //   content: `你正在添加${deviceName},确定要继续吗？`,
      //   cancelText: '取消',
      //   cancelColor: '#267AFF',
      //   confirmText: '确定',
      //   confirmColor: '#267AFF',
      //   success(res) {
      //     if (res.confirm) {
      //       //确定
      //       wx.navigateTo({
      //         url: paths.linkDevice,
      //       })
      //       burialPoint.touchScreenDiologConfirm({
      //         deviceSessionId: app.globalData.deviceSessionId,
      //         type: type,
      //         sn: app.addDeviceInfo.sn,
      //       })
      //     } else if (res.cancel) {
      //       //取消
      //       burialPoint.touchScreenDiologCancel({
      //         deviceSessionId: app.globalData.deviceSessionId,
      //         type: type,
      //         sn: app.addDeviceInfo.sn,
      //       })
      //     }
      //   },
      // })
    } else {
      Dialog.confirm({
        title: '该二维码无法识别，请扫描设备屏幕二维码',
        confirmButtonText: '我知道了',
        confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
        cancelButtonColor: this.data.dialogStyle.cancelButtonColor3,
        showCancelButton: false,
      }).then((res) => {
        if (res.action == 'confirm') {
          //知道了
          burialPoint.touchScreenDiologClickKnow({
            deviceSessionId: app.globalData.deviceSessionId,
            type: type,
            sn: sn,
          })
        }
      })

      // wx.showModal({
      //   title: '',
      //   content: '该二维码无法识别，请扫描设备屏幕二维码',
      //   confirmText: '我知道了',
      //   confirmColor: '#267AFF',
      //   showCancel: false,
      //   success(res) {
      //     if (res.confirm) {
      //       //知道了
      //       burialPoint.touchScreenDiologClickKnow({
      //         deviceSessionId: app.globalData.deviceSessionId,
      //         type: type,
      //         sn: sn,
      //       })
      //     }
      //   },
      // })
      burialPoint.touchScreenErrorDiolog({
        deviceSessionId: app.globalData.deviceSessionId,
        type: type,
        sn: sn,
        msg: '触屏配网生成二维码，无法识别',
      })
      getApp().setMethodFailedCheckingLog(
        'touchScanCode',
        `触屏配网生成二维码，无法识别。code=${JSON.stringify(scanCdoeResObj)}`,
      )
    }
  },
  //校验是否手动确权
  async checkSetConfig(type, sn8, fm) {
    console.log('@module addGuide.js\n@method checkSetConfig\n@desc 手动确权品类\n', type)
    const self = this
    openAdapter()
      .then(() => {
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: true,
          powerLevel: 'low',
          interval: 500,
          success: (res) => {
            console.log('startBluetoothDevicesDiscovery success', res)
            getApp().setMethodCheckingLog('wx.startBluetoothDevicesDiscovery()')
          },
          fail(error) {
            getApp().setMethodFailedCheckingLog(
              'wx.startBluetoothDevicesDiscovery()',
              `开始发现蓝牙设备失败。error=${JSON.stringify(error)}`,
            )
          },
        })
        //监听发现设备
        wx.onBluetoothDeviceFound((res) => {
          res.devices.forEach((device) => {
            // 品牌名校验
            const brandConfig = app.globalData.brandConfig[app.globalData.brand]
            const localName = device.localName || device.name || ''
            if (!brandConfig.apNameHeader.some((value) => localName.includes(value))) {
              return
            }
            // RSSI为正值的异常情况均舍弃
            if (device.RSSI > 0) {
              console.log('设备蓝牙强度异常', device)
              return
            }
            // 校验设备品牌a806
            if (!self.filterMideaDevice(device)) {
              return
            }
            // 校验是否已匹配成功
            if (self.data.curDeviceISCheck) {
              return
            }
            // 校验设备品类
            const typeAndSn8 = getDeviceCategoryAndSn8(device)
            if (typeAndSn8?.type != type) {
              return
            }
            const deviceParam = this.getDeviceParam(device)
            let ifSN8Matching = this.checkSN8(brandConfig, deviceParam)
            if (!ifSN8Matching) {
              console.log('addDeviceInfo', app.addDeviceInfo)
              if (fm == 'scanCode' && isColmoDeviceByDecodeSn(app.addDeviceInfo.tsn || app.addDeviceInfo.sn)) {
                //不在白名单中，但是从带过来的扫码sn中判断，是colmo的设备
                console.log('从扫码带过来的sn判断是colmo设备')
                console.log('addDeviceInfo', app.addDeviceInfo)
              } else {
                return
              }
            }
            const deviceAds = ab2hex(device.advertisData) // ArrayBuffer转16进度字符串
            // 解析蓝牙功能状态
            const packInfo = getScanRespPackInfo(deviceAds)
            // 过滤已配网设备
            if (packInfo.isConfig || packInfo.isLinkWifi || packInfo.isBindble) {
              return
            }
            if (packInfo.isWifiCheck || packInfo.isBleCheck || packInfo.isCanSet) {
              console.log(
                '@module addGuide.js\n@method checkSetConfig\n@desc 手动确权成功\n',
                device,
                deviceAds,
                packInfo,
              )
              log.info('手动确权成功', device, deviceAds, packInfo)
              self.data.curDeviceISCheck = true
              wx.offBluetoothDeviceFound()
              wx.stopBluetoothDevicesDiscovery({
                fail(error) {
                  getApp().setMethodFailedCheckingLog(
                    'wx.stopBluetoothDevicesDiscovery()',
                    `停止蓝牙发现失败。error=${JSON.stringify(error)}`,
                  )
                },
              })
              app.addDeviceInfo.isFeature = packInfo.isFeature
              app.addDeviceInfo.adData = deviceAds
              app.addDeviceInfo.blueVersion = self.getBleVersion(device.advertisData)
              app.addDeviceInfo.deviceId = device.deviceId
              app.addDeviceInfo.mac = self.getIosMac(device.advertisData)
              app.addDeviceInfo.sn8 = self.getBlueSn8(deviceAds)
              app.addDeviceInfo.ssid = self.getBluetoothSSID(
                deviceAds,
                app.addDeviceInfo.blueVersion,
                typeAndSn8.type,
                device.localName,
              )
              app.addDeviceInfo.isCheck = true
              console.log('@module addGuide.js\n@method checkSetConfig\n@desc 确权成功设备信息\n', app.addDeviceInfo)
              clearInterval(timer)
              wx.navigateTo({
                url: paths.linkDevice,
              })
            } else {
              getApp().setMethodCheckingLog('收到广播包未确权成功', `${deviceAds}`)
            }
          })
        })
      })
      .catch((error) => {
        console.log('打开蓝牙适配器失败', error)
        getApp().setMethodFailedCheckingLog('wx.openAdapter()', `打开蓝牙适配器失败。error=${JSON.stringify(error)}`)
      })
  },
  //请求指引结果埋点
  serverGuideResultBurialPoint(resp) {
    if (resp.data.code == 0) {
      //正常有指引返回
      burialPoint.serverGuideResult({
        deviceSessionId: app.globalData.deviceSessionId,
        moduleType: app.addDeviceInfo.moduleType,
        type: app.addDeviceInfo.type,
        sn8: app.addDeviceInfo.sn8,
        moduleVison: app.addDeviceInfo.blueVersion,
        linkType: app.addDeviceInfo.linkType,
        serverCode: resp.data.code + '',
        serverType: resp.data.data.category,
        serverSn8: resp.data.data.code,
      })
    } else {
      burialPoint.serverGuideResult({
        deviceSessionId: app.globalData.deviceSessionId,
        moduleType: app.addDeviceInfo.moduleType,
        type: app.addDeviceInfo.type,
        sn8: app.addDeviceInfo.sn8,
        moduleVison: app.addDeviceInfo.blueVersion,
        linkType: app.addDeviceInfo.linkType,
        serverCode: resp.data.code + '',
      })
    }
  },
  //自发现来的指引
  getAutoFoundGuide(mode, type, sn8, enterprise = '0000', productId = '', ssid) {
    console.log('productId', productId)
    let reqData = {
      mode: mode + '',
      category: type.includes('0x') ? type.substr(2, 2) : type,
      code: sn8,
      enterpriseCode: enterprise,
      ssid: ssid,
      queryType: 2,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    console.log('自发现请求确权指引', reqData)
    requestService
      .request('multiNetworkGuide', reqData)
      .then((resp) => {
        console.log('自发现获得确权指引', resp)
        if (resp.data.data.mainConnectinfoList.length != 0) {
          this.setData({
            ['checkGuideInfo.connectDesc']: this.guideDescFomat(resp.data.data.mainConnectinfoList[0].connectDesc),
            ['checkGuideInfo.connectUrlA']: resp.data.data.mainConnectinfoList[0].connectUrlA,
          })
          this.getNewDeviceGuideInfoViewTrack(resp.data.data.mainConnectinfoList)
          console.log('配网指引信息', resp.data.data.mainConnectinfoList[0].connectDesc)
        }
        this.serverGuideResultBurialPoint(resp)
      })
      .catch((error) => {
        console.log(error)
        if (error.data.code == 1) {
          this.noGuide()
        }
        this.serverGuideResultBurialPoint(error)
        getApp().setMethodFailedCheckingLog('getAutoFoundGuide', `自发现获取指引异常。error=${JSON.stringify(error)}`)
      })
  },
  //扫码获取指引
  getScanCodeGuide(mode, type, sn8, enterprise = '0000', tsn = '', ssid = '', sn = '') {
    let reqData = {
      sn: sn,
      reqId: getReqId(),
      stamp: getStamp(),
      ssid: ssid,
      enterpriseCode: enterprise,
      category: type.includes('0x') ? type.substr(2, 2) : type,
      code: sn8,
      mode: mode + '',
      tsn: tsn,
      queryType: 2,
    }
    console.log('扫码请求确权指引', reqData)
    log.info('扫码请求确权指引', reqData)
    requestService
      .request('multiNetworkGuide', reqData)
      .then((resp) => {
        if (resp.data.data.mainConnectinfoList.length != 0) {
          this.setData({
            ['checkGuideInfo.connectDesc']: this.guideDescFomat(resp.data.data.mainConnectinfoList[0].connectDesc),
            ['checkGuideInfo.connectUrlA']: resp.data.data.mainConnectinfoList[0].connectUrlA,
          })
          this.getNewDeviceGuideInfoViewTrack(resp.data.data.mainConnectinfoList)
          console.log('配网指引信息 扫码', resp.data.data.mainConnectinfoList[0].connectDesc)
        }
        this.serverGuideResultBurialPoint(resp)
      })
      .catch((error) => {
        console.log(error)
        log.info('扫码获取指引错误', error)
        if (error.data.code == 1) {
          this.noGuide()
        }
        this.serverGuideResultBurialPoint(error)
        getApp().setMethodFailedCheckingLog('getAutoFoundGuide', `自发现获取指引异常。error=${JSON.stringify(error)}`)
      })
  },

  //选型得到的指引
  getSelectTypeGuide(type, sn8, enterprise = '0000', productId) {
    let reqData = {
      code: sn8,
      reqId: getReqId(),
      stamp: getStamp(),
      enterpriseCode: enterprise,
      category: type.includes('0x') ? type.substr(2, 2) : type,
      productId: productId,
      queryType: 1,
    }
    console.log('请求确权指引', reqData)
    log.info('选型请求确权指引', reqData)
    requestService
      .request('multiNetworkGuide', reqData)
      .then((resp) => {
        if (resp.data.data.mainConnectinfoList.length != 0) {
          this.setData({
            ['checkGuideInfo.connectDesc']: this.guideDescFomat(resp.data.data.mainConnectinfoList[0].connectDesc),
            ['checkGuideInfo.connectUrlA']: resp.data.data.mainConnectinfoList[0].connectUrlA,
          })
          this.getNewDeviceGuideInfoViewTrack(resp.data.data.mainConnectinfoList)
          console.log('配网指引信息 选型', resp.data.data.mainConnectinfoList[0].connectDesc)
        }
        this.serverGuideResultBurialPoint(resp)
      })
      .catch((error) => {
        console.log(error)
        log.info('选型获取指引错误', error)
        if (error.data.code == 1) {
          this.noGuide()
        }
        this.serverGuideResultBurialPoint(error)
        getApp().setMethodFailedCheckingLog('getAutoFoundGuide', `自发现获取指引异常。error=${JSON.stringify(error)}`)
      })
  },

  //获取设备图片
  getDeviceImg(type, sn8) {
    let dcpDeviceImgList = app.globalData.dcpDeviceImgList ? app.globalData.dcpDeviceImgList : {}
    if (dcpDeviceImgList[type]) {
      // console.log("找到了这个品类")
      if (dcpDeviceImgList[type][sn8]) {
        // console.log("找到对应的sn8")
        return dcpDeviceImgList[type][sn8]
      } else {
        return dcpDeviceImgList[type].common
      }
    } else {
      console.log('没找到', deviceImgMap)
      if (deviceImgMap[type] && deviceImgMap[type].onlineIcon) {
        return deviceImgApi.url + deviceImgMap[type].onlineIcon + '.png'
      } else {
        return deviceImgApi.url + 'blue_default_type.png'
      }
    }
  },

  async skipNear() {
    const this_ = this
    if (this.clickFlag) return
    this.clickFlag = true
    burialPoint.clickSkipNear({
      deviceSessionId: app.globalData.deviceSessionId,
      blueVersion: app.addDeviceInfo.blueVersion,
      deviceId: app.addDeviceInfo.deviceId,
      linkType: app.addDeviceInfo.linkType,
      sn: app.addDeviceInfo.sn,
      sn8: app.addDeviceInfo.sn8,
      type: app.addDeviceInfo.type,
    })
    wx.offBluetoothDeviceFound()
    wx.stopBluetoothDevicesDiscovery()
    app.addDeviceInfo.isCheck = false
    openAdapter()
      .then(() => {
        clearInterval(timer)
        console.log('跳过清除了定时器')
        wx.navigateTo({
          url: paths.linkDevice,
          complete() {
            this_.clickFLag = false
          },
        })
      })
      .catch(() => {
        this_.clickFlag = false
      })
  },

  getBleVersion(advertisData) {
    let str = ab2hex(advertisData).substr(4, 2)
    return str == '00' ? 1 : 2
  },

  //根据广播包获取mac
  getIosMac(advertisData) {
    advertisData = ab2hex(advertisData)
    console.log('getIosMacm advdata===', advertisData)
    let a = advertisData.substr(42, 12).toUpperCase()
    let b
    let arr = []
    for (let i = 0; i < a.length; i += 2) {
      arr.push(a.substr(i, 2))
    }
    b = arr.reverse().join(':')
    return b
  },
  //多配网指引-浏览埋点
  getNewDeviceGuideInfoViewTrack(guideInfo) {
    if (!guideInfo.connectDescNew || !guideInfo.mainConnectTypeDesc) return
    burialPoint.getNewDeviceGuideInfoViewTrack({
      deviceSessionId: app.globalData.deviceSessionId,
      sn8: app.addDeviceInfo.sn8,
      type: app.addDeviceInfo.type,
      moduleVersion: app.addDeviceInfo.blueVersion,
      linkType: app.addDeviceInfo.linkType,
    })
  },
  //多配网指引-点击埋点
  clickNewDeviceGuideInfoViewTrack() {
    burialPoint.clickNewDeviceGuideInfoViewTrack({
      deviceSessionId: app.globalData.deviceSessionId,
      sn8: app.addDeviceInfo.sn8,
      type: app.addDeviceInfo.type,
      moduleVersion: app.addDeviceInfo.blueVersion,
      linkType: app.addDeviceInfo.linkType,
    })
  },

  //蓝牙配网检查蓝牙是否授权以及是否打开蓝牙
  async checkBluetoothAuth() {
    // let result = true
    // if (addDeviceSDK.bluetoothAuthModes.includes(app.addDeviceInfo.mode)) {
    //   result = await this.checkLocationAndBluetooth(true, false, false, true, app.addDeviceInfo)
    //   if (!result) {
    //     clearInterval(timer)
    //   }
    // }
    // return result
    let blueRes = await checkPermission.blue()
    this.data.guideBlueRes = blueRes
    console.log('[blueRes]', blueRes)
    if (!blueRes.isCanBlue) {
      // 记录当前埋点
      this.objectName = this.setBurialObjectNameValue(blueRes.permissionTypeList)
      burialPoint.bluetoothGuideView({
        name: this.objectName,
        deviceSessionId: app.globalData.deviceSessionId,
        sn8: app.addDeviceInfo.sn8,
        type: app.addDeviceInfo.type,
        moduleVersion: app.addDeviceInfo.blueVersion,
        linkType: app.addDeviceInfo.linkType,
      })
      this.setData({
        ishowBlueRes: true,
        bluePermissionTextAll: blueRes.permissionTextAll,
      })
      // this.setDialogMixinsData(
      //   true,
      //   '请开启蓝牙权限',
      //   blueRes.permissionTextAll,
      //   false,
      //   [
      //     {
      //       btnText: '放弃',
      //       flag: 'bottomBtn',
      //       type: 'cancel',
      //     },
      //     {
      //       btnText: '已完成操作',
      //       flag: 'bottomBtn',
      //       type: 'confirm',
      //       permissionTypeList: blueRes.permissionTypeList,
      //     },
      //   ],
      //   [
      //     {
      //       btnText: '查看详细指引',
      //       flag: 'lookGuide',
      //       type: 'blue',
      //       permissionTypeList: blueRes.permissionTypeList,
      //     },
      //   ]
      // )
      return false
    }
    return true
  },

  closeBlueRes() {
    this.setData({
      ishowBlueRes: false,
    })
  },

  async makeSure(e) {
    this.locationAndBluetoothClickTrack(e.detail.flag) //位置和蓝牙弹窗提示点击埋点
    e = e.detail
    console.log('kkkkkkkkk', e)
    if (e.flag == 'bottomBtn') {
      if (e.type == 'confirm') {
        burialPoint.clickBluetoothFinish({
          name: this.objectName,
          deviceSessionId: app.globalData.deviceSessionId,
          sn8: app.addDeviceInfo.sn8,
          type: app.addDeviceInfo.type,
          moduleVersion: app.addDeviceInfo.blueVersion,
          linkType: app.addDeviceInfo.linkType,
        })
        this.initAddGuide()
      }
      if (e.type == 'cancel') {
        burialPoint.clickBluetoothQuit({
          name: this.objectName,
          deviceSessionId: app.globalData.deviceSessionId,
          sn8: app.addDeviceInfo.sn8,
          type: app.addDeviceInfo.type,
          moduleVersion: app.addDeviceInfo.blueVersion,
          linkType: app.addDeviceInfo.linkType,
        })
        wx.switchTab({
          url: paths.index,
        })
      }
    }
  },
  //查看指引
  clickLink(e) {
    console.log('[clich Link]', e)
    e = e.detail
    if (e.flag == 'lookGuide') {
      if (e.type == 'blue') {
        burialPoint.clickBluetoothGuide({
          name: this.objectName,
          deviceSessionId: app.globalData.deviceSessionId,
          sn8: app.addDeviceInfo.sn8,
          type: app.addDeviceInfo.type,
          moduleVersion: app.addDeviceInfo.blueVersion,
          linkType: app.addDeviceInfo.linkType,
        })
        wx.navigateTo({
          url: paths.blueGuide + `?permissionTypeList=${JSON.stringify(e.permissionTypeList)}`,
        })
      }
    }
  },

  /**
   * 设置蓝牙权限弹窗埋点 object_name 字段
   * @param obj 蓝牙权限校验返回结果对象
   */
  setBurialObjectNameValue(obj) {
    let value = ''
    if (!obj.bluetoothEnabled) {
      value = '开启手机蓝牙'
    }
    if (!obj.bluetoothAuthorized) {
      value = `${value}${value ? '/' : ''}允许微信获取蓝牙权限`
    }
    if (!obj.scopeBluetooth) {
      value = `${value}${value ? '/' : ''}允许小程序使用蓝牙权限`
    }
    return value
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
    getApp().onUnloadCheckingLog()

    console.log('页面返回清除了定时器')
    this.searchBlueStopTimeout && clearTimeout(this.searchBlueStopTimeout)
    wx.offBluetoothDeviceFound()
    wx.stopBluetoothDevicesDiscovery()
    clearInterval(timer)
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('下拉刷新======')
    let { mode, guideInfo, fm } = app.addDeviceInfo
    let needRefreshMode = [0, 9, 10, 100]
    if (needRefreshMode.includes(Number(mode))) {
      this.setData({
        ['checkGuideInfo.connectDesc']: '',
        ['checkGuideInfo.connectUrlA']: '',
      })
      setTimeout(() => {
        this.getGuideFormat(guideInfo, fm)
      }, 1000)
      console.log('getGuideFormat========')
    }
    wx.stopPullDownRefresh()
  },

  goHome() {
    if (this.data.brand != 'colmo') {
      wx.switchTab({
        url: paths.index,
      })
    } else {
      wx.navigateTo({
        url: paths.index,
      })
    }
  },

  hasFinish() {
    burialPoint.clickBluetoothFinish({
      name: this.objectName,
      deviceSessionId: app.globalData.deviceSessionId,
      sn8: app.addDeviceInfo.sn8,
      type: app.addDeviceInfo.type,
      moduleVersion: app.addDeviceInfo.blueVersion,
      linkType: app.addDeviceInfo.linkType,
    })
    this.initAddGuide()
  },

  async checkGuide() {
    if (this.data.guideFlag) return
    this.data.guideFlag = true
    // let blueRes = await checkPermission.blue()
    let blueRes = this.data.guideBlueRes
    log.info('蓝牙权限弹窗', blueRes)
    wx.navigateTo({
      url: paths.blueGuide + `?permissionTypeList=${JSON.stringify(blueRes.permissionTypeList)}`,
    })
    setTimeout(() => {
      this.data.guideFlag = false
    }, 1000)
    // this.setData({
    //   ishowBlueRes:false
    // })
  },

  iseeBtn() {
    if (!this.data.isFinishUpAp) {
      showToast('请先勾选')
      return
    }
    wx.reLaunch({
      url: paths.index,
    })
    burialPoint.addGuideGoToHome({
      deviceSessionId: app.globalData.deviceSessionId,
      blueVersion: app.addDeviceInfo.blueVersion,
      deviceId: app.addDeviceInfo.deviceId,
      linkType: app.addDeviceInfo.linkType,
      sn: app.addDeviceInfo.sn,
      sn8: app.addDeviceInfo.sn8,
      type: app.addDeviceInfo.type,
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},
})
