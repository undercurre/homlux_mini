/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
import pageBehaviors from '../../../../../behaviors/pageBehaviors'
import { imgList } from '../../../../../config/img'

const addDeviceMixin = require('../assets/js/addDeviceMixin')
const checkAuthMixin = require('../../mixins/checkAuthMixin')
const netWordMixin = require('../../../assets/js/netWordMixin')
const paths = require('../../../../utils/paths')
const bluetooth = require('../../../../common/mixins/bluetooth.js')
import computedBehavior from '../../../../utils/miniprogram-computed.js'
import { showToast, getFullPageUrl } from '../../../../utils/util'
import { string2Uint8Array } from 'm-utilsdk/index'
import { getScanRespPackInfo } from '../../../../utils/blueAdDataParse'
import { decodeWifi } from '../../../assets/js/utils'
import { deviceImgMap } from '../../../../utils/deviceImgMap'
import WifiMgr from '../assets/js/wifiMgr'
import { addDeviceSDK } from '../../../../utils/addDeviceSDK.js'
import { checkPermission } from '../../../../common/js/checkPermissionTip'
import { setWifiStorage } from '../../utils/wifiStorage'
import { environment } from '../../../../common/js/api'
const brandStyle = require('../../../assets/js/brand.js')
import { brandConfig } from '../../../assets/js/brand'
import { commonDialog } from '../../../assets/js/commonDialog'
import app from '../../../../common/app'
let wifiMgr = new WifiMgr()

let interval = null
let showImgTime = null
const systemInfo = wx.getSystemInfoSync()

