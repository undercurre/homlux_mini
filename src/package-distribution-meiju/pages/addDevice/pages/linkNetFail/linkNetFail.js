/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
const app = getApp()
const addDeviceMixin = require('../assets/js/addDeviceMixin')
const netWordMixin = require('../../../assets/js/netWordMixin')
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
import { string2Uint8Array, isEmptyObject } from 'm-utilsdk/index'
import { showToast } from '../../../../utils/util'
import paths from '../../../../utils/paths'
import { environment, commonH5Api } from '../../../../common/js/api'
import { decodeWifi } from '../../../assets/js/utils'
import computedBehavior from '../../../../utils/miniprogram-computed.js'
import { addDeviceSDK } from '../../../../utils/addDeviceSDK.js'
import { setWifiStorage } from '../../utils/wifiStorage'

import WifiMgr from '../assets/js/wifiMgr'

const brandStyle = require('../../../assets/js/brand.js')
let wifiMgr = new WifiMgr()
Page({
  behaviors: [addDeviceMixin, netWordMixin, getFamilyPermissionMixin, computedBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    deviceName: '',
    isCanSeePsw: true,
    pswInputType: false,
    bindWifiInfo: {
      BSSID: '',
      EncryptType: '',
      SSIDLength: '',
      PswLength: '',
      SSIDContent: '',
      PswContent: '',
      randomCode: '',
      chain: '',
      signalStrength: '',
      frequency: '',
    },
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    mode: Number,
    backTo: '',
    isSwitchWifi: false, //是否切换wifi
    buttomButonData: {},
    testNetDialog: {}, //测试网络弹窗内容
    isDeviceLinkCloud: false, //设备是否连上云
    failUiData: {}, //对应错误页面显示文案数据
    customDialog: {},
    canPingWifiNum: 3, //有结果三次
    isStopTestWifiNet: false, //是否停止测试当前wifi
    isClickTestNet: false,
    plainSn: '', //原始sn
    pageStatus: 'show', //页面状态
    isSupport5G: false, //是否支持5gwifi
    spaceTip: '', //输入的wifi密码包含空格提示
    tempPsw: '', //暂存密码用于密码限制输入判断
    continueConnectWifi: false, //是否手动输入连wifi  false:不是手动输入，true是手动输入
    brand: '',
    dialogStyle: brandStyle.brandConfig.dialogStyle, //弹窗样式
    brandConfig: brandStyle.brandConfig,
    isClickConfirm: false, //弹窗防重
    deviceImgLoaded: false,
    combinedStatus: -1, // 组合设备的组合状态
    deviceInfo: {},
  },

  computed: {
    //当前连接wifi提示
    tipText() {
      // return `这个可能是一个5GHz WiFi，可能无法连接，请切换至2.4GHz WiFi`
      let { bindWifiInfo, isSupport5G } = this.data
      if (bindWifiInfo && bindWifiInfo.frequency && bindWifiInfo.frequency > 5000) {
        return '该WiFi可能为5GHz WiFi，设备无法连接，请切换其他WiFi'
      }
      if (
        bindWifiInfo &&
        bindWifiInfo.SSIDContent &&
        addDeviceSDK.bySSIDCheckIs5g(bindWifiInfo.SSIDContent) &&
        !isSupport5G
      ) {
        return '该WiFi可能为5GHz WiFi，设备无法连接，请切换其他WiFi'
      }
      if (addDeviceSDK.isDeviceAp(bindWifiInfo.SSIDContent.toLocaleLowerCase())) {
        return '暂不支持使用智能设备网络'
      }
      return ''
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad() {
    this.data.brand = brandStyle.brand
    this.data.combinedStatus = app.combinedDeviceInfo ? app.combinedDeviceInfo[0].combinedStatus : ''
    this.setData({
      brand: this.data.brand,
      combinedStatus: this.data.combinedStatus,
      dms_img_lack: `../assets/img/dms_img_lack_${this.data.brand}@3x.png`,
      meiPhone: `../assets/img/ic_meiphone_${this.data.brand}@1x.png`,
      // meiPhone:imgUrl+ imgesList['meiPhone'],
      zhuyi: `../assets/img/link_ic_zhuyi_${this.data.brand}.png`,
      wifiShow: '../assets/img/WiFi_ic_kejian.png',
      wifiHide: '../assets/img/wifi_ic_bukejian.png',
    })
    let {
      deviceName,
      deviceImg,
      isDeviceLinkCloud,
      errorCode,
      apUtils,
      plainSn,
      type,
      sn8,
      blueVersion,
      mode,
      moduleVersion,
      linkType,
      curWifiInfo,
      guideInfo,
      continueConnectWifi,
    } = app.addDeviceInfo
    // 组合设备新增逻辑
    let deviceInfo
    const { combinedStatus } = app.combinedDeviceInfo[0]
    if (combinedStatus > -1) {
      deviceInfo = app.combinedDeviceInfo[0]
      console.log('---设备信息从combinedDeviceInfo获取---', deviceInfo)
      this.setData({
        combinedStatus: combinedStatus,
        deviceName: deviceInfo.deviceName,
        deviceImg: deviceInfo.deviceImg,
        isDeviceLinkCloud: false,
        plainSn: deviceInfo.plainSn,
        isSupport5G: false,
      })
    } else {
      deviceInfo = app.addDeviceInfo
      console.log('---设备信息从app.addDeviceInfo获取---', deviceInfo)
      this.setData({
        deviceName: deviceName,
        deviceImg: deviceImg,
        isDeviceLinkCloud: isDeviceLinkCloud,
        plainSn: plainSn,
        isSupport5G: (guideInfo && guideInfo.wifiFrequencyBand) == 2 ? true : false,
        continueConnectWifi: continueConnectWifi,
      })
    }
    this.data.deviceInfo = deviceInfo
    this.drawButtomButton(errorCode) //绘制底部按钮
    this.getErrorGuideDesc(errorCode) //获取错误文案
    console.log('failUiData====', this.data.failUiData)
    if (apUtils == undefined || isEmptyObject(apUtils)) {
      this.apUtils = await require.async('../../../assets/asyncSubpackages/apUtils.js') //分包异步加载
    } else {
      this.apUtils = apUtils
    }
    this.setData({
      mode: mode,
    })
    //统一读取wifi缓存信息
    if (curWifiInfo) {
      console.log('读取缓存：', curWifiInfo)
      this.setData({
        bindWifiInfo: curWifiInfo,
      })
    }
  },
  //展示对应错误文案
  getErrorGuideDesc(errorCode) {
    let system = wx.getSystemInfoSync().system
    let failUiData
    if (errorCode && this.data.failTextData[errorCode]) {
      failUiData = this.data.failTextData[errorCode]
    } else {
      failUiData = this.data.failTextData['common']
    }
    if (system.includes('Android')) {
      failUiData.guideDesc = failUiData.guideDesc.filter((item) => {
        return !item.includes('仅iOS展示')
      })
    }
    this.setData({
      failUiData,
    })
  },

  drawButtomButton(errorCode) {
    let { mode } = app.addDeviceInfo
    let self = this
    let comfirmText = '重试'
    let cancelText = '返回首页'
    if (this.drawBtnClickFlag) return
    this.drawBtnClickFlag = true
    const { type, sn, sn8 } = this.data.deviceInfo
    let a0 = ''
    if (this.data.deviceInfo.a0) a0 = this.data.deviceInfo.a0
    const burialPointParams = {
      deviceSessionId: app.globalData.deviceSessionId || '',
      type: type,
      sn8: sn8,
      sn: sn,
      a0: a0,
      moduleVersion: app.addDeviceInfo.moduleVersion || '',
      linkType: app.addDeviceInfo.linkType || 'bluetooth',
    }
    if (errorCode == 1501) {
      comfirmText = ''
    }
    if (mode == 31) {
      //msmart 直连后配网
      cancelText = '直接控制设备'
    }
    // 组合配网隐藏取消按钮
    if (this.data.combinedStatus > -1) {
      cancelText = ''
      comfirmText = errorCode == 3001 ? '重新联网' : '重新绑定'
    }
    this.setData({
      //底部按钮
      buttomButonData: {
        show: true,
        title: '',
        content: '',
        cancelText: cancelText,
        cancelColor: '#267AFF',
        comfirmText: comfirmText,
        comfirmColor: '#267AFF',
        success: function async(res) {
          console.log('click buttomButon res', res)
          if (res.confirm) {
            if (self.data.isClickConfirm) {
              return
            }
            self.data.isClickConfirm = true
            console.log('this.data.isClickConfirm:', self.data.isClickConfirm)
            app
              .checkNet()
              .then(() => {
                //如果是ap自发现配网失败点击重试跳设备发现页
                let { fmType, combinedDeviceFlag } = app.addDeviceInfo
                if (fmType && fmType == 'ap' && !combinedDeviceFlag) {
                  //组合设备不走该路径
                  setWifiStorage(self.data.bindWifiInfo) //保存本次失败页的wifi账号密码到wifi缓存里，到wifi登记页再取出显示
                  wx.reLaunch({
                    url: paths.scanDevice,
                    complete() {
                      self.drawBtnClickFlag = false
                    },
                  })
                } else {
                  console.log('代码走到了校验当前网络是否畅通------' + errorCode)
                  if (errorCode == 3001 || errorCode == 3002) {
                    //组合配网重试
                    app.addDeviceInfo.errorCode = '' //重置
                    wx.reLaunch({
                      url: paths.linkCombinedDevice,
                      complete() {
                        self.drawBtnClickFlag = false
                      },
                    })
                  } else if (errorCode == 4200) {
                    //二次配网重试
                    app.addDeviceInfo.errorCode = '' //重置
                    wx.reLaunch({
                      url: paths.addGuide,
                      complete() {
                        self.drawBtnClickFlag = false
                      },
                    })
                  } else {
                    self.drawBtnClickFlag = false
                    self.retry()
                  }
                }
              })
              .catch(() => {
                self.data.isClickConfirm = false
                wx.showModal({
                  content: '当前手机无网络，请将手机连至家庭wifi，或切换至4G',
                  showCancel: false,
                  confirmText: '好的',
                  success: function (res) {
                    if (res.confirm) {
                      if (errorCode == 4200) {
                        //二次配网重试
                        app.addDeviceInfo.errorCode = '' //重置
                        wx.reLaunch({
                          url: paths.addGuide,
                        })
                      } else {
                        self.retry()
                      }
                    }
                  },
                })
              })
          } else if (res.cancel) {
            app
              .checkNet()
              .then(() => {
                self.drawBtnClickFlag = false
                //校验当前网络是否畅通
                if (mode == 31) {
                  self.goToBlueConctrol()
                } else {
                  self.backToIndex()
                }
              })
              .catch(() => {
                self.data.isClickConfirm = false
                wx.showModal({
                  content: '当前手机无网络，请将手机连至家庭wifi，或切换至4G',
                  showCancel: false,
                  confirmText: '好的',
                  success: function (res) {
                    if (res.confirm) {
                      if (mode == 31) {
                        self.goToBlueConctrol()
                      } else {
                        self.backToIndex()
                      }
                    }
                  },
                })
              })
          }
        },
      },
    })
  },

  //点击了切换wifi
  clickSwitchWifi() {
    this.switchWifi()
    this.data.isSwitchWifi = true
    this.getSwitchWifiInfo()
  },

  //获取切换wifi信息
  async getSwitchWifiInfo() {
    let { SSIDContent } = this.data.bindWifiInfo
    try {
      let wifiInfo = await wifiMgr.getConnectedWifi()
      if (wifiInfo.SSID == SSIDContent) {
        //还是之前连接的wifi
        console.log('[还是同一个wifi]')
        if (this.data.pageStatus == 'show') {
          setTimeout(() => {
            this.getSwitchWifiInfo()
          }, 1500)
        }
        return
      }
      this.getCurLinkWifiInfo(wifiInfo)
    } catch (error) {
      console.log('[get connected wifi fail]', error)
      if (this.data.pageStatus == 'show') {
        this.delay(1500).then(() => {
          this.getSwitchWifiInfo()
        })
      }
    }
  },

  //监听wifi切换
  onSwitchWifi() {
    let self = this
    wx.startWifi({
      success: () => {
        console.log('开始监听wifi切换')
        wx.onWifiConnected((res) => {
          //监听连上对应wifi
          console.log('连上wifi了：', res, self.data.bindWifiInfo.BSSID)
          if (self.data.isSwitchWifi && res.wifi && res.wifi.SSID && !res.wifi.SSID.includes('unknown ssid')) {
            console.log('更新切换的wifi')
            self.getCurLinkWifiInfo(res.wifi)
          }

          let wifiInfo = res.wifi
          if (
            this.data.isClickTestNet &&
            !self.data.isStopTestWifiNet &&
            wifiInfo.BSSID == self.data.bindWifiInfo.BSSID
          ) {
            //未停止测试当前网络
            console.log('自动测试当前网络')
            self.pingMideaNet()
          }
        })
      },
      fail(err) {
        console.error('初始化wifi失败', err)
        if (err.errCode == '12006') {
          wx.showToast({
            title: '您未打开位置定位开关',
            icon: 'none',
          })
        }
      },
    })
  },

  //自动测试当前网络
  async autoPingCurWifi() {
    let self = this
    wx.startWifi({
      success() {
        wx.onWifiConnected((res) => {
          //监听连上对应wifi
          console.log('连上wifi了：', res, self.data.bindWifiInfo.SSID)
          let wifiInfo = res.wifi
          if (wifiInfo.SSID == self.data.bindWifiInfo.SSIDContent) {
            self.pingMideaNet()
            wx.offWifiConnected()
          }
        })
      },
      fail(error) {
        console.log('初始化wifi失败', error)
      },
    })

    let wifiInfo = await wifiMgr.getConnectedWifi()
    console.log('是wifi状态', wifiInfo, this.data.bindWifiInfo.SSID)
    if (wifiInfo.SSID == this.data.bindWifiInfo.SSIDContent) {
      self.pingMideaNet()
    }
  },

  //点击测试一下
  async clickTestNet() {
    let self = this
    let { moduleType, type, sn8, sn, linkType, moduleVersion } = app.addDeviceInfo
    this.data.isClickTestNet = true
    this.data.isStopTestWifiNet = false //重置
    try {
      let wifiInfo = await wifiMgr.getConnectedWifi()
      console.log('是wifi状态', wifiInfo, this.data.bindWifiInfo.SSID)
      if (wifiInfo.SSID == this.data.bindWifiInfo.SSIDContent) {
        self.pingMideaNet()
      } else {
        this.setData({
          //请连接对应wifi弹窗
          customDialog: {
            show: true,
            title: '',
            content: `请连接到“${this.data.bindWifiInfo.SSIDContent}”，再进行测试`,
            cancelText: '取消',
            cancelColor: '#267AFF',
            confirmText: '去设置',
            confirmColor: '#267AFF',
            success(res) {
              console.log('page dialog res', res)
              if (res.comfirm) {
                console.log('page dialog res2222', res)
                self.switchWifi()
              }
            },
          },
        })
      }
    } catch (error) {
      let networkType = await this.nowNetType()
      if (networkType == 'wifi') {
        this.setData({
          //请连接对应wifi弹窗
          customDialog: {
            show: true,
            title: '',
            content: `请连接到“${this.data.bindWifiInfo.SSIDContent}”，再进行测试`,
            cancelText: '取消',
            cancelColor: '#267AFF',
            confirmText: '去设置',
            confirmColor: '#267AFF',
            success(res) {
              console.log('page dialog res', res)
              if (res.comfirm) {
                console.log('page dialog res2222', res)
                self.switchWifi()
              }
            },
          },
        })
      } else {
        console.log('未打开wifi开关')
        this.setData({
          //请打开wifi
          customDialog: {
            show: true,
            title: '',
            content: `请开启WLAN，并连接到“${this.data.bindWifiInfo.SSIDContent}”`,
            cancelText: '取消',
            cancelColor: '#267AFF',
            confirmText: '去设置',
            confirmColor: '#267AFF',
            success(res) {
              console.log('page dialog res', res)
              if (res.comfirm) {
                self.switchWifi()
              }
            },
          },
        })
      }
    }
  },

  //ping 相关网络
  async pingMideaNet() {
    let self = this
    let { moduleType, type, sn8, sn, linkType, moduleVersion } = app.addDeviceInfo
    this.setData({
      //测试网络弹窗
      testNetDialog: {
        show: true,
        title: '',
        content: '测试中',
        showCancel: true,
        contentImg: './assets/img/loaidng_gray.gif',
        cancelText: '取消',
        cancelColor: '#267AFF',
        success(res) {
          console.log('click drawTestNetDialog res', res)
          if (res.cancel) {
            self.data.isStopTestWifiNet = true
          }
        },
      },
    })

    //调整用接口来测试网络情况
    try {
      console.log('开始测试网络')
    } catch (error) {
      console.log('测试 wifi 网络结果', error)
      if (this.data.isStopTestWifiNet) return
      if (error.data && error.data.code) {
        //有响应 网络正常
        this.setData({
          //测试网络弹窗
          testNetDialog: {
            show: true,
            title: '',
            content: '网络通畅',
            showCancel: false,
            contentImg: './assets/img/test_img_success@2x.png',
            confirmText: '我知道了',
            confirmColor: '#267AFF',
            success(res) {
              console.log('click drawTestNetDialog res', res)
              if (res.comfirm) {
                self.data.isStopTestWifiNet = true
              }
            },
          },
        })
      }
      if (error.errMsg && error.errMsg.includes('request:fail')) {
        //请求超时 网络异常
        this.setData({
          //测试网络弹窗
          testNetDialog: {
            show: true,
            title: '',
            content: '网络连接异常\n请更换WiFi后再试',
            showCancel: false,
            contentImg: './assets/img/test_img_fail@2x.png',
            confirmText: '我知道了',
            confirmColor: '#267AFF',
            success(res) {
              console.log('click drawTestNetDialog res', res)
              if (res.comfirm) {
                self.data.isStopTestWifiNet = true
              }
            },
          },
        })
      }
    }
    // let wifiPingTaskIot1 = this.wifiPingtask({
    //     domain: "iot1.midea.com.cn",
    //     port: 28870,
    //     timeOut: 4,
    // })
    // let wifiPingTaskIot2 = this.wifiPingtask({
    //     domain: "iot1.midea.com.cn",
    //     port: 28443,
    //     timeOut: 4,
    // })

    // let wifiPingTaskIot3 = this.wifiPingtask({
    //     domain: masDomain[environment],
    //     port: 80,
    //     timeOut: 4,
    // })
    // Promise.all([wifiPingTaskIot1, wifiPingTaskIot2, wifiPingTaskIot3]).then(res => {
    //     console.log('midea net normal', res)
    //     this.data.canPingWifiNum = this.data.canPingWifiNum - 1
    //     this.setData({ //测试网络弹窗
    //         testNetDialog: {
    //             show: true,
    //             title: '',
    //             content: '网络通畅',
    //             showCancel: false,
    //             contentImg: './assets/img/test_img_success@2x.png',
    //             confirmText: '我知道了',
    //             confirmColor: '#267AFF',
    //             success(res) {
    //                 console.log('click drawTestNetDialog res', res)
    //                 if (res.confirm) {}
    //             }
    //         }
    //     })
    // }).catch(error => {
    //     console.log('midea net error', error)
    //     this.data.canPingWifiNum = this.data.canPingWifiNum - 1
    //     this.setData({ //测试网络弹窗
    //         testNetDialog: {
    //             show: true,
    //             title: '',
    //             content: '网络连接异常,请更换WiFi后再试',
    //             showCancel: false,
    //             contentImg: './assets/img/test_img_fail@2x.png',
    //             confirmText: '我知道了',
    //             confirmColor: '#267AFF',
    //             success(res) {
    //                 console.log('click drawTestNetDialog res', res)
    //                 if (res.confirm) {}
    //             }
    //         }
    //     })
    // })
  },

  /**
   * ping 域名
   * @param {
   *  domain 域名，
   *  port   端口，
   *  timeOut 超时时长 单位：秒
   * }
   *
   *@return {result}
   */
  wifiPingtask({ domain, port, timeOut }) {
    return new Promise((reslove, reject) => {
      let tcp = wx.createTCPSocket()
      tcp.connect({
        address: domain,
        port: port,
      })
      tcp.onConnect((succ) => {
        console.log(`ping ${domain}${port} success`, succ)
        reslove({
          isSuccess: true,
        })
      })
      tcp.onError((error) => {
        //监听tcp错误
        console.log(`ping ${domain}${port} error`, error)
        reject(error)
      })
      setTimeout(() => {
        tcp.close()
      }, timeOut * 1000)
    })
  },

  switchPswShow() {
    this.setData({
      isCanSeePsw: !this.data.isCanSeePsw,
      pswInputType: !this.data.pswInputType,
    })
  },
  getPsw(e) {
    let psw = e.detail.value
    //判断输入的wifi密码是否包含空格，并显示对应的提示
    if (/\s+/g.test(psw)) {
      this.setData({
        spaceTip: '输入的密码包含空格，请确认是否输入准确',
      })
    } else {
      this.setData({
        spaceTip: '',
      })
    }
    //中文,中文符号,表情校验
    let reg = /^[0-9a-zA-Z{}#%*+=_|~<>€£¥·•.,?!'-/:;()$&@"^\\[\]]+$/
    let deal = psw.replace(/\s/g, '').replaceAll('…', '...') //ios手机 连续输入三个...会转为…符号，将…装为...
    if (deal != '' && !reg.test(deal)) {
      let checkRes =
        // eslint-disable-next-line no-misleading-character-class
        /[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF][\u200D|\uFE0F]|[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[0-9|*|#]\uFE0F\u20E3|[0-9|#]\u20E3|[\u203C-\u3299]\uFE0F\u200D|[\u203C-\u3299]\uFE0F|[\u2122-\u2B55]|\u303D|[A9|AE]\u3030|\uA9|\uAE|\u3030/gi.test(
          psw,
        )
      if (/[\u4e00-\u9fa5]/gi.test(psw)) {
        showToast('密码不支持输入汉字')
      } else if (checkRes) {
        showToast('密码不支持输入表情')
        this.setData({
          spaceTip: ' ',
        })
      } else {
        showToast('密码不支持中文符号，请切换到英文键盘输入')
      }
      this.setData({
        'bindWifiInfo.PswContent': this.data.tempPsw,
        'bindWifiInfo.PswLength': string2Uint8Array(this.data.tempPsw).length, //psw.length,
      })
    } else {
      if (psw.includes('…')) {
        psw = psw.replaceAll('…', '...')
      }
      this.setData({
        tempPsw: psw,
        'bindWifiInfo.PswContent': psw,
        'bindWifiInfo.PswLength': string2Uint8Array(psw).length, //psw.length,
      })
    }
    app.addDeviceInfo.curWifiInfo = this.data.bindWifiInfo //共享选取的wifi
    console.log('输入的WiFi密码', this.data.bindWifiInfo)
    if (e.detail.value.length != this.data.bindWifiInfo.PswContent.length) {
      return {
        value: this.data.bindWifiInfo.PswContent,
        cursor: e.detail.cursor - (e.detail.value.length - this.data.bindWifiInfo.PswContent.length),
      }
    } else {
      return {
        value: this.data.bindWifiInfo.PswContent,
        cursor: e.detail.cursor,
      }
    }
  },
  retry() {
    let { moduleType, type, sn8, blueVersion, moduleVersion, mode, fm, linkType, guideInfo, hadChangeBlue } =
      app.addDeviceInfo
    setWifiStorage(this.data.bindWifiInfo)
    app.addDeviceInfo.curWifiInfo = this.data.bindWifiInfo //共享选取的wifi
    console.log('---------------retry--------------------')
    console.log('this.data.bindWifiInfo:', this.data.bindWifiInfo)
    console.log('mode:', mode)
    console.log('fm:', fm)
    console.log('---------------retry end--------------------')
    if (mode == 3 && hadChangeBlue) {
      // AP转换蓝牙配网，重试时转回AP配网
      app.addDeviceInfo.mode = 0
      app.addDeviceInfo.linkType = addDeviceSDK.getLinkType(0)
    }
    if (mode == 0) {
      // const eventChannel = this.getOpenerEventChannel();
      if (fm == 'autoFound') {
        wx.reLaunch({
          url: paths.scanDevice,
        })
      } else {
        if (app.addDeviceInfo.enterSn8) {
          app.addDeviceInfo.sn8 = app.addDeviceInfo.enterSn8 //还原入口选取的sn8
        }
        wx.reLaunch({
          url: paths.addGuide,
        })
      }
      return
    }
    if (mode == 3) {
      if (fm == 'bluePugin') {
        wx.navigateTo({
          url: paths.linkDevice,
        })
        return
      }
      // 有指引跳转配网指引页 无指引跳转添加设备页
      if (guideInfo) {
        wx.reLaunch({
          url: paths.addGuide,
        })
      } else {
        wx.reLaunch({
          url: paths.scanDevice,
        })
      }
      return
    }
    if (mode == 100) {
      if (guideInfo) {
        wx.reLaunch({
          url: paths.addGuide,
        })
      } else {
        wx.reLaunch({
          url: paths.scanDevice + '?openScan=true',
        })
      }
      return
    }
    wx.navigateTo({
      url: paths.linkDevice,
    })
  },
  /**
   * 点击左上角按钮
   */
  async clickBack() {
    let { mode } = app.addDeviceInfo
    const this_ = this
    if (this.backClickFlag) return
    this.backClickFlag = true
    try {
      if (this.data.combinedStatus > -1) {
        wx.navigateBack({
          delta: 1,
          complete() {
            this_.backClickFlag = false
          },
        })
      } else {
        await app.checkNet() //校验当前网络是否畅通
        wx.reLaunch({
          url: paths.index,
          complete() {
            this_.backClickFlag = false
          },
        })
      }
      if (mode == 21) {
        app.addDeviceInfo.mode = '' //置空模式
      }
      this_.backClickFlag = false
    } catch (error) {
      showToast('当前无网，请将手机连上网络')
      setTimeout(() => {
        wx.reLaunch({
          url: paths.index,
          complete() {
            this_.backClickFlag = false
          },
        })
        if (mode == 21) {
          app.addDeviceInfo.mode = '' //置空模式
        }
        this_.backClickFlag = false
      }, 3000)
    }
  },

  //获取当前连接wifi的信息 onshow
  getCurLinkWifiInfo(wifiInfo) {
    let that = this
    let res = wifiInfo
    //获取当前连接wifi信息
    console.log('获取当前连接wifi信息', res)
    console.log('storageWifiListV1======', wx.getStorageSync('storageWifiListV1'))
    if (wx.getStorageSync('storageWifiListV1') && decodeWifi(wx.getStorageSync('storageWifiListV1')[environment])) {
      wx.getStorageSync('storageWifiListV1')
      let storageWifiList = decodeWifi(wx.getStorageSync('storageWifiListV1')[environment])
      console.log('uuuuuuuuuuuuuuu', storageWifiList, res.SSID)
      if (Array.isArray(storageWifiList)) {
        let isHasPsw = false
        let wifiNum = null
        storageWifiList.forEach((item, index) => {
          if (item.SSIDContent == res.SSID) {
            console.log('有这个wifi的storage')
            isHasPsw = true
            wifiNum = index
          }
        })
        if (isHasPsw) {
          //有这个wifi的storage
          that.setData({
            bindWifiInfo: storageWifiList[wifiNum],
            tempPsw: storageWifiList[wifiNum].PswContent,
          })
          app.addDeviceInfo.curWifiInfo = storageWifiList[wifiNum] //共享选取的wifi
        } else {
          that.setData({
            'bindWifiInfo.PswContent': '', //移除密码
          })
          //赋值wifi显示
          that.initBindWifiTest(
            res.BSSID,
            res.SSID,
            res.SSID.length,
            '01',
            '12',
            res.signalStrength,
            res.frequency || '',
          )
        }
      } else {
        //wifi 缓存异常
        wx.removeStorageSync('storageWifiListV1')
        that.initBindWifiTest(res.BSSID, res.SSID, res.SSID.length, '01', '12', res.signalStrength, res.frequency)
      }
    } else {
      //没有wifi storage 直接取当前连接的wifi
      that.initBindWifiTest(res.BSSID, res.SSID, res.SSID.length, '01', '12', res.signalStrength, res.frequency || '')
    }
    that.data.isGetCurLinkWifiInfo = true
    that.setData({
      netType: 1, //连接了wifi
    })
    // wifiMgr.getConnectedWifi().then((res) => {

    // }).catch((err) => {
    //     showToast('请连接wifi')
    //     if (err.errCode == "12005" || err.errCode == '12010') {
    //         that.setData({
    //             wifiInputPlaceholder: '未获取到家庭WiFi',
    //             wifiInputRightText: '重新获取'
    //         })
    //     } else if (err.errCode == "12006") {
    //         wx.showToast({
    //             title: '您未打开位置定位开关',
    //             icon: 'none'
    //         })
    //     }
    //     console.log("getConnectedWifi", err)
    //     log.info('getConnectedWifi error', error)
    // })
  },

  initBindWifiTest(BSSID, SSIDContent, SSIDLength, EncryptType, chain, signalStrength, frequency) {
    SSIDLength = string2Uint8Array(SSIDContent).length
    this.setData({
      'bindWifiInfo.BSSID': BSSID,
      'bindWifiInfo.SSIDContent': SSIDContent,
      'bindWifiInfo.SSIDLength': SSIDLength,
      'bindWifiInfo.EncryptType': EncryptType,
      'bindWifiInfo.chain': chain,
      'bindWifiInfo.signalStrength': signalStrength, //Wi-Fi 信号强度, 安卓取值 0 ～ 100 ，iOS 取值 0 ～ 1 ，值越大强度越大
      'bindWifiInfo.frequency': frequency, //Wi-Fi 频段单位 MHz
    })
    app.addDeviceInfo.curWifiInfo = this.data.bindWifiInfo
  },

  //msmart 去直连插件
  goToBlueConctrol() {
    let { type, deviceId, cloudBackDeviceInfo } = app.addDeviceInfo
    wx.closeBLEConnection({
      deviceId: deviceId,
    })
    let type0x = type.includes('0x') ? type : '0x' + type
    let deviceInfo = encodeURIComponent(JSON.stringify(cloudBackDeviceInfo))
    wx.reLaunch({
      url: `/plugin/T${type0x}/index/index?backTo=/pages/index/index&deviceInfo=${deviceInfo}`,
    })
  },

  clickJumpH5(e) {
    let { moduleType, type, sn8, sn, linkType, moduleVersion } = app.addDeviceInfo
    let params = {
      deviceSessionId: app.globalData.deviceSessionId,
      moduleType: moduleType,
      type: type,
      sn8: sn8,
      sn: sn,
      linkType: linkType,
      moduleVersion: moduleVersion,
    }
    const text = e.target.dataset.text
    let url
    let title
    if (text.indexOf('本地网络') != -1) {
      let permissionTypeList = { localNet: false } //本地网络未开
      wx.navigateTo({
        url: paths.localNetGuide + `?permissionTypeList=${JSON.stringify(permissionTypeList)}`,
      })
      return
    } else if (text.indexOf('Mac地址') != -1) {
      url = `${commonH5Api.url}macGuide.html`
      // title = '操作指引'
      title = ''
    } else if (text.indexOf('DHCP') != -1) {
      url = `${commonH5Api.url}dhcpGuide.html`
      // title = '操作指引'
      title = ''
    } else if (text.indexOf('qmark') != -1) {
      url = `${commonH5Api.url}problem.html`
      title = '常见问题'
    }
    console.log('url:', url)
    console.log('title:', title)
    if (this.data.brand !== 'colmo') {
      wx.navigateTo({
        url: `${paths.webView}?webViewUrl=${encodeURIComponent(url)}&pageTitle=${title}`,
      })
    } else {
      wx.navigateTo({
        url: `/pages/webview/webview?webviewUrl=${encodeURIComponent(url)}&pageTitle=${title}`,
      })
    }
  },

  inputSSIDContent(e) {
    // console.log(e)
    let SSIDContent = e.detail.value
    this.setData({
      'bindWifiTest.SSIDContent': SSIDContent,
    })
    let BSSID = '00:00:00:00:00:00'
    let that = this
    let storageWifiListV1 = wx.getStorageSync('storageWifiListV1')
    console.log('storageWifiListV1:', storageWifiListV1)
    if (storageWifiListV1 && storageWifiListV1[environment].length && decodeWifi(storageWifiListV1[environment])) {
      console.log('有对应环境的缓存wifi信息')
      let storageWifiList = decodeWifi(wx.getStorageSync('storageWifiListV1')[environment])

      let isHasPsw = false
      let wifiNum = null
      storageWifiList.forEach((item, index) => {
        if (item.SSIDContent == SSIDContent) {
          console.log('手动输入有这个wifi的storage')
          isHasPsw = true
          wifiNum = index
        }
      })
      if (isHasPsw) {
        //有这个wifi的storage
        that.setData({
          bindWifiInfo: storageWifiList[wifiNum],
        })
      } else {
        that.setData({
          'bindWifiTest.PswContent': '', //移除密码
        })

        //赋值wifi显示
        that.initBindWifiTest(BSSID, SSIDContent, SSIDContent, '01', '12', '', '')
      }
    } else {
      //没有wifi缓存
      console.log('没有对应环境的缓存wifi信息')
      that.initBindWifiTest(BSSID, SSIDContent, SSIDContent, '01', '12', '', '')
    }
  },

  /**
   * 设备图片加载成功
   */
  devivceImgSuccess(e) {
    console.log('@module linkNetFail.js\n@method devivceImgSuccess\n@desc 联网失败页设备图片加载成功\n', e)
    this.setData({
      deviceImgLoaded: true,
    })
  },

  /**
   * 设备图片加载失败
   */
  deviceImgError(e) {
    console.error('@module linkNetFail.js\n@method deviceImgError\n@desc  联网失败页设备图片加载失败\n', e)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (this.data.isSwitchWifi) {
      this.getSwitchWifiInfo()
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.setData({
      ['customDialog.show']: false,
    })
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
})
