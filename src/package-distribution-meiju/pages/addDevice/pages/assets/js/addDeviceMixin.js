/* eslint-disable @typescript-eslint/no-this-alias */
import { getReqId, getStamp } from 'm-utilsdk/index'
import { showToast, getFullPageUrl } from '../../../../../utils/util'
import { creatErrorCode, failTextData } from './errorCode'
import paths from '../../../../../utils/paths'
import { brandConfig } from '../../../../assets/js/brand'
const app = getApp() //获取应用实例

const supportedApplianceTypes = [
  '0xAC',
  '0xA1',
  '0xE3',
  '0xE2',
  '0xED',
  '0xE1',
  '0xE6',
  '0xB6',
  '0xB7',
  '0xCA',
  '0xD9',
  '0xDA',
  '0xDB',
  '0xDC',
  '0x46',
  '0xB1',
  '0xB2',
  '0xB9',
] //colmo支持的品类-一期
const filterList = {
  '0xAC': {
    // colmo上线机型列表
    SN8: [
      // 挂机
      '22019035',
      '22012211',
      '22019025',
      '220Z1530',
      '220Z1336',
      '220Z1406',
      '220Z1527',
      '220Z1453',
      '22019033',
      '22019027',
      '220L9900',
      '220Z1540',
      '220Z1464',
      '22019037',
      '22019029',
      '22019043',
      '22019041',
      '220Z1549',
      '220Z1550',
      '220Z1339',
      '220Z1352',
      '22019021',
      '22019001',
      '220Z1467',
      '22019031',
      '22019039',
      '22019023',
      '22019003',
      '22019045',
      '220Z1553',
      // 柜机 4-2
      '22259029',
      '222Z1468',
      '222Z1543',
      '22259015',
      '22259031',
      '222Z1544',
      '22259017',
      '222Z1465',
      '222Z1450',
      '22259013',
      '22259027',
      '222Z1547',
      '22259023',
      '22259033',
      '222Z1546',
      '222Z1486',
      '22259001',
      '222Z1353',
      '222Z1430',
      '22259007',
      '222Z1340',
      '222Z1329',
      '222Z1545',
      '222Z1485',
      '222Z1429',
      '222Z1354',
      '22259009',
      '22251025',
      '22259025',
      '22259021',
      '222L9996',
      '222Z1548',
      '222Z1466',
      '22259037',
      '22259035',
      '22259019',
      '22259039',
      '222Z1555',
      // 小多联三管制
      '22396927',
      '22396929',
      '22396925',
      '230Z1484',
      '22396923',
      '22396919',
      '22396921',
      '22396915',
      '22396917',
      // 小多联两管制
      '22396933',
      '22396939',
      '22396935',
      '22396945',
      '22396943',
      '22396937',
      '22396941',
      // 新风机
      '26096911',
      '26096913',
    ],
  },
  '0xED': {
    SN8: [
      '63100001',
      '63200848',
      '63200849',
      '63200851',
      '63200B16',
      '63200A75',
      '63200B14',
      '632A0A63',
      '63200A63',
      '63200A95',
      '63200A05',
      '63200A61',
      '63200A97',
      '63200A06',
      '6320B139',
      '6320B105',
      '6320084F',
      '6320084M',
      '6320084N',
      '6320084L',
      '6320084P',
      '6320084W',
      '6310LA16',
      '6300RA08',
      '6300DA01',
      '6320084C',
      '6320084G',
      '6320084B',
      '6320084K',
      '6320084Q',
      '6320084A',
      '6320084E',
    ],
  },
  '0xA1': {
    // colmo上线机型列表
    SN8: [
      // 除湿机
      '20104019',
      '20104018',
    ],
  },
  '0xB1': {
    SN8: ['71100001'],
  },
  '0xB2': {
    SN8: ['000CSK50', '70100001'],
  },
  '0xB9': {
    // colmo上线机型列表
    SN8: ['665000VR'],
  },
}
// eslint-disable-next-line no-undef
module.exports = Behavior({
  behaviors: [],
  properties: {
    // deviceInfo: {
    //     type: Object
    // }
  },
  data: {
    // deviceInfo: '',
    isIpx: app.globalData.isPx,
    imges: {
      meiPhone: '/addDeviceAboutImg/ic_meiphone@1x.png',
      zhuyi: '/addDeviceAboutImg/link_ic_zhuyi.png',
      nearby: '/addDeviceAboutImg/kaojinshebei.png',
      blueCD: '/addDeviceAboutImg/blue_cd.png',

      successRight: '/addDeviceAboutImg/succeed_icon_right.png',
      right: '/addDeviceAboutImg/right.png',

      wifiConnect: '/addDeviceAboutImg/wifi_ic_img_connect.png',
      wifiShow: '/addDeviceAboutImg/WiFi_ic_kejian.png',
      wifiHide: '/addDeviceAboutImg/wifi_ic_bukejian.png',

      loading: '/addDeviceAboutImg/loading_spot.png',
      linkCheck: '/addDeviceAboutImg//link_ic_checked.png',
      linkLoading: '/addDeviceAboutImg/link_ic_loading.png',

      fail: '/addDeviceAboutImg/shibai_icon_shibai.png',

      linkGuide: '/addDeviceAboutImg/wifi_img_lianjiezhiyin.png',
      noSel: '/addDeviceAboutImg/btn_off@3x.png',
      sel: '/addDeviceAboutImg/btn_on@3x.png',

      psw: '/addDeviceAboutImg/ic_mima@3x.png',
      wifi: '/addDeviceAboutImg/ic_wifi@3x.png',
      apName: '/addDeviceAboutImg/wifi_img_guide@3x.png',
      noFound: '/addDeviceAboutImg/img_no found shebei.png',

      //找不到wifi弹窗相关
      closeImg: '/addDeviceAboutImg/pop_ic_close@1x.png',
      noFoundApDiscover: '/addDeviceAboutImg/no_found_ap_discover@2x.png',
      noFoundApSwitch: '/addDeviceAboutImg/no_found_ap_WiFi_switch@2x.png',

      noLocation: '/addDeviceAboutImg/img_no_location@3x.png',

      questino: '/addDeviceAboutImg/ic_2.4GHzremind@3x.png',

      //输入wifi页相关
      refresh: '/addDeviceAboutImg/list_ic_refresh@3x.png',
      wifiSignalStrength1: '/addDeviceAboutImg/ic_wifi@3x.png',
      wifiSignalStrength2: '/addDeviceAboutImg/smart_wifi_01@3x.png',
      wifiSignalStrength3: '/addDeviceAboutImg/smart_wifi_02@3x.png',
      wifiSignalStrength4: '/addDeviceAboutImg/smart_wifi_03@3x.png',

      noWifiList: '/addDeviceAboutImg/img_no home@3x.png',

      //linkAp
      linkDeviceWifiMidea: '/addDeviceAboutImg/Midea_iOS.gif',
      linkDeviceWifiMidea_new: '/addDeviceAboutImg/link_Device_wifi_midea.png',
      android_ApName: '/addDeviceAboutImg/Midea_android.gif',
      android_ApName_new: '/addDeviceAboutImg/android_guidance.png',
      android_linkDeviceWifiBugu: '/addDeviceAboutImg/bugu_Android.gif',
      linkDeviceWifiBugu: '/addDeviceAboutImg/bugu_iOS.gif',
      detailPackUp: '/addDeviceAboutImg/ic_zhankai@3x.png',
      detailExpand: '/addDeviceAboutImg/ic_shouqi@3x.png',
      detailStep2: '/addDeviceAboutImg/img_step2@3x.png',
      detailStep3: '/addDeviceAboutImg/img_step3@3x.png',
      detailStep4: '/addDeviceAboutImg/img_step4@3x.png',
      detailStep4_1: '/addDeviceAboutImg/img_step4_1@2x.png',
      detailStep5: '/addDeviceAboutImg/img_step5@2x.png',
      android_step1: '/addDeviceAboutImg/img_Android_step1@2x.png',
      android_step2: '/addDeviceAboutImg/img_Android_step2@2x.png',
      android_step3: '/addDeviceAboutImg/img_Android_step3@2x.png',
    },
    isStopGetExists: false, //是否停止查询设备已连上云
    isStartwifi: false, //是否初始化了wifi模块
    failTextData: failTextData,
    isStopLinkWifi: false,
  },
  methods: {
    //校验手机系统版本
    checkPhoneSystemVerion(version = '14.0.0') {
      let phoneSystemVersion = app.globalData.systemInfo.system.split(' ')[1]
      let phoneSystemVersionArr = phoneSystemVersion.split('.')
      let paramsVersionArr = version.split('.')
      console.log('[phoneSystemVersion]', phoneSystemVersionArr, paramsVersionArr)
      if (Number(paramsVersionArr[0]) < phoneSystemVersionArr[0]) {
        return true
      }

      if (
        Number(paramsVersionArr[0]) == Number(phoneSystemVersionArr[0]) &&
        Number(paramsVersionArr[1]) < Number(phoneSystemVersionArr[1])
      ) {
        return true
      }

      return Number(paramsVersionArr[0]) == Number(phoneSystemVersionArr[0]) &&
        Number(paramsVersionArr[1]) == Number(phoneSystemVersionArr[1]) &&
        Number(paramsVersionArr[2]) < Number(phoneSystemVersionArr[2]);
    },
    //延迟函数
    delay(milSec) {
      return new Promise((resolve) => {
        setTimeout(resolve, milSec)
      })
    },
    //异步延迟函数
    async delayAwait(milSec) {
      await new Promise((resolve) => setTimeout(resolve, milSec))
    },
    //reportEven 数据上报
    apLogReportEven(params) {
      let data = {
        ...params,
      }
      wx.reportEvent('ap_local_log', {
        data: JSON.stringify(data),
        page_path: getFullPageUrl(),
        device_session_id: app.globalData.deviceSessionId || '',
        uid: (getApp().globalData.userData && getApp().globalData.userData.uid) || '',
        time: new Date().getTime(),
      })
    },
    //获取当前ip地址
    getLocalIPAddress() {
      return new Promise((resolve, reject) => {
        if (!wx.canIUse('getLocalIPAddress')) {
          console.log('不支持获取ip')
          resolve(null)
          return
        }
        wx.getLocalIPAddress({
          success(res) {
            // const localip = res.localip
            resolve(res)
          },
          fail(error) {
            console.log('获取ip失败================', error)
            reject(error)
          },
        })
      })
    },
    logAddDivceInfo(logKey, addDviceInfo) {
      let addDviceInfoTemp = JSON.parse(JSON.stringify(addDviceInfo))
      if (addDviceInfoTemp.againCheckList) addDviceInfoTemp.againCheckList = ''
      if (addDviceInfoTemp.apUtils) addDviceInfoTemp.apUtils = ''
      if (addDviceInfoTemp.deviceImgPath) addDviceInfoTemp.deviceImgPath = ''
      if (addDviceInfoTemp.guideInfo) addDviceInfoTemp.guideInfo = ''
    },
    /**
     * 尝试连接wifi
     * @param {*} wifiInfo      wifi信息
     * @param {*} frequency     频率            秒
     * @param {*} callBack      成功
     * @param {*} callBack      失败
     */
    async tryConectWifi(wifiInfo, frequency = 2, callBack, callFail) {
      let { ssid, password, isGoSet } = wifiInfo
      if (!this.data.isSuccessLinkDeviceAp && !this.data.isStopLinkWifi) {
        try {
          await this.connectWifi(ssid, password, isGoSet)
          this.data.isSuccessLinkDeviceAp = true
          callBack && callBack()
        } catch (error) {
          console.log('tryConectWifi error', error)
          if (this.data.isStopLinkWifi) return
          setTimeout(() => {
            this.tryConectWifi(wifiInfo, (frequency = 2), callBack, callFail)
          }, frequency * 1000)
        }
      }
    },
    /**
     * 连接wifi
     * @param {*} SSID          wifi ssid
     * @param {*} password      密码
     * @param {*} isGoSet       是否跳转到设置页
     */
    connectWifi(SSID, password, isGoSet = false) {
      console.log('driving link  wifi', SSID, password)
      return new Promise((resolve, reject) => {
        wx.startWifi({
          success(resp) {
            console.log('startWifi', resp)
            wx.connectWifi({
              SSID: SSID,
              password: password,
              maunal: isGoSet, //是否去设置页连接
              // forceNewApi: true, //使用原生连接wifi方法
              success(res) {
                console.log('主动连接wifi成功', res)
                resolve(res)
              },
              fail(error) {
                console.log('driving link wifi error', error)
                reject(error)
              },
            })
          },
        })
      })
    },
    //是否可以主动连接设备ap
    isCanDrivingLinkDeviceAp(ssid) {
      let res = wx.getSystemInfoSync()
      return res.system.includes('Android') || ssid;
    },
    //获取当前家庭默认id
    getCurrentHomeGroupId() {
      //获取家庭列表
      return new Promise((resolve, reject) => {
        let reqData = {
          reqId: getReqId(),
          stamp: getStamp(),
        }
        // requestService.request('applianceList', reqData).then(
        //   (resp) => {
        //     if (resp.data.code == 0) {
        //       let homeList = resp.data.data.homeList || {}
        //       console.log('homeList====', homeList)
        //       let homegroupId = ''
        //       homeList.forEach((item, index) => {
        //         if (item.isDefault == '1') {
        //           homegroupId = item.homegroupId
        //         }
        //       })
        //       resolve(homegroupId)
        //     } else {
        //       reject(resp)
        //     }
        //   },
        //   (error) => {
        //     reject(error)
        //   }
        // )
      })
    },
    //获取自启热点 无后确权固件名单
    getTwoLinkNetList() {
      let params = {
        reqId: getReqId(),
        stamp: getStamp(),
      }
      return new Promise((resolve, reject) => {
        // requestService
        //   .request('firmwareList', params)
        //   .then((resp) => {
        //     console.log('获取自启热点 无后确权固件名单 resp', resp.data.data)
        //     resolve(resp.data.data)
        //   })
        //   .catch((error) => {
        //     console.log('获取自启热点 无后确权固件名单 error', error)
        //     reject(error)
        //   })
      })
    },
    //获取系统信息
    wxGetSystemInfo() {
      return new Promise((resolve) => {
        wx.getSystemInfo({
          success(res) {
            resolve(res)
          },
        })
      })
    },
    //获得连接方式
    getLinkType(mode) {
      let linkType = ''
      if (mode == 0) {
        linkType = 'ap'
      }
      if (mode == 3 || mode == 5) {
        linkType = 'bluetooth'
      }
      if (mode == 31) {
        linkType = '蓝牙直连后wifi配网'
      }
      if (mode == 9 || mode == 10) {
        linkType = '本地蓝牙直连'
      }
      return linkType
    },
    //查询设备是否连上云
    checkApExists(sn, forceValidRandomCode, randomCode = '', timeout) {
      return new Promise((resolve, reject) => {
        let reqData = {
          sn: sn,
          forceValidRandomCode: forceValidRandomCode,
          randomCode: randomCode,
          reqId: getReqId(),
          stamp: getStamp(),
        }
        console.log('checkApExists reqData:', reqData)
        console.log(`查询设备是否连上云参数 reqData=${JSON.stringify(reqData)},plainSn=${app.addDeviceInfo.plainSn}`)
        // requestService
        //   .request('checkApExists', reqData, 'POST', '', timeout)
        //   .then((resp) => {
        //     resolve(resp)
        //   })
        //   .catch((error) => {
        //     console.log('查询设备是否连上云 error', error)
        //     if (error.data) {
        //       app.addDeviceInfo.errorCode = this.creatErrorCode({
        //         errorCode: error.data.code,
        //         isCustom: true,
        //       })
        //     }
        //     if (app.addDeviceInfo && app.addDeviceInfo.mode == 0) {
        //       //
        //       if (error.data && error.data.code == 1384) {
        //         //随机数校验不一致
        //         app.addDeviceInfo.errorCode = this.creatErrorCode({
        //           errorCode: 4169,
        //           isCustom: true,
        //         })
        //       }
        //     }
        //     reject(error)
        //   })
      })
    },
    //新 轮询查询设备是否连上云
    newAgainGetAPExists(sn, forceValidRandomCode, randomCode = '', timeout, callBack, callFail) {
      let timeoutID
      const timeoutPromise = new Promise((resolve, reject) => {
        timeoutID = setTimeout(reject, 5000, 'WEB TIMEOUT')
      })
      Promise.race([timeoutPromise, this.checkApExists(sn, forceValidRandomCode, randomCode, timeout)])
        .then((resp) => {
          console.log('查询设备是否连上云', resp.data.code)
          if (resp.data.code == 0) {
            console.log('resolve------------')
            callBack && callBack(resp.data.data)
          } else {
            // console.log('查询设备是否连上云接口失败1', resp)
            // if (!this.data.isStopGetExists) {
            //   setTimeout(() => {
            //     this.newAgainGetAPExists(sn, forceValidRandomCode, randomCode, timeout, callBack, callFail)
            //   }, 2000)
            // }
            // callFail && callFail(resp)
          }
        })
        .catch((error) => {
          console.log('查询设备是否连上云接口失败2', error)
          if (this.data.isStopGetExists) return
          if (error.data && error.data.code) {
            console.log('设备未连上云', error)
            setTimeout(() => {
              this.newAgainGetAPExists(sn, forceValidRandomCode, randomCode, timeout, callBack, callFail)
            }, 2000)
          } else {
            console.log('请求超时', error)
            let time = 2000
            if (
              (error.errMsg && error.errMsg.includes('ERR_NAME_NOT_RESOLVED')) ||
              (error.errMsg && error.errMsg.includes('ERR_CONNECTION_ABORTED'))
            ) {
              console.log('ERR_NAME_NOT_RESOLVED', error)
              time = 7000
            }
            setTimeout(() => {
              this.newAgainGetAPExists(sn, forceValidRandomCode, randomCode, timeout, callBack, callFail)
            }, time)
            callFail && callFail(error)
          }
        })
        .finally(() => clearTimeout(timeoutID))
    },
    //轮询查询设备是否连上云
    againGetAPExists(sn, randomCode = '', callBack, callFail) {
      console.log('this.data.isStopGetExists===', this.data.isStopGetExists)
      this.checkApExists(sn, randomCode ? true : false, randomCode)
        .then((resp) => {
          console.log('查询设备是否连上云', resp.data.code)
          if (resp.data.code == 0) {
            console.log('resolve------------')
            callBack && callBack(resp.data.data)
          } else {
            if (!this.data.isStopGetExists) {
              setTimeout(() => {
                this.againGetAPExists(sn, randomCode, callBack, callFail)
              }, 2000)
            }
          }
        })
        .catch((error) => {
          if (!this.data.isStopGetExists) {
            setTimeout(() => {
              this.againGetAPExists(sn, randomCode, callBack, callFail)
            }, 2000)
          }
        })
    },
    //未配置指引统一处理
    noGuide() {
      wx.showModal({
        content: '获取不到设备操作指引',
        showCancel: false,
        confirmText: '我知道了',
        success(res) {
          if (res.confirm) {
            wx.reLaunch({
              url: paths.index,
            })
          }
        },
      })
    },
    //根据企业码返回企业热点名
    getBrandBname(enterprise) {
      let brandName = 'midea'
      if (enterprise == '0010') {
        brandName = 'bugu'
      }
      return brandName
    },
    //生成错误码
    creatErrorCode({ platform, module, errorCode, isCustom }) {
      return creatErrorCode({
        platform,
        module,
        errorCode,
        isCustom,
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
    //初始化wifi，模块
    startWifi() {
      let self = this
      return new Promise((resolve, reject) => {
        if (self.data.isStartwifi) {
          resolve()
        } else {
          wx.startWifi({
            success: (res) => {
              self.data.isStartwifi = true
              resolve()
            },
            fail(error) {
              reject()
            },
          })
        }
      })
    },

    /**
     * 切换wifi
     * @param {Boolean} iOSReConfirm iOS二次确认弹窗
     */
    switchWifi(iOSReConfirm = true) {
      this.data.isSwitchWifi = true
      const res = wx.getSystemInfoSync()
      if (res.system.includes('Android')) {
        // 直接跳转
        this.jumpSystemSetting()
      }
      if (res.system.includes('iOS')) {
        if (iOSReConfirm) {
          console.log('hhahhahaah')
          // 展示二次确认弹窗
          const self = this
          wx.showModal({
            content: '请直接到系统设置页进行连接，连接后返回本页面',
            cancelText: '暂不设置',
            cancelColor: '#999',
            confirmText: '立即前往',
            confirmColor: '#458BFF',
            success(res) {
              if (res.confirm) {
                self.jumpSystemSetting()
              }
            },
          })
        } else {
          // 直接跳转
          this.jumpSystemSetting()
        }
      }
    },
    /**
     * 跳转系统设置页
     */
    jumpSystemSetting() {
      wx.startWifi({
        success(res) {
          console.log('调用微信接口wx.startWifi成功', res)
          wx.connectWifi({
            SSID: '',
            password: '',
            maunal: true, // 是否去设置页连接
            success(res) {
              console.log('调用微信接口wx.connectWifi跳转设置页成功', res)
            },
            fail(error) {
              if (error.errCode == 12005) {
                showToast('请先打开手机WiFi')
              }
              console.log('调用微信接口wx.connectWifi跳转设置页失败', error)
            },
          })
        },
        fail(error) {
          console.log('调用微信接口wx.startWifi失败', error)
        },
      })
    },

    //指引文案格式化显示
    guideDescFomat(guideDesc) {
      guideDesc = guideDesc.replaceAll('<', '&lt;') //<转为&lt; 才能在微信rich-text组件显示
      guideDesc = guideDesc.replaceAll('>', '&gt;') //>转为&lt; 才能在微信rich-text组件显示
      guideDesc = guideDesc.replace(/\n/g, '<br/>') //换行
      guideDesc = guideDesc.replace(/「(.+?)」/g, '<span class="orange-display-txt">$1</span>') //标澄
      guideDesc = this.replaceInco(guideDesc)
      guideDesc = guideDesc.replace(/#([a-zA-Z0-9_-]+?)#/g, '<span class="orange-display-txt digitalFont"> $1 </span>') //数码管字体
      return guideDesc
    },

    //扫码
    scanCode() {
      return new Promise((resolve, reject) => {
        wx.scanCode({
          success(res) {
            console.log('扫码=====', res)
            // resolve(res.result)
            resolve(res)
          },
          fail(error) {
            console.log('扫码失败返回', error)
            reject(error)
          },
          complete() {},
        })
      })
    },
    /**
     * 补位
     * 1
     * len 2
     * return hex 01
     */
    padLen(str, len) {
      var temp = str
      var strLen = (str + '').length
      if (strLen < len) {
        for (var i = 0; i < len - strLen; i++) {
          temp = '0' + temp
        }
      }
      return temp
    },
    /**
     * 判断colmo设备SN是否colmo设备
     * @param {*} decodedSn
     * @returns
     */
    isColmoDeviceByDecodeSn(decodedSn = '') {
      return decodedSn[8] === '8'
    },

    /**
     * 查询是否为旧colmo设备
     * @param sn8 型号
     */
    isColmoDeviceBySn8(sn8) {
      let isColmo = false
      Object.values(brandConfig.allSN8List).some((item) => {
        if (item['sn8'] && item['sn8'].includes(sn8)) {
          isColmo = true
          return true
        }
        return false
      })
      Object.values(filterList).some((item) => {
        if (item['SN8'] && item['SN8'].includes(sn8)) {
          isColmo = true
          return true
        }
        return false
      })
      return isColmo
    },

    /**
     * 查询确权
     * @param {*} applianceCode
     * @returns
     */
    getApplianceAuthType(applianceCode) {
      let reqData = {
        applianceCode: applianceCode,
        reqId: getReqId(),
        stamp: getStamp(),
      }
      console.log('查询设备确权情况入参', reqData)
      return new Promise((resolve, reject) => {
        // requestService
        //   .request('getApplianceAuthType', reqData)
        //   .then((resp) => {
        //     resolve(resp)
        //   })
        //   .catch((error) => {
        //     reject(error)
        //   })
      })
    },

    /**
     * 该方法已经废弃，统一使用pluginFilter.js的方法，修改方法名
     * @param {*} type
     * @param {*} sn8
     * @param {*} A0
     * @param {*} isOtherEquipment
     */
    isSupportPlugin_backup(type, sn8, A0 = '', isOtherEquipment = '0') {
      let isSupport = false
      if (supportedApplianceTypes.indexOf(type) > -1 && isOtherEquipment == '0') {
        //filter third party equipment
        if (filterList[type]) {
          if (sn8) {
            if (filterList[type]['SN8']) {
              if (filterList[type]['SN8_blacklist']) {
                if (filterList[type]['SN8'].indexOf(sn8) > -1 && filterList[type]['SN8_blacklist'].indexOf(sn8) < 0) {
                  isSupport = true
                }
              } else {
                if (filterList[type]['SN8'].indexOf(sn8) > -1) {
                  isSupport = true
                }
              }
            } else {
              if (filterList[type]['SN8_blacklist']) {
                if (filterList[type]['SN8_blacklist'].indexOf(sn8) < 0) {
                  isSupport = true
                }
              } else {
                isSupport = true
              }
            }
          } else if (A0) {
            if (filterList[type]['A0']) {
              if (filterList[type]['A0_blacklist']) {
                if (filterList[type]['A0'].indexOf(A0) > -1 && filterList[type]['A0_blacklist'].indexOf(A0) < 0) {
                  isSupport = true
                }
              } else {
                if (filterList[type]['A0'].indexOf(A0) > -1) {
                  isSupport = true
                }
              }
            } else {
              if (filterList[type]['A0_blacklist']) {
                if (filterList[type]['A0_blacklist'].indexOf(A0) < 0) {
                  isSupport = true
                }
              } else {
                isSupport = true
              }
            }
          }
        } else {
          isSupport = true
        }
      }
      return isSupport
    },
  },
})