Page({
  behaviors: [addDeviceMixin, netWordMixin, computedBehavior, bluetooth, checkAuthMixin, pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    currentHomeGroupId: '',
    isInitWifiSuccess: false,
    isCanSeePsw: true,
    pswInputType: false,
    wifiDialogShow: false,
    wifiInputPlaceholder: '未获取到家庭WiFi',
    wifiInputRightText: '重新获取',
    isGetCurLinkWifiInfo: false, //是否获取到当前连接wifi信息

    netType: null,
    device: null,
    deviceId: null,
    deviceSn: null,
    wifiListShow: false,
    bindWifiTest: {
      //当前的wifi信息
      BSSID: '',
      EncryptType: '',
      SSIDLength: '',
      PswLength: '',
      SSIDContent: '',
      PswContent: '',
      randomCode: '',
      chain: '',
      signalStrength: '', //强度
      frequency: '', //频率
    },
    wifiList: [],
    connectStatus: 0, // 0未配网，1 连接中，2配网成功 3配网失败
    countDown: 30,
    isReady: 0, // 0 未进入指定的配网模式 1 将进入

    //新增
    applianceCode: '',
    ctrlType: '',
    guideStep: [
      {
        title: '请前往手机系统设置页，将手机连接上家庭WiFi，再返回本页面',
      },
    ],
    mode: null,
    isIpx: app.globalData.isPx,
    isSwitchWifi: false,
    tryGetWifiNum: 0, //重试获取wifi次数
    isLoad: true, //首次加载
    platform: '', //客户端平台
    nexText: '', //下一步的按钮文案
    isSupport5G: false, //设备是否支持5Gwifi配网
    isGetWifiList: true, //是否获取wifi列表
    wifiListTitle: '选择家庭WIFI',
    isTipIosUpVersion: false, //是否提示ios升级版本
    pageStatus: 'show', //页面状态
    isCanAddDevice: true, //是否可添加设备
    clickNetFLag: false, //点击下一步防重复
    isShowRouttingImg: true, //是否显示图片
    permissionTypeList: {}, //权限状态参数
    spaceTip: ' ', //输入的wifi密码包含空格提示
    tempPsw: '', //暂存密码用于密码限制输入判断
    otherAndroidSystem: true, //是否非小米系的其他系统 true:是(非小米)  false:否(是小米或红米)
    continueConnectWifi: false, //是否继续连wifi (手动输入) false:不是手动输入，true是手动输入
    ishowDialog: false, //是否显示操作指引弹窗
    ishowManualInputWiFi: false, //是否显示手动输入弹窗
    messageContent: '', //手动弹窗内容
    focusWifiName: false, //是否聚焦wifi名输入框
    focusWifiPwd: false, //是否聚焦wifi密码输入框
    brand: '',
    dialogStyle: brandStyle.brandConfig.dialogStyle, //弹窗样式
    blueCancelLinkModal: false,
    titleContent: '',
    brandConfig,
    locationResFlag: '',
  },

  ifFindMatchedBlueDevice: false, // 非自发现是否匹配到设备蓝牙

  computed: {
    showNextText() {
      return '下一步'
    },
    //当前连接wifi提示
    tipText() {
      // return `这个可能是一个5GHz WiFi，可能无法连接，请切换至2.4GHz WiFi`
      let { bindWifiTest, isSupport5G, wifiList } = this.data
      let target = wifiList.filter((item) => {
        return item.SSID == bindWifiTest.SSIDContent && item.frequency != bindWifiTest.frequency
      })
      if (target.length != 0) {
        bindWifiTest.frequency = target[0].frequency
      }
      if (bindWifiTest && bindWifiTest.frequency && bindWifiTest.frequency > 5000 && !isSupport5G) {
        return '该WiFi可能为5GHz WiFi，设备无法连接，请切换其他WiFi'
      }
      if (
        bindWifiTest &&
        bindWifiTest.SSIDContent &&
        addDeviceSDK.bySSIDCheckIs5g(bindWifiTest.SSIDContent) &&
        !isSupport5G
      ) {
        return '该WiFi可能为5GHz WiFi，设备无法连接，请切换其他WiFi'
      }
      if (addDeviceSDK.isDeviceAp(bindWifiTest.SSIDContent.toLocaleLowerCase())) {
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
    this.setData({
      brand: this.data.brand,
      guideImg: imgList['linkGuide'],
      wifiConnect: imgList['wifiConnect'],
      questinoImg: imgList['questino'],
    })
    console.log(this.data.brand)

    console.log('addDeviceInfo====', app.addDeviceInfo)
    const { deviceImg, deviceName, type, sn8, ssid, mode, guideInfo, enterprise, brandName, fm } = app.addDeviceInfo

    if (!deviceImg || !deviceName) {
      // 设备图片或名称缺失则补全
      let typeAndName
      if (fm === 'selectType') {
        typeAndName = this.getDeviceImgAndName(type)
      } else {
        typeAndName = this.getDeviceImgAndName(type, sn8)
      }
      if (!deviceImg) app.addDeviceInfo.deviceImg = typeAndName.deviceImg
      if (!deviceName) app.addDeviceInfo.deviceName = typeAndName.deviceName
    }
    this.setData({
      deviceName: deviceName || app.addDeviceInfo.deviceName,
      mode: mode || 0, //默认ap
      isSupport5G: (guideInfo && guideInfo[0].wifiFrequencyBand) == 2,
    })
    if (!brandName) {
      app.addDeviceInfo.brandName = this.getBrandBname(enterprise)
    }
    //设置连接方式
    app.addDeviceInfo.linkType = this.getLinkType(mode)
    this.checkSystm()
    if (this.data.system === 'iOS') {
      this.locationAuthorize() //判断用户是否授权小程序使用位置权限
    }
    if (mode == 0) {
      this.getWifisList()
    }
    this.getAgainCheckList() //提前获取需二次确权设备固件名单

    if (app.addDeviceInfo.mode == 0) {
      this.getWifisList()
    }
    this.wifiListSheet = this.selectComponent('#wifi-list-sheet') //组件的id
    try {
      app.addDeviceInfo.apUtils = await require.async('../../../assets/asyncSubpackages/apUtils.js') //分包异步加载
    } catch (error) {
      console.log('------------mode-------------')
    }
    // if (app.globalData.system.systemInfo == 'android') {
    //     this.getWifiList() //提前获取下wifi列表
    // }
    console.log('加载apUtils结果', app.addDeviceInfo)
    console.log('------------mode-------------')
    console.log('mode:', mode)
    console.log('fm:', fm)
    console.log('------------modeend-------------')
    if (mode == 0 || mode == 3) {
      if (fm == 'autoFound') {
        // 自发现入口
        this.handleCheckFlow()
      } else {
        // 非自发现入口，开启蓝牙扫描，按品类匹配
        this.searchBlueByType(type, sn8, ssid).then((device) => {
          console.log('---------开启蓝牙扫描--------')
          console.log('@module inputWifiInfo.js\n@method onLoad\n@desc 匹配到设备信息\n', device)
          this.ifFindMatchedBlueDevice = true
          this.getBlueGuide(device)
        })
      }
    }
  },
  //点击跳转wifi频率指引页
  goTofrequencyGuide() {
    wx.navigateTo({
      url: paths.frequencyGuide,
    })
  },
  //wifi 列表选取wifi
  selectWifi(e) {
    let res = e.detail
    let that = this
    let storageWifiListV1 = wx.getStorageSync('storageWifiListV1')
    if (storageWifiListV1 && storageWifiListV1[environment].length && decodeWifi(storageWifiListV1[environment])) {
      console.log('有对应环境的缓存wifi信息')
      let storageWifiList = decodeWifi(wx.getStorageSync('storageWifiListV1')[environment])
      console.log('uuuuuuuuuuuuuuu', storageWifiList, res.BSSID)
      let isHasPsw = false
      let wifiNum = null
      storageWifiList.forEach((item, index) => {
        // if (item.BSSID == res.BSSID) {
        if (item.SSIDContent == res.SSID) {
          console.log('有这个wifi的storage')
          isHasPsw = true
          wifiNum = index
        }
      })
      if (isHasPsw) {
        //有这个wifi的storage
        that.setData({
          bindWifiTest: storageWifiList[wifiNum],
        })
      } else {
        that.setData({
          'bindWifiTest.PswContent': '', //移除密码
        })
        //赋值wifi显示
        that.initBindWifiTest(res.BSSID, res.SSID, res.SSID.length, '01', '12', res.signalStrength, res.frequency)
      }
    } else {
      //没有wifi storage 直接取当前连接的wifi
      console.log('没有对应环境的缓存wifi信息')
      that.initBindWifiTest(res.BSSID, res.SSID, res.SSID.length, '01', '12', res.signalStrength, res.frequency)
    }
  },

  //判断ios是否需要升级版本
  checkSystm() {
    const res = wx.getSystemInfoSync()
    this.data.system = res.system
    console.log('res.system==========', res.system)
    if (res.system.includes('iOS')) {
      this.setData({
        system: 'iOS',
      })
    }
  },

  //点击已连上了wifi
  linktedWifi() {
    wx.showModal({
      title: '提示',
      content: '若您已确定手机连上了家庭WiFi,请确保您当前的微信版本为8.0.17及以上版本',
      showCancel: false,
      confirmText: '我知道了',
      success: function (res) {
        if (res.confirm) {
          console.log('click confirm')
        }
      },
    })
  },

  //切换wifi
  async inputPageSwitchWifi() {
    let that = this
    if (this.data.clickFLag) {
      console.log('进入防重逻辑')
      return
    }
    this.data.clickFLag = true
    const res = wx.getSystemInfoSync()
    console.log(res.system)
    if (res.system.includes('Android')) {
      let locationRes
      try {
        this.locationAuthorize()
        locationRes = await checkPermission.loaction()
        this.data.locationResFlag = locationRes
        console.log('[loactionRes]', locationRes)
      } catch (error) {
        that.data.clickFLag = false
      }
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
        that.data.clickFLag = false
        setTimeout(() => {
          this.data.actionScanClickFlag = false
        }, 1500)
        return
      }
      //安卓且获取到wifi列表
      this.getWifiList(true)
      this.wifiListSheet.showFrame()
      this.setData({
        wifiList: this.data.wifiList,
      })
      setTimeout(() => {
        that.setData({
          clickFLag: false,
        })
      }, 1000)
    } else {
      this.switchWifi()
      setTimeout(() => {
        that.setData({
          clickFLag: false,
        })
      }, 1000)
    }
  },

  //点击连接wifi
  linkWifi() {
    this.switchWifi()
  },
  //移除wifi缓存
  removeLinkNetRecordStorage() {
    wx.removeStorageSync('linkNetRecord')
  },
  //提前获取需二次确权设备固件名单
  async getAgainCheckList() {
    try {
      app.addDeviceInfo.againCheckList = await this.getTwoLinkNetList()
      wx.setStorageSync('againCheckList', app.addDeviceInfo.againCheckList)
    } catch (error) {
      if (wx.getStorageSync('againCheckList')) {
        app.addDeviceInfo.againCheckList = wx.getStorageSync('againCheckList')
      } else {
        app.addDeviceInfo.againCheckList = await this.getTwoLinkNetList()
      }
    }
  },
  getAddDeviceInfo() {
    let addDeviceInfo = {
      deviceName: '冰箱二代combo',
      deviceId: 'A0:68:1C:74:CB:BE', //设备蓝牙id
      mac: 'A0:68:1C:74:CB:BE', //设备mac combo:'A0:68:1C:74:CC:4A'  一代：'84:7C:9B:77:2D:47' 华凌：'A0:68:1C:BC:38:27'
      type: 'CA', //设备品类 AC
      sn8: '001A0481',
      deviceImg: '', //设备图片
      moduleType: 1, //模组类型 0：ble 1:ble+weifi
      blueVersion: 2, //蓝牙版本 1:1代  2：2代
      mode: 3,
      fm: 'nfc',
    }
    app.addDeviceInfo = addDeviceInfo
  },
  //clickWifiInputRightText
  clickWifiInputRightText() {
    let that = this
    if (this.data.isGetCurLinkWifiInfo) {
      that.showWifiList()
    } else {
      that.nowNetType().then((networkType) => {
        if (networkType != 'wifi') {
          this.setData({
            netType: 0,
          })
          return
        }
        that.getCurLinkWifiInfo()
      })
    }
  },
  //获取当前连接wifi的信息 onshow
  getCurLinkWifiInfo() {
    let that = this
    //获取当前连接wifi信息
    wifiMgr
      .getConnectedWifi(this.data.system)
      .then((res) => {
        console.log('获取当前连接wifi信息', res)
        console.log('storageWifiListV1======', wx.getStorageSync('storageWifiListV1'))
        let storageWifiListV1 = wx.getStorageSync('storageWifiListV1')
        if (storageWifiListV1 && storageWifiListV1[environment].length && decodeWifi(storageWifiListV1[environment])) {
          console.log('有对应环境的缓存wifi信息')
          // if (typeof wx.getStorageSync('bindWifiInfo') == 'object') { //未加密的做处理
          //     console.log('未加密的wifi信息')
          //     let bindWifiInfo = wx.getStorageSync('bindWifiInfo')
          //     wx.setStorageSync('bindWifiInfo', encyptWifi(bindWifiInfo))
          // }
          let storageWifiList = decodeWifi(wx.getStorageSync('storageWifiListV1')[environment])
          console.log('uuuuuuuuuuuuuuu', storageWifiList, res.BSSID)
          if (Array.isArray(storageWifiList)) {
            let isHasPsw = false
            let wifiNum = null
            storageWifiList.forEach((item, index) => {
              if (item.SSIDContent == res.SSID) {
                //调整为用wifi名作为标示
                console.log('有这个wifi的storage')
                isHasPsw = true
                wifiNum = index
              }
            })
            if (isHasPsw) {
              //有这个wifi的storage
              that.setData({
                bindWifiTest: storageWifiList[wifiNum],
              })
              if (/\s+/g.test(this.data.bindWifiTest.PswContent)) {
                this.setData({
                  spaceTip: '输入的密码包含空格，请确认是否输入准确',
                })
              } else {
                this.setData({
                  spaceTip: ' ',
                })
              }
            } else {
              that.setData({
                'bindWifiTest.PswContent': '', //移除密码
              })
              //赋值wifi显示
              that.initBindWifiTest(res.BSSID, res.SSID, res.SSID.length, '01', '12', res.signalStrength, res.frequency)
            }
          } else {
            //wifi 缓存异常
            wx.removeStorageSync('storageWifiListV1')
            that.initBindWifiTest(res.BSSID, res.SSID, res.SSID.length, '01', '12', res.signalStrength, res.frequency)
          }
        } else {
          //没有wifi storage 直接取当前连接的wifi
          console.log('没有对应环境的缓存wifi信息')
          that.initBindWifiTest(res.BSSID, res.SSID, res.SSID.length, '01', '12', res.signalStrength, res.frequency)
        }
        that.data.isGetCurLinkWifiInfo = true
        that.setData({
          wifiInputRightText: '切换WiFi',
          netType: 1,
        })
      })
      .catch((err) => {
        console.log('getConnectedWifi', err)

        that.setData({
          netType: 0,
        })
        if (err.errCode == '12005' || err.errCode == '12010') {
          this.data.tryGetWifiNum = this.data.tryGetWifiNum + 1
          if (this.data.tryGetWifiNum <= 3) {
            //异常自动重试3次
            that.initWifi()
          }
        } else if (err.errCode == '12006') {
          wx.showToast({
            title: '您未打开位置定位开关',
            icon: 'none',
          })
        }
        console.log('getConnectedWifi', err)
      })
  },

  //获取wifi列表信息 IsCyc是否循环
  getWifiList(IsCyc = false, interval = 2000) {
    let that = this
    if (this.data.isGetWifiList) {
      wifiMgr.getWifiSortByFrequency(
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
  async clickNoFoundFamilyWifi() {
    this.switchWifi()
    this.loopGetWifiInfo()
  },

  async loopGetWifiInfo() {
    let { SSIDContent } = this.data.bindWifiTest
    try {
      let wifiInfo = await wifiMgr.getConnectedWifi()
      console.log('[wifi列表点击去设置页 wifiInfo]', wifiInfo, SSIDContent)
      if (wifiInfo.SSID == SSIDContent) {
        //还是之前连接的wifi
        console.log('还是同一个wifi')
        if (this.data.pageStatus == 'show') {
          this.delay(1500).then(() => {
            this.loopGetWifiInfo()
          })
        }
        return
      }
      this.getCurLinkWifiInfo()
    } catch (error) {
      console.log('[get connected wifi fail]', error)
      if (this.data.pageStatus == 'show') {
        this.delay(1500).then((end) => {
          this.loopGetWifiInfo()
        })
      }
    }
  },

  //刷新wifi列表
  refreshWifiList() {
    console.log('刷新wifi列表=====')
    // this.setData({
    //     wifiList: []
    // })
    this.getWifiList()
  },

  //获取wifi列表信息
  getWifisList() {
    let that = this
    // wx.getSystemInfo({
    //     success(res) {
    //         that.setData({
    //             platform: res.platform
    //         })
    //     }
    // })
    const res = wx.getSystemInfoSync()
    this.setData({
      platform: res.platform,
    })
    if (this.data.platform == 'android') {
      wifiMgr.getWifiSortByFrequency(
        (wifiList) => {
          that.setData({
            wifiList: wifiList,
          })
        },
        (error) => {
          console.log('获取wifi列表失败', error)
        },
      )
    }
  },

  //获取wifi信息
  initWifi() {
    let that = this
    wx.getSystemInfo({
      success: (res) => {
        let platform = res.res
        wx.startWifi({
          success() {
            console.log('初始化wifi成功')
            that.data.isInitWifiSuccess = true
            if (platform == 'ios') {
              //获取当前连接wifi信息 弹出确认窗口
              that.getCurLinkWifiInfo()
            } else {
              wx.getSetting({
                //安卓需要获取位置权限
                success(res) {
                  //地理位置
                  if (!res.authSetting['scope.userLocation']) {
                    wx.authorize({
                      scope: 'scope.userLocation',
                      success() {
                        //获取当前连接wifi信息
                        console.log('授权定位成功')
                        that.getCurLinkWifiInfo()
                      },
                      fail() {
                        wx.showModal({
                          title: '提示',
                          content: '定位失败，您未开启定位权限，点击开启定位权限',
                          success: function (res) {
                            if (res.confirm) {
                              wx.openSetting({
                                success: function (res) {
                                  if (res.authSetting['scope.userLocation']) {
                                    console.log('获取当前连接wifi信息')
                                    that.getCurLinkWifiInfo()
                                  } else {
                                    wx.showToast({
                                      title: '用户未开启地理位置权限',
                                      icon: 'none',
                                      duration: 3000,
                                    })
                                  }
                                },
                              })
                            }
                          },
                        })
                      },
                    })
                  } else {
                    //获取当前连接wifi信息
                    that.getCurLinkWifiInfo()
                  }
                },
              })
            }
          },
          fail() {
            wx.showToast({
              title: '初始化WiFi失败',
              icon: 'none',
              duration: 3000,
            })
          },
        })
        console.log('check platfform', platform)
      },
    })
  },
  switchPswShow() {
    let { isCanSeePsw, pswInputType } = this.data
    this.setData({
      isCanSeePsw: !isCanSeePsw,
      pswInputType: !pswInputType,
    })
  },
  // wifi输入框聚焦
  SSIDFocus() {
    this.data.focusWifiName = true
    this.showRouttingImg(false)
  },
  // wifi输入框失焦
  SSIDBlur() {
    this.data.focusWifiName = true
    this.showRouttingImg(true)
  },
  //密码输入框聚焦
  pswFocus() {
    this.data.focusWifiPwd = true
    this.showRouttingImg(false)
  },

  pswBlur() {
    this.data.focusWifiPwd = false
    this.showRouttingImg(true)
  },
  showRouttingImg(bool) {
    console.log('ddddddd')
    // 点击输入wifi名称和密码输入框，图片都要隐藏，如果是连着点击input框，就不显示图片，点击input框外的才显示图片。看了下，切换输入框的时候，1的失焦和2的聚焦中间时间为400+毫秒~500+毫秒，机型、缓存不一样，时间上也可能不一样，先设600毫秒
    showImgTime && clearTimeout(showImgTime)
    showImgTime = setTimeout(
      () => {
        this.setData({
          isShowRouttingImg: bool,
        })
      },
      bool ? 600 : 0,
    )
    console.log('isShowRouttingImg:', this.data.isShowRouttingImg)
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
        spaceTip: ' ',
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
        'bindWifiTest.PswContent': this.data.tempPsw,
        'bindWifiTest.PswLength': string2Uint8Array(this.data.tempPsw).length, //psw.length,
      })
    } else {
      if (psw.includes('…')) {
        psw = psw.replaceAll('…', '...')
      }
      this.setData({
        tempPsw: psw,
        'bindWifiTest.PswContent': psw,
        'bindWifiTest.PswLength': string2Uint8Array(psw).length, //psw.length,
      })
    }
    console.log('输入的WiFi密码', this.data.bindWifiTest)
    if (e.detail.value.length != this.data.bindWifiTest.PswContent.length) {
      return {
        value: this.data.bindWifiTest.PswContent,
        cursor: e.detail.cursor - (e.detail.value.length - this.data.bindWifiTest.PswContent.length),
      }
    } else {
      return {
        value: this.data.bindWifiTest.PswContent,
        cursor: e.detail.cursor,
      }
    }
  },
  //下一步
  async configNetWork() {
    let self = this
    if (this.data.clickNetFLag) {
      return
    }
    this.data.clickNetFLag = true
    console.log('bindWifiTest:', this.data.bindWifiTest)
    let { BSSID, PswContent, SSIDContent } = this.data.bindWifiTest
    if (!SSIDContent) {
      showToast('请输入WiFi名称')
      self.data.clickNetFLag = false
      return
    }
    if (!PswContent) {
      let checkInputPswRes = await this.checkInputPsw()
      if (checkInputPswRes.action == 'cancel') {
        //输入密码
        self.data.clickNetFLag = false
        return
      }
    }
    if (PswContent && PswContent.length < 8) {
      showToast('密码长度不足8位')
      self.data.clickNetFLag = false
      return
    }
    //检查位置和蓝牙权限以及是否打开
    // if (!(await this.checkLocationAndBluetooth(true, false, true, isCheckBluetooth, app.addDeviceInfo))) {
    //   self.data.clickNetFLag = false
    //   return
    // }

    this.locationAuthorize()
    let locationRes = await checkPermission.loaction()
    console.log('[loactionRes]', locationRes)
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
      self.data.clickNetFLag = false
      setTimeout(() => {
        this.data.actionScanClickFlag = false
      }, 1500)
      return
    }
    setWifiStorage(this.data.bindWifiTest)
    app.addDeviceInfo.curWifiInfo = this.data.bindWifiTest //共享选取的wifi
    app.addDeviceInfo.continueConnectWifi = this.data.continueConnectWifi // 保存是否手动输入的状态->失败页linkNetFail需要用到
    console.log('addDeviceInfo====', app.addDeviceInfo)
    const { deviceName, type, blueVersion, mode, fm, enterprise, ssid, isCheck } = app.addDeviceInfo
    this.searchBlueStopTimeout && clearTimeout(this.searchBlueStopTimeout)
    wx.offBluetoothDeviceFound()
    wx.stopBluetoothDevicesDiscovery()

    this.data.fm = fm || 'autoFound'
    if (mode == 0 && fm === 'autoFound') {
      //自发现ap
      if (this.isCanDrivingLinkDeviceAp(ssid)) {
        wx.navigateTo({
          url: paths.linkAp, //手动连接ap页
          complete() {
            self.data.clickNetFLag = false
          },
        })
      } else {
        wx.navigateTo({
          url: paths.linkAp, //手动连接ap页
          complete() {
            self.data.clickNetFLag = false
          },
        })
      }
      return
    }
    let pass = false
    let _this = this
    if (mode == 0 && this.data.platform == 'android' && fm != 'scanCode') {
      //如果是Android客户端，ap配网，设备已发出WiFi信号则跳过配网指引页
      // eslint-disable-next-line no-inner-declarations
      async function passFunc() {
        let brandName = _this.getBrandBname(enterprise)
        console.log('跳过配网指引', `${brandName}_${type.toLocaleLowerCase()}`)
        console.log('跳过配网指引', _this.data.wifiList)
        let result = await _this.data.wifiList.find((item) => {
          return item.SSID.includes(`${brandName}_${type.toLocaleLowerCase()}`)
        })
        console.log('跳过配网指引', result)
        let page = getFullPageUrl()
        if (result && page.includes('addDevice/pages/inputWifiInfo/inputWifiInfo')) {
          pass = true
          if (!deviceName) {
            app.addDeviceInfo.deviceName = deviceImgMap[type].title
          }
          // app.addDeviceInfo.isCanDrivingLinkDeviceAp = true
          wx.navigateTo({
            url: paths.linkAp,
            complete() {
              self.data.clickNetFLag = false
            },
          })
          return
        }
      }
      if (this.data.wifiList.length != 0) {
        await passFunc()
      } else {
        wifiMgr.getWifiSortByFrequency(
          (wifiList) => {
            _this.setData({
              wifiList: wifiList,
            })
            passFunc()
          },
          (error) => {
            console.log('获取wifi列表失败', error)
            self.data.clickNetFLag = false
          },
        )
      }
    }
    if (pass) {
      self.data.clickNetFLag = false
      return
    }
    if (mode == 20 || mode == 21) {
      //做了直连
      app.addDeviceInfo.mode = 21 //去配网
      wx.navigateTo({
        url: paths.linkDevice,
        complete() {
          self.data.clickNetFLag = false
        },
      })
      console.log('change mode---------', app.addDeviceInfo.mode)
      return
    }
    if (mode == 31) {
      //masmart做了直连 去配网
      wx.navigateTo({
        url: paths.linkDevice,
        complete() {
          self.data.clickNetFLag = false
        },
      })
      return
    }
    if ((mode == 5 && fm === 'autoFound' && blueVersion != 1) || (mode == 3 && fm === 'bluePugin')) {
      wx.navigateTo({
        url: paths.linkDevice,
        complete() {
          self.data.clickNetFLag = false
        },
      })
      return
    }
    if (mode == 3) {
      if (fm != 'autoFound' && !this.ifFindMatchedBlueDevice) {
        // 非自发现未匹配到设备蓝牙，跳转配网指引页
        wx.navigateTo({
          url: paths.addGuide,
          complete() {
            self.data.clickNetFLag = false
          },
        })
        return
      }
      if (isCheck) {
        // 设备已确权，跳转联网进度页
        wx.navigateTo({
          url: paths.linkDevice,
          complete() {
            self.data.clickNetFLag = false
          },
        })
        return
      }
      if (blueVersion == 1) {
        // 一代蓝牙，跳转配网指引页
        wx.navigateTo({
          url: paths.addGuide,
          complete() {
            self.data.clickNetFLag = false
          },
        })
        return
      }
      if (this.ifNearbyChecked) {
        // 靠近确权成功，跳转联网进度页
        wx.navigateTo({
          url: paths.linkDevice,
          complete() {
            self.data.clickNetFLag = false
          },
        })
        return
      } else {
        // 靠近确权失败，跳转靠近确权
        app.addDeviceInfo.ifNearby = true
        wx.navigateTo({
          url: paths.addGuide,
          complete() {
            self.data.clickNetFLag = false
          },
        })
        return
      }
    }

    wx.navigateTo({
      url: paths.addGuide,
      complete() {
        self.data.clickNetFLag = false
      },
    })
    this.data.isSwitchWifi = false //不切换
  },
  //确认输入wifi密码弹窗
  checkInputPsw() {
    return new Promise((resolve, reject) => {
      wx.showModal({
        title: '家庭WiFi密码为空',
        content: '请确认当前家庭WiFi为无密码WiFi，密码错误会造成配网失败噢',
        cancelText: '输入密码',
        confirmText: '继续',
        cancelColor: '#458BFF',
        confirmColor: '#458BFF',
        success(res) {
          resolve(res)
        },
        fail(error) {
          reject(error)
        },
      })
    })
  },
  hideWifiList() {
    this.setData({
      wifiListShow: false,
    })
  },
  onWifiList() {
    wx.onGetWifiList((result) => {
      console.log('当前的wifi列表', result)
      this.setData({
        wifiList: result.wifiList,
      })
    })
  },
  chooseWifi(e) {
    var item = e.currentTarget.dataset.item
    this.initBindWifiTest(item.BSSID, item.SSID, item.SSID.length, '01', '12', item.signalStrength, item.frequency)
    // console.log(e);
    console.log(item)
    this.hideWifiList()
  },
  initBindWifiTest(BSSID, SSIDContent, SSIDLength, EncryptType, chain, signalStrength, frequency) {
    SSIDLength = string2Uint8Array(SSIDContent).length
    this.setData({
      'bindWifiTest.BSSID': BSSID,
      'bindWifiTest.SSIDContent': SSIDContent,
      'bindWifiTest.SSIDLength': SSIDLength,
      'bindWifiTest.EncryptType': EncryptType,
      'bindWifiTest.chain': chain,
      'bindWifiTest.signalStrength': signalStrength, //Wi-Fi 信号强度, 安卓取值 0 ～ 100 ，iOS 取值 0 ～ 1 ，值越大强度越大
      'bindWifiTest.frequency': frequency, //Wi-Fi 频段单位 MHz
    })
    console.log('上报了wifi ssid and chain', BSSID, chain)
  },
  showToast(text) {
    wx.showToast({
      title: text,
      icon: 'none',
    })
  },
  reconnect() {
    this.setData({
      connectStatus: 0,
      countDown: 30,
      isReady: 0,
    })
    clearInterval(interval)
  },
  connectFailReset() {
    this.setData({
      connectStatus: 3, // 设定连接失败标志位,
      countDown: 30,
      isReady: 0,
    })
  },

  async checkNet() {
    try {
      await wifiMgr.getConnectedWifi()

      if (this.data.continueConnectWifi) {
        this.setData({
          continueConnectWifi: false,
        })
      }
      this.setData({
        netType: 1, //wifi
      })
      if (this.data.ishowDialog || this.data.ishowManualInputWiFi) {
        this.setData({
          ishowDialog: false,
          ishowManualInputWiFi: false,
        })
      }
      this.getCurLinkWifiInfo()
    } catch (error) {
      if (this.data.continueConnectWifi) {
        return
      }
      console.log('非wifi状态', error)
      this.setData({
        netType: 0, //非wifi
      })
      if (this.data.netType === 0 && this.data.isLoad) {
        //只触发一次
        this.data.isLoad = false
      }
      // todo: 暂时注释，没必要不停轮询wifi状态
      // if (this.data.pageStatus === 'show') {
      //   this.delay(1500).then((end) => {
      //     this.checkNet()
      //   })
      // }
    }
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
  delay(milSec) {
    return new Promise((resolve) => {
      setTimeout(resolve, milSec)
    })
  },
  skip() {
    let { type, cloudBackDeviceInfo } = app.addDeviceInfo
    wx.closeBLEConnection({
      deviceId: app.addDeviceInfo.deviceId,
    })
    let type0x = type.includes('0x') ? type : '0x' + type
    let deviceInfo = encodeURIComponent(JSON.stringify(cloudBackDeviceInfo))
    wx.reLaunch({
      url: `/plugin/T${type0x}/index/index?backTo=/pages/index/index&deviceInfo=${deviceInfo}`,
    })
  },

  //msmart 直连取消后配网
  blueCancelLinkWifi() {
    let { deviceName } = app.addDeviceInfo
    this.setData({
      titleContent: `要放弃为${deviceName}配网吗`,
      messageContent: `请在等一等，${deviceName}正在努力连接中`,
      blueCancelLinkModal: true,
    })

    this.goBack()
  },
  giveUpBlueCancelLink() {
    let { type, cloudBackDeviceInfo } = app.addDeviceInfo
    wx.closeBLEConnection({
      deviceId: app.addDeviceInfo.deviceId,
    })
    let type0x = type.includes('0x') ? type : '0x' + type
    let deviceInfo = encodeURIComponent(JSON.stringify(cloudBackDeviceInfo))
    wx.reLaunch({
      url: `/plugin/T${type0x}/index/index?backTo=/pages/index/index&deviceInfo=${deviceInfo}`,
    })
  },
  //移除wifi缓存
  removeWifiStorage() {
    wx.removeStorageSync('bindWifiInfo')
    this.setData({
      bindWifiTest: {},
    })
  },
  makeSure(e) {
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
  },
  //未开定位权限提示
  async noLoactionTip() {
    try {
      let locationRes = await checkPermission.loaction()
      console.log('[loactionRes]', locationRes)
      if (!locationRes.isCanLocation) {
        this.data.permissionTypeList = locationRes.permissionTypeList //暂存
        if (this.data.guideStep.length >= 2) {
          this.data.guideStep[0] = {
            type: 'location',
            title: '允许程序使用位置信息',
            desc: locationRes.permissionTextList,
          }
          this.setData({
            guideStep: this.data.guideStep,
          })
        } else {
          this.data.guideStep.unshift({
            type: 'location',
            title: '允许程序使用位置信息',
            desc: locationRes.permissionTextList,
          })
          this.setData({
            guideStep: this.data.guideStep,
          })
        }
      } else {
        if (this.data.guideStep.length > 1) {
          this.data.guideStep.shift()
          this.setData({
            guideStep: this.data.guideStep,
          })
        }
      }
    } catch (error) {
      console.log('[no location tip error]', error)
    }
  },
  //查看权限指引
  lookGuide() {
    wx.navigateTo({
      url: paths.locationGuide + `?permissionTypeList=${JSON.stringify(this.data.permissionTypeList)}`,
    })
  },
  /**
   * 获取蓝牙配网指引
   */
  async getBlueGuide(device) {
    const { fm, hadChangeBlue, mode } = app.addDeviceInfo
    if (mode == 0 && fm != 'autoFound' && !hadChangeBlue) {
      // AP配网非自发现入口
      // 不判断蓝牙配网指引，均转换为蓝牙配网
      app.addDeviceInfo.adData = device.adData
      app.addDeviceInfo.blueVersion = this.getBluetoothType(device.adData)
      app.addDeviceInfo.deviceId = device.deviceId
      app.addDeviceInfo.mac = this.getIosMac(device.adData)
      if (!app.addDeviceInfo.referenceRSSI) {
        app.addDeviceInfo.referenceRSSI = this.getReferenceRSSI(device.adData)
      }
      app.addDeviceInfo.sn8 = this.getBlueSn8(device.adData)
      app.addDeviceInfo.ssid = this.getBluetoothSSID(
        device.adData,
        app.addDeviceInfo.blueVersion,
        device.type,
        device.localName,
      )
      app.addDeviceInfo.mode = 3
      app.addDeviceInfo.linkType = addDeviceSDK.getLinkType(3)
      app.addDeviceInfo.hadChangeBlue = true
      console.log(
        '@module inputWifiInfo.js\n@method getBlueGuide\n@desc 转换为蓝牙配网，更新设备信息\n',
        app.addDeviceInfo,
      )
      // 埋点
      this.handleCheckFlow()
    }
    if (mode == 3) {
      // 蓝牙配网
      app.addDeviceInfo.adData = device.adData
      app.addDeviceInfo.blueVersion = this.getBluetoothType(device.adData)
      app.addDeviceInfo.deviceId = device.deviceId
      app.addDeviceInfo.mac = this.getIosMac(device.adData)
      if (!app.addDeviceInfo.referenceRSSI) {
        app.addDeviceInfo.referenceRSSI = this.getReferenceRSSI(device.adData)
      }
      app.addDeviceInfo.sn8 = this.getBlueSn8(device.adData)
      app.addDeviceInfo.ssid = this.getBluetoothSSID(
        device.adData,
        app.addDeviceInfo.blueVersion,
        device.type,
        device.localName,
      )
      console.log('@module inputWifiInfo.js\n@method getBlueGuide\n@desc 更新设备信息\n', app.addDeviceInfo)
      this.handleCheckFlow()
    }
  },
  /**
   * 处理确权流程
   */
  async handleCheckFlow() {
    const { adData, mode } = app.addDeviceInfo
    if (mode != 3) return
    const packInfo = getScanRespPackInfo(adData)
    console.log('@module inputWifiInfo.js\n@method handleCheckFlow\n@desc 蓝牙功能状态\n', packInfo)
    console.info('----是否支持扩展字段---' + packInfo.isFeature)
    app.addDeviceInfo.isFeature = packInfo.isFeature
    if (packInfo.isWifiCheck || packInfo.isBleCheck || packInfo.isCanSet) {
      // 设备已确权
      app.addDeviceInfo.isCheck = true
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    console.log('onshow==========')
    this.data.clickNetFLag = false //解决防重标志位没有被清除的问题
    this.checkNet()
    this.data.pageStatus = 'show'
    //如果是蓝牙配网则判断蓝牙是否授权
    if (addDeviceSDK.bluetoothAuthModes.includes(app.addDeviceInfo.mode)) {
      this.bluetoothAuthorize()
    }
    this.noLoactionTip()
    app.globalData.isCanClearFound = true //配网流程返回首页或设备发现页清除ap蓝牙自发现已发现的设备信息
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.data.pageStatus = 'hide'
    clearInterval(interval)
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.data.pageStatus = 'unload'
    //重全局变量
    clearInterval(interval)
    wx.offBluetoothDeviceFound()
    wx.stopBluetoothDevicesDiscovery()
    console.log('监听页面卸载')
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

  //去连接wifi 提示弹窗
  connectWifi() {
    // 判断是否有精准定位，安卓 系统》=12
    console.log('系统start========================')
    console.log(systemInfo.brand)
    console.log('系统end========================')
    let { system, version, brand } = systemInfo
    let systemType = system.split(' ')[0]
    let systemGrade = this.systemGrade()
    // 如果是IOS  或者  微信系统>= 8.2.0  或者  安卓系统没有精准定位功能
    if (systemType === 'IOS' || this.toNum(version) >= this.toNum('8.2.0') || !systemGrade) {
      this.setData({
        ishowManualInputWiFi: true,
        messageContent: '无法获取所连接的WiFi，可手动输入家庭WiFi名称与密码',
      })
    } else {
      // 安卓系统有精准定位
      brand = brand.toLowerCase()
      if (brand === 'xiaomi' || brand === 'redmi') {
        //是否符合品牌
        this.setData({
          ishowDialog: true,
          modalText: '请关闭手机系统中微信的"模糊定位"开关',
          otherAndroidSystem: false, //是小米系的安卓系统
        })
      } else if (
        brand === 'vivo' ||
        brand === 'huawei' ||
        brand === 'honor' ||
        brand === 'oppo' ||
        brand === 'motorola'
      ) {
        this.setData({
          ishowDialog: true,
          modalText: '请开启手机系统中微信的"精确位置"开关',
          otherAndroidSystem: true, //非小米系的安卓系统
        })
      } else {
        // 除去小米，红米，vivo,华为，荣耀，oppo,摩托罗拉的其他品牌
        this.setData({
          ishowManualInputWiFi: true,
          messageContent:
            '请检查手机系统中对于微信的位置授权，是否具备”精准位置/确切位置“项，若具备，请开启该权限后重试；若不具备，请尝试手动输入WiFi名称与密码',
        })
      }
    }
  },

  toNum(num) {
    num = num.toString()
    var version = num.split('.')
    var num_place = ['', '0', '00', '000', '0000'],
      r = num_place.reverse()
    for (var i = 0; i < version.length; i++) {
      var len = version[i].length
      version[i] = r[len] + version[i]
    }
    var res = version.join('')
    return res
  },

  //判断是否有精准定位，安卓 系统》=12
  systemGrade() {
    let result = false //true 有精准定位
    let { system, brand } = systemInfo
    brand = brand.toLowerCase()
    let systemNum = system.split(' ')[1]
    let phoneSystem = system.split(' ')[0]
    // console.log(this.toNum('10.0.1'))
    if (phoneSystem === 'iOS') {
      result = false
    } else {
      if (this.toNum(systemNum) >= this.toNum('12')) {
        result = true
      }
    }
    return result
  },

  //跳转系统微信设置页
  clickSetting() {
    wx.openAppAuthorizeSetting({
      //ios和安卓都是打开系统微信设置页，效果一样
      success(res) {
        console.log('测试返回', res)
      },
    })
  },
  //点击查看操作指引
  toOperate() {
    //根据不同类型跳转不同的页面
    console.log(this.data.otherAndroidSystem)
    this.setData({
      ishowDialog: false,
    })
    wx.navigateTo({
      url: paths.locationGuide + `?route=operatingInstructions&otherAndroidSystem=${this.data.otherAndroidSystem}`,
    })
  },
  onClickOverlay() {
    this.setData({
      ishowDialog: false,
    })
  },

  clickManualInputWiFiBtn() {
    // 切换wifi登记页
    this.setData({
      continueConnectWifi: true,
      netType: 1, //非wifi
    })
  },
  closeManualInputWiFiDialog() {
    this.setData({
      ishowManualInputWiFi: false,
    })
  },
  //手动输入wifi名
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
          bindWifiTest: storageWifiList[wifiNum],
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
})
