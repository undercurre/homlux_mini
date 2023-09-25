/**
 * 扫码服务接口
 */
const app = getApp()
import { requestService } from '../../../../utils/requestService'
import { hasKey, getStamp, getReqId } from 'm-utilsdk/index'
import { getFullPageUrl, showToast } from '../../../../utils/util.js'
import { clickEventTracking } from '../../../../track/track.js'
import { scanCode } from '../core/scanCode.js'
import { addDeviceService } from '../../../../pages/common/sdk/common/addDeviceService'
import { deviceImgMap } from '../../../../utils/deviceImgMap'
import { deviceImgApi } from '../../../../api'
import { rangersBurialPoint } from '../../../../utils/requestService'
const WX_LOG = require('../../../../utils/log')
import { config } from '../../../../pages/common/sdk/config'
var scanCodeService = {
  /**
   * 扫码接口
   * {
    "errMsg": "scanCode:ok", 
    "result": "http://qrcode.midea.com/index.html?v=3&type=0000C0…10F&mode=005&tsn=0000C03116420010F152421000071YK6", 
    "scanType": "QR_CODE", 
    "charSet": "ISO8859-1", 
    "rawData": "aHR0cDovL3FyY29kZS5taWRlYS5jb20vaW5kZXguaHRtbD92PT…0c249MDAwMEMwMzExNjQyMDAxMEYxNTI0MjEwMDAwNzFZSzY="
    }
   */
  async actionScanResult() {
    trackClickScan()
    let scanRes = ''
    try {
      scanRes = await scanCode.scanCode()
      WX_LOG.info('微信扫码成功', 'scanCode.scanCode', scanRes)
    } catch (error) {
      WX_LOG.error('微信扫码失败', 'scanCode.scanCode', error)
    }

    if (!scanRes.result) {
      WX_LOG.error('该二维码无法识别', 'scanCode.scanCode', scanRes)
      return
    }

    let scanType = [
      'AZTEC',
      'CODABAR',
      'CODE_39',
      'CODE_93',
      'CODE_128',
      'EAN_8',
      'EAN_13',
      'ITF',
      'MAXICODE',
      'RSS_14',
      'RSS_EXPANDED',
      'UPC_A',
      'UPC_E',
      'UPC_EAN_EXTENSION',
      'CODE_25',
    ] //一维码类型

    if (scanType.includes(scanRes.scanType)) {
      //扫码的类型是一维码
      this.returnNotSupport() //todo:Yoram暂时屏蔽一维码入口
      let deviceInfo = this.actionOneOrEnergyCode(scanRes, '一维码')
      return deviceInfo
    }

    if (scanRes.result.includes('el.bbqk.com')) {
      //扫码的类型是能效二维码
      this.returnNotSupport() //todo:Yoram暂时屏蔽二维码入口
      let deviceInfo = this.actionOneOrEnergyCode(scanRes, '能效二维码')
      return deviceInfo
    }

    if (addDeviceService.dynamicCodeAdd.isDeCodeDynamicCode(scanRes.result)) {
      //触屏动态二维码
      let deviceInfo = this.dynamicCodeAdd(scanRes.result)
      return deviceInfo
    }

    wx.showLoading() //解析等待loading
    let scanCodeRes = scanRes.result
    if (scanCodeRes) {
      const result = scanCodeRes.replace(/\s*/g, '') //移除空格
      const urlType = this.checkUrlType(result)
      const urlQrcode = this.checkUrlQrcode(result)
      //todo:yoram 处理不支持的urlQrcode,将不支持的标志位返回调用方
      if (!urlQrcode) {
        let returnObj = {
          showNotSupport: true,
        }
        wx.hideLoading()
        return returnObj
      }
      let data = {}
      if (urlType && result.includes('cd=')) {
        //美的的密文二维码
        try {
          let decodeRes = await scanCode.scanCodeDecode(result)
          console.log('二维码解密接口返回======', decodeRes)
          data.category = decodeRes.deviceType
          data.mode = addDeviceService.getMode(decodeRes.mode)
          data.sn8 = decodeRes.sn8
          data.ssid = decodeRes.ssid
          data.tsn = decodeRes.tsn ? decodeRes.tsn : ''
          data.sn = decodeRes.sn ? decodeRes.sn : ''
          console.log('scancodeDecode=========', data)
        } catch (error) {
          wx.hideLoading()
          if (error?.data?.code && error.data.code == 1) {
            showToast(error.data.msg, 'none', 3000)
          } else {
            showToast('当前网络信号不佳，请检查网络设置', 'none', 3000)
          }
          console.log('解密接口调用失败=========', error)
          this.scanFailTracking({
            fialReason: '解密接口调用失败',
            errorCode: error,
          })
        }
      } else {
        data = this.getUrlParamy(result)
      }
      console.log('扫码解析出来数据', data)

      const addDeviceInfo = this.getAddDeviceInfo(data)

      wx.hideLoading()
      this.trackScanResult(result, addDeviceService.getLinkType(data.mode))

      return addDeviceInfo
    }
  },
  //扫描一维码或能效二维码配网
  async actionOneOrEnergyCode(scanRes, codeType) {
    wx.showLoading() //解析等待loading
    let scanCodeGuide = null
    try {
      scanCodeGuide = await this.isScanCodeGuide(scanRes.result)
      WX_LOG.info('能效码、一维码查询成功', scanCodeGuide)
      wx.hideLoading()
    } catch (error) {
      wx.hideLoading()
      this.scanFailTracking({
        fialReason: '能效码、一维码查询调用失败',
        errorCode: error,
      })
      WX_LOG.error('能效码、一维码查询失败', error)
      return
    }

    let { mode, code } = scanCodeGuide.data.data.mainConnectinfoList[0]
    let { category, enterpriseCode } = scanCodeGuide.data.data

    let data = {
      category: category,
      mode: mode,
      sn8: code,
      ssid: '',
    }

    const deviceInfo = this.getAddDeviceInfo(data)
    deviceInfo.enterprise = enterpriseCode
    deviceInfo.guideInfo = scanCodeGuide

    const result = scanRes.result.replace(/\s*/g, '') //移除空格
    clickEventTracking('user_behavior_event', 'trackScanResult', {
      object_id: result.replace(/\u0026/g, '&'),
      device_info: {
        device_session_id: app.globalData.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: '', //sn8码
        a0: '', //a0码
        widget_cate: '', //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: addDeviceService.getLinkType(data.mode), //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
      ext_info: {
        qrcode_type: codeType, //码类型（一维码/能效二维码）
      },
    })
    return deviceInfo
  },
  //触屏动态二维码逻辑
  dynamicCodeAdd(scanCodeRes) {
    let scanCdoeResObj = addDeviceService.dynamicCodeAdd.getTouchScreenScanCodeInfo(scanCodeRes)
    console.log('dynamic Code Add info:', scanCdoeResObj)
    if (scanCdoeResObj.verificationCode && scanCdoeResObj.verificationCodeKey) {
      //有验证码信息
      let deviceNameAndImg = this.getDeviceApImgAndName(
        app.globalData.dcpDeviceImgList,
        scanCdoeResObj.type.toUpperCase(),
      )
      let addDeviceInfo = {
        mode: 100, //触屏配网mode
        type: scanCdoeResObj.type.toUpperCase(),
        sn: scanCdoeResObj.sn,
        bigScreenScanCodeInfo: scanCdoeResObj,
        deviceName: deviceNameAndImg.deviceName,
        deviceImg: deviceNameAndImg.deviceImg,
      }
      app.addDeviceInfo = addDeviceInfo
      let { type, sn } = app.addDeviceInfo
      burialPoint.touchScreenDiolog({
        deviceSessionId: app.globalData.deviceSessionId,
        type: type,
        sn: sn,
        msg: '触屏配网扫码成功',
      })

      return addDeviceInfo
      //业务逻辑
      // wx.showModal({
      //   title: '',
      //   content: `你正在添加${app.addDeviceInfo.deviceName},确定要继续吗？`,
      //   cancelText: '取消',
      //   cancelColor: '#267AFF',
      //   confirmText: '确定',
      //   confirmColor: '#267AFF',
      //   success(res) {
      //     if (res.confirm) {
      //       //确定
      //       wx.navigateTo({
      //         url: linkDevice,
      //       })
      //       burialPoint.touchScreenDiologConfirm({
      //         deviceSessionId: app.globalData.deviceSessionId,
      //         type: type,
      //         sn: sn,
      //       })
      //     } else if (res.cancel) {
      //       //取消
      //       burialPoint.touchScreenDiologCancel({
      //         deviceSessionId: app.globalData.deviceSessionId,
      //         type: type,
      //         sn: sn,
      //       })
      //     }
      //   },
      // })
    } else {
      //业务逻辑
      // wx.showModal({
      //   title: '',
      //   content: '该二维码无法识别，请扫描设备屏幕二维码',
      //   confirmText: '我知道了',
      //   confirmColor: '#267AFF',
      //   showCancel: false,
      //   success(res) {
      //     if (res.confirm) {
      //       //知道了
      //       burialPoint.touchScreenDiologCancel({
      //         deviceSessionId: app.globalData.deviceSessionId,
      //         type: app.addDeviceInfo.type,
      //         sn: app.addDeviceInfo.sn,
      //       })
      //     }
      //   },
      // })
      this.scanFailTracking({
        fialReason: '大屏扫码解析失败',
        errorCode: -1,
      })
      getApp().setMethodFailedCheckingLog('dynamicCodeAdd', '触屏配网生成二维码，无法识别')
      WX_LOG.error('触屏配网生成二维码，无法识', 'dynamicCodeAdd')
      return scanCdoeResObj
    }
  },
  //扫码是否有配网指引
  isScanCodeGuide(scanCodeRes) {
    let resq = {
      qrcode: scanCodeRes,
      queryType: 3,
      stamp: getStamp(),
      reqId: getReqId(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('multiNetworkGuide', resq)
        .then((resp) => {
          WX_LOG.info('扫码请求配网指引成功', 'multiNetworkGuide')
          resolve(resp)
        })
        .catch((error) => {
          WX_LOG.error('扫码请求配网指引失败', 'multiNetworkGuide', error)
          reject(error)
        })
    })
  },
  //扫一扫调出弹出埋点
  trackClickScan() {
    clickEventTracking('user_behavior_event', 'trackClickScan', {
      device_info: {
        device_session_id: app.globalData.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: '', //sn8码
        a0: '', //a0码
        widget_cate: '', //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },
  // 扫码失败埋点
  scanFailTracking(params) {
    clickEventTracking('user_behavior_event', '', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_scan_add_appliance',
      page_name: '扫码添加设备页',
      object_type: '',
      widget_id: 'popups_scan_qrcode_fail',
      widget_name: '扫码失败',
      ext_info: {
        fail_reason: params.fialReason,
        error_code: params.errorCode,
      },
    })
  },
  //处理设备信息
  getAddDeviceInfo(data) {
    const moduleType = this.getModuleType(data)
    const mode = hasKey(data, 'mode') ? addDeviceService.getMode(data.mode) : ''
    const addDeviceInfo = {
      isFromScanCode: true,
      deviceName: '',
      deviceId: '', //设备蓝牙id
      mac: '', //设备mac 'A0:68:1C:74:CC:4A'
      category: hasKey(data, 'category') ? data.category : '', //设备品类 AC
      sn8: hasKey(data, 'sn8') ? data.sn8 : '',
      deviceImg: '', //设备图片
      moduleType: moduleType, //模组类型 0：ble 1:ble+weifi
      blueVersion: '', //蓝牙版本 1:1代  2：2代
      mode: mode,
      tsn: hasKey(data, 'tsn') ? data.tsn : '',
      fm: 'scanCode',
      SSID: this.getSsid(data),
      sn: hasKey(data, 'sn') ? data.sn : '',
    }
    return addDeviceInfo
  },
  //检查 二维码链接是否是美的设备二维码
  checkUrlType(result) {
    let tag = false
    if (result.includes(config.qrcode) && result.includes('mode') && result.includes('type')) {
      tag = true
    }
    if (result.includes(config.qrcode) && result.includes('cd=')) {
      //美的密文二维码支持
      tag = true
    }
    if (result.includes('www.midea.com') && result.includes('cd=')) {
      //美的密文二维码支持
      tag = true
    }
    return tag
  },
  //检查 扫描的二维码链接是否是美的设备的
  checkUrlQrcode(result) {
    let tag = false
    if (result.includes(config.qrcode)) {
      tag = true
    }
    if (result.includes('www.midea.com')) {
      tag = true
    }
    return tag
  },
  // 扫码失败埋点
  scanFailTracking(params) {
    clickEventTracking('user_behavior_event', '', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_scan_add_appliance',
      page_name: '扫码添加设备页',
      object_type: '',
      widget_id: 'popups_scan_qrcode_fail',
      widget_name: '扫码失败',
      ext_info: {
        fail_reason: params.fialReason,
        error_code: params.errorCode,
      },
    })
  },
  //获取扫描的二维码链接参数
  getUrlParamy(result) {
    const map = ['mode', 'type', 'tsn', 'type', 'v', 'SSID', 'dsn']
    if (
      result.includes(config.qrcode) &&
      result.includes('mode') &&
      (result.includes('dsn') || result.includes('type'))
    ) {
      const res = result.split('?')[1]
      let list = new Array()
      let paramy = new Array()
      if (res.includes(';')) {
        list = res.split(';')
        console.log('paramy11111111', list)
        list.forEach((item) => {
          let itemList = new Array()

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
        if (map.includes(item.split('=')[0])) {
          obj[item.split('=')[0]] = item.split('=')[1]
          if (item.split('=')[0] == 'type' || item.split('=')[0] == 'dsn') {
            const type = item.split('=')[1]
            obj.category = this.compatibleType(type.slice(4, 6))
            const len = type.length
            if (config.qrcode.indexOf('tsqrcode') > -1) {
              obj.sn8 = type.slice(9, 17)
            } else {
              obj.sn8 = type.slice(len - 8)
            }
          } else if (item.split('=')[0] == 'mode') {
            obj[item.split('=')[0]] = addDeviceService.getMode(item.split('=')[1])
          }
        }
      })
      return obj
    }
  },
  //扫描结果埋点
  trackScanResult(result, linkType) {
    clickEventTracking('user_behavior_event', 'trackScanResult', {
      object_id: result.replace(/\u0026/g, '&'),
      device_info: {
        device_session_id: app.globalData.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: '', //sn8码
        a0: '', //a0码
        widget_cate: '', //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: linkType, //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },
  getDeviceApImgAndName(dcpDeviceImgList, category) {
    let item = new Object()
    console.log('获取图标命名称1', dcpDeviceImgList, category)
    if (dcpDeviceImgList[category]) {
      item.deviceImg = dcpDeviceImgList[category].common
    } else {
      console.log('没找到', deviceImgMap)
      if (deviceImgMap[category]) {
        item.deviceImg = deviceImgApi.url + 'blue_' + category.toLocaleLowerCase() + '.png'
      } else {
        item.deviceImg = deviceImgApi.url + 'blue_default_type.png'
      }
    }
    if (deviceImgMap[category]) {
      const filterObj = deviceImgMap[category]
      item.deviceName = filterObj.title
    } else {
      item.deviceName = ''
    }
    console.log('获取图标命名称2', item)
    return item
  },
  //获取设备ssid
  getSsid(data) {
    if (data.ssid) return data.ssid
    if (data.SSID) return data.SSID
    return ''
  },
  //解析品类兼容
  compatibleType(type) {
    if (type == '00' || type == 'AB') {
      //空调特殊转化
      type = 'ac'
    }
    return type.toLocaleUpperCase()
  },
  //获取设备moduleType
  getModuleType(item) {
    if (item.mode == 3 || item.mode == '003') return '1'
    if (item.mode == 5 || item.mode == '005') return '0'
  },
  //不支持的类型，返回不支持的flag
  returnNotSupport() {
    let returnObj = {
      showNotSupport: true,
    }
    wx.hideLoading()
    return returnObj
  },
}
//触屏配网相关埋点
const burialPoint = {
  /**
   * 触屏配网提示绑定弹窗
   */
  touchScreenDiolog: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_add_appliance_notice',
      page_name: '设备添加提示弹窗',
      widget_id: '',
      widget_name: '',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        code: params.code || '',
        msg: params.msg || '',
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison || '', //模组wifi版本
        link_type: 'screen_touch', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 点击触屏配网弹窗 是
   */
  touchScreenDiologConfirm: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_add_appliance_notice',
      page_name: '设备添加提示弹窗',
      widget_id: 'click_confirm',
      widget_name: '是',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison || '', //模组wifi版本
        link_type: 'screen_touch', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 点击触屏配网弹窗 否
   */
  touchScreenDiologCancel: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_add_appliance_notice',
      page_name: '设备添加提示弹窗',
      widget_id: 'click_cancel',
      widget_name: '否',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison || '', //模组wifi版本
        link_type: 'screen_touch', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 触屏配网扫码失败 点击知道了
   */
  touchScreenDiologClickKnow: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_scan_qrcode_fail',
      page_name: '扫码失败弹窗',
      widget_id: 'click_confirm',
      widget_name: '好的',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison || '', //模组wifi版本
        link_type: 'screen_touch', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },
}
//扫一扫调出弹出埋点
function trackClickScan() {
  clickEventTracking('user_behavior_event', 'trackClickScan', {
    device_info: {
      device_session_id: app.globalData.deviceSessionId, //一次配网事件标识
      sn: '', //sn码
      sn8: '', //sn8码
      a0: '', //a0码
      widget_cate: '', //设备品类
      wifi_model_version: '', //模组wifi版本
      link_type: '', //连接方式 bluetooth/ap/...
      iot_device_id: '', //设备id
    },
  })
}

module.exports = {
  scanCodeService,
}
