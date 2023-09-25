//扫设备二维码 一维码 能效二维码 触屏动态二维码 非智设备码 进入配网

const app = getApp() //获取应用实例

import { clickEventTracking } from '../track/track.js'
import { hasKey, getStamp, getReqId } from 'm-utilsdk/index'
import { getFullPageUrl, showToast } from './util.js'
import { addDeviceSDK } from './addDeviceSDK'
import { requestService } from './requestService'
import { isSupportPlugin } from './pluginFilter'
import { isAddDevice } from './temporaryNoSupDevices'
import { linkDevice, virtualPlugin, newPlugin, webView } from './paths'
import { rangersBurialPoint } from './requestService'
import { commonH5Api } from '../api'
import Dialog from '../miniprogram_npm/m-ui/mx-dialog/dialog'
const paths = require('./paths')
const brandConfig = app.globalData.brandConfig[app.globalData.brand]

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
  /**
   * 5s搜不到设备点击二维码 跳转指引
   */
  clickScanHint: () => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_add_device',
      page_name: '添加设备页',
      widget_id: 'click_word_try_scanning',
      widget_name: '搜索不到设备尝试扫码提示',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
    })
  },
}

/**
 * @param {*} showNotSupport  扫描的二维码不适于添加设备弹窗方法
 * @param {*} justAppSupport  扫描的二维码仅在美居app支持弹窗方法
 * @param {*} actionGoNetwork  进入配网方法
 * @param {*} getDeviceApImgAndName 获取设备的图片和名字
 * @param {*} homegroupId 用户当前家庭的id
 * @param {*} homeName 用户当前家庭的名称
 * @returns
 */
export async function actionScanResult(
  showNotSupport,
  justAppSupport,
  actionGoNetwork,
  getDeviceApImgAndName,
  homegroupId,
  homeName,
) {
  trackClickScan()

  let scanRes = ''
  try {
    scanRes = await scanCode()
  } catch (error) {
    console.log('微信扫码失败=========', error)
    scanFailTracking({
      fialReason: '微信扫码接口调用异常',
      errorCode: error,
    })
  }

  if (!scanRes.result) {
    getApp().setMethodFailedCheckingLog('wx.scanCode()', `该二维码无法识别。scanRes=${JSON.stringify(scanRes)}`)
    return
  }

  // charSet: "UTF-8"
  // codeVersion: 5
  // errMsg: "scanCode:ok"
  // rawData: "aHR0cDovL3FyY29kZS5taWRlYS5jb20vbWlkZWFfZTMvaW5kZXguaHRtbD9jZD1lRFN1c2t4VXQxYVozUDB4LXpiOXFNWEdRMGgxLURkSm1Fc2Z2MndKJlNTSUQ9bWlkZWFfZTNfMDAzNg=="
  // result: "http://qrcode.midea.com/midea_e3/index.html?cd=eDSuskxUt1aZ3P0x-zb9qMXGQ0h1-DdJmEsfv2wJ&SSID=midea_e3_0036"
  // scanType: "QR_CODE"

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
    actionOneOrEnergyCode(scanRes, '一维码', showNotSupport, justAppSupport, actionGoNetwork)
    return
  }

  if (scanRes.result.includes('el.bbqk.com')) {
    //扫码的类型是能效二维码
    actionOneOrEnergyCode(scanRes, '能效二维码', showNotSupport, justAppSupport, actionGoNetwork)
    return
  }

  if (addDeviceSDK.dynamicCodeAdd.isDeCodeDynamicCode(scanRes.result)) {
    //触屏动态二维码
    dynamicCodeAdd(scanRes.result, getDeviceApImgAndName, showNotSupport, justAppSupport)
    return
  }

  wx.showLoading() //解析等待loading
  let scanCodeRes = scanRes.result
  if (scanCodeRes) {
    const map = ['3', '5', '0', '100', '103']
    let result = scanCodeRes.replace(/\s*/g, '') //移除空格
    //如果链接里没有mode，补上默认mode=0
    if (!result.includes('mode=')) {
      result = result + '&mode=0'
    }
    const urlType = checkUrlType(result)
    const ifMideaQrcode = checkUrlQrcode(result)
    console.log('扫码成功返回', urlType, ifMideaQrcode, result)

    const isIntelligentDevice = checkIntelligentDevice(result)
    const isIntelligentDevices = checkIntelligentDevices(result)

    // 如果是非智能设备跳转非智设备虚拟插件页
    if (isIntelligentDevice) {
      wx.hideLoading()
      //非智统一修改为不支持弹框提示
      Dialog.confirm({
        title: '该二维码无法识别，请扫描机身上携带“智能产品”标识的二维码',
        confirmButtonText: '查看指引',
        confirmButtonColor: brandConfig.dialogStyle.confirmButtonColor,
        cancelButtonColor: brandConfig.dialogStyle.cancelButtonColor3,
        cancelButtonText: '取消',
      })
        .then((res) => {
          if (res.action == 'confirm') {
            clickQRcodeGuide()
          }
          // on confirm
        })
        .catch(() => {
          if (error.action == 'cancel') {
          }
          // on cancel
        })
      return
      wx.hideLoading()
      wx.redirectTo({
        url: `${virtualPlugin}?q=${encodeURIComponent(result)}&id=${homegroupId}&homeName=${homeName}&orgFrom=2`,
      })
      getApp().setMethodFailedCheckingLog('isIntelligentDevice', '跳转非智插件页')
      return
    }

    // 跳转最新的虚拟插件页
    if (isIntelligentDevices) {
      wx.hideLoading()
      //非智统一修改为不支持弹框提示
      Dialog.confirm({
        title: '该二维码无法识别，请扫描机身上携带“智能产品”标识的二维码',
        confirmButtonText: '查看指引',
        confirmButtonColor: brandConfig.dialogStyle.confirmButtonColor,
        cancelButtonColor: brandConfig.dialogStyle.cancelButtonColor3,
        cancelButtonText: '取消',
      })
        .then((res) => {
          if (res.action == 'confirm') {
            clickQRcodeGuide()
          }
          // on confirm
        })
        .catch(() => {
          if (error.action == 'cancel') {
          }
          // on cancel
        })
      return
      wx.hideLoading()
      wx.redirectTo({
        url: `${newPlugin}?q=${encodeURIComponent(result)}&id=${homegroupId}&homeName=${homeName}&orgFrom=2`,
      })
      getApp().setMethodFailedCheckingLog('isIntelligentDevices', '跳转新的非智插件页')
      return
    }

    if (!ifMideaQrcode) {
      wx.hideLoading()
      console.log('非midead 不支持')
      showNotSupport()
      scanCodeNotSupportTracking({}, '此二维码不适用于添加设备', scanCodeRes)
      getApp().setMethodFailedCheckingLog('actionScan', '此二维码不适用于添加设备')
      return
    }

    if (ifMideaQrcode && !urlType) {
      wx.hideLoading()
      justAppSupport()
      scanCodeNotSupportTracking({}, '非美的合规的二维码', scanCodeRes)
      getApp().setMethodFailedCheckingLog('actionScan', '非美的合规的二维码')
      return
    }

    let data = {}
    if (urlType && result.includes('cd=')) {
      //美的的密文二维码
      try {
        let decodeRes = await scanCodeDecode(result)
        console.log('二维码解密接口返回======', decodeRes)
        data.category = decodeRes.deviceType
        data.mode = addDeviceSDK.getMode(decodeRes.mode)
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
        scanFailTracking({
          fialReason: '解密接口调用失败',
          errorCode: error,
        })
      }
    } else {
      data = getUrlParamy(result)
    }
    console.log('扫码解析出来数据', data)
    data.mode = data.mode || 0 //mode不存在 默认0
    if (data.mode.toString() === '999') {
      wx.hideLoading()
      console.log('扫码 不支持 非智能设备')
      showNotSupport()
      scanCodeNotSupportTracking(
        {
          type: data.category,
          sn8: data.sn8,
        },
        '非智能设备不支持小程序配网',
        scanCodeRes,
      )
      getApp().setMethodFailedCheckingLog('actionScan', '非智能设备不支持小程序配网')
      return
    }
    if (!map.includes((data.mode + '').toString())) {
      wx.hideLoading()
      console.log('扫码 不支持 的配网方式')
      justAppSupport()
      scanCodeNotSupportTracking(
        {
          type: data.category,
          sn8: data.sn8,
        },
        '小程序暂时不支持的配网方式',
        scanCodeRes,
      )
      getApp().setMethodFailedCheckingLog('actionScan', '小程序暂时不支持的配网方式')
      return
    }
    let formatType = '0x' + data.category.toLocaleUpperCase()
    if (!isSupportPlugin(formatType, data.sn8)) {
      wx.hideLoading()
      console.log('扫码 不支持 无对应插件')
      justAppSupport()
      scanCodeNotSupportTracking(
        {
          type: data.category,
          sn8: data.sn8,
        },
        '该品类无对应插件不支持小程序配网',
        scanCodeRes,
      )
      getApp().setMethodFailedCheckingLog('actionScan', '该品类无对应插件不支持小程序配网')
      return
    }
    const addDeviceInfo = getAddDeviceInfo(data)
    if (addDeviceInfo.moduleType == 0 && addDeviceInfo.category != 'C0') {
      console.log('扫码 不支持 特殊品类不支持')
      justAppSupport()
      scanCodeNotSupportTracking(
        {
          type: data.category,
          sn8: data.sn8,
        },
        '该特殊品类不支持小程序配网',
        scanCodeRes,
      )
      getApp().setMethodFailedCheckingLog('actionScan', "该特殊品类不支持小程序配网'")
      return
    }
    if (!isAddDevice(data.category.toLocaleUpperCase(), data.sn8)) {
      wx.hideLoading()
      console.log('扫码 不支持 未测试')
      justAppSupport()
      scanCodeNotSupportTracking(
        {
          type: data.category,
          sn8: data.sn8,
        },
        '未测试品类不支持小程序配网',
        scanCodeRes,
      )
      getApp().setMethodFailedCheckingLog('actionScan', "未测试品类不支持小程序配网'")
      return
    }
    wx.hideLoading()
    trackScanResult(result, addDeviceSDK.getLinkType(data.mode))
    // 扫码成功时不执行自发现，防止扫码跳转后异常执行自发现
    app.globalData.ifBackFromScan = true

    actionGoNetwork(addDeviceInfo)
  }
}

//调取扫一扫 获取扫码的结果
function scanCode() {
  return new Promise((resolve, reject) => {
    wx.scanCode({
      success(res) {
        console.log('扫码结果', res)
        resolve(res)
      },
      fail(error) {
        console.log('扫码失败返回', error)
        reject(error)
      },
      complete() {
        trackViewScan()
      },
    })
  })
}

//扫描一维码或能效二维码配网
async function actionOneOrEnergyCode(scanRes, codeType, showNotSupport, justAppSupport, actionGoNetwork) {
  wx.showLoading() //解析等待loading
  let scanCodeGuide = null
  try {
    scanCodeGuide = await isScanCodeGuide(scanRes.result)
    wx.hideLoading()
  } catch (error) {
    wx.hideLoading()
    scanFailTracking({
      fialReason: '能效码、一维码查询调用失败',
      errorCode: error,
    })
    showNotSupport()
    getApp().setMethodFailedCheckingLog(
      'actionOneOrEnergyCode',
      `${JSON.stringify(codeType)}解析失败,error=${JSON.stringify(error)}`,
    )
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

  const map = ['3', '5', '0', '100']

  if (data.mode.toString() === '999') {
    console.log('扫码 不支持 非智能设备')
    showNotSupport()
    return
  }

  if (!map.includes((data.mode + '').toString())) {
    console.log('扫码 不支持 的配网方式')
    justAppSupport()
    return
  }

  let formatType = '0x' + data.category.toLocaleUpperCase()

  if (!isSupportPlugin(formatType, data.sn8)) {
    console.log('扫码 不支持 无对应插件')
    justAppSupport()
    return
  }

  if (!isAddDevice(data.category.toLocaleUpperCase(), data.sn8)) {
    console.log('扫码 不支持 未测试')
    justAppSupport()
    return
  }

  const deviceInfo = getAddDeviceInfo(data)
  deviceInfo.enterprise = enterpriseCode
  deviceInfo.guideInfo = scanCodeGuide
  if (deviceInfo.moduleType == 0 && data.category != '0F') {
    console.log('扫码 不支持 特殊品类不支持')
    justAppSupport()
    return
  }

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
      link_type: addDeviceSDK.getLinkType(data.mode), //连接方式 bluetooth/ap/...
      iot_device_id: '', //设备id
    },
    ext_info: {
      qrcode_type: codeType, //码类型（一维码/能效二维码）
    },
  })

  // 扫码成功时不执行自发现，防止扫码跳转后异常执行自发现
  app.globalData.ifBackFromScan = true

  actionGoNetwork(deviceInfo)
}

//触屏动态二维码逻辑
function dynamicCodeAdd(scanCodeRes, getDeviceApImgAndName, showNotSupport, justAppSupport) {
  let scanCdoeResObj = addDeviceSDK.dynamicCodeAdd.getTouchScreenScanCodeInfo(scanCodeRes)
  console.log('dynamic Code Add info:', scanCdoeResObj)
  if (scanCdoeResObj.verificationCode && scanCdoeResObj.verificationCodeKey) {
    //有验证码信息
    let deviceNameAndImg = getDeviceApImgAndName(app.globalData.dcpDeviceImgList, scanCdoeResObj.type.toUpperCase())
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
    // 动态扫码绑定添加白名单过滤逻辑
    let formatType = '0x' + addDeviceInfo.type.toLocaleUpperCase()
    let sn8 = addDeviceInfo.sn && addDeviceInfo.sn.substring(9, 17)
    addDeviceInfo.sn8 = addDeviceInfo.sn8 ? addDeviceInfo.sn8 : sn8
    if (!isSupportPlugin(formatType, sn8)) {
      console.log('扫码 不支持 无对应插件')
      justAppSupport()
      return
    }

    if (!isAddDevice(addDeviceInfo.type.toLocaleUpperCase(), sn8)) {
      console.log('扫码 不支持 未测试')
      justAppSupport()
      return
    }
    wx.showModal({
      title: '',
      content: `你正在添加${app.addDeviceInfo.deviceName},确定要继续吗？`,
      cancelText: '取消',
      cancelColor: '#267AFF',
      confirmText: '确定',
      confirmColor: '#267AFF',
      success(res) {
        if (res.confirm) {
          //确定
          wx.navigateTo({
            url: linkDevice,
          })
          burialPoint.touchScreenDiologConfirm({
            deviceSessionId: app.globalData.deviceSessionId,
            type: type,
            sn: sn,
          })
        } else if (res.cancel) {
          //取消
          burialPoint.touchScreenDiologCancel({
            deviceSessionId: app.globalData.deviceSessionId,
            type: type,
            sn: sn,
          })
        }
      },
    })
  } else {
    wx.showModal({
      title: '',
      content: '该二维码无法识别，请扫描设备屏幕二维码',
      confirmText: '我知道了',
      confirmColor: '#267AFF',
      showCancel: false,
      success(res) {
        if (res.confirm) {
          //知道了
          burialPoint.touchScreenDiologCancel({
            deviceSessionId: app.globalData.deviceSessionId,
            type: app.addDeviceInfo.type,
            sn: app.addDeviceInfo.sn,
          })
        }
      },
    })
    scanFailTracking({
      fialReason: '大屏扫码解析失败',
      errorCode: -1,
    })
    getApp().setMethodFailedCheckingLog('dynamicCodeAdd', '触屏配网生成二维码，无法识别')
  }
}

//扫码是否有配网指引
function isScanCodeGuide(scanCodeRes) {
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
        console.log('扫码请求返回指引为resp', resp)
        resolve(resp)
      })
      .catch((error) => {
        console.log(error)
        reject(error)
      })
  })
}

//获取扫描的二维码链接参数
function getUrlParamy(result) {
  const map = ['mode', 'type', 'tsn', 'type', 'v', 'SSID', 'dsn', 'ssid']
  if (
    (result.includes('//qrcode.midea.com') && result.includes('mode') && result.includes('type')) ||
    result.includes('dsn')
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
      let key = item.split('=')[0]
      let value = item.split('=')[1]
      if (map.includes(key)) {
        obj[key] = value
        if (key == 'type') {
          const type = value
          obj.category = compatibleType(type.slice(4, 6))
          const len = type.length
          obj.sn8 = type.slice(len - 8)
        } else if (key == 'mode') {
          obj[key] = addDeviceSDK.getMode(value)
        } else if (key == 'dsn') {
          obj.category = compatibleType(value.slice(4, 6))
          obj.sn8 = value.substring(9, 17)
        }
      }
    })
    return obj
  }
}

//解析品类兼容
function compatibleType(type) {
  if (type == '00' || type == 'AB') {
    //空调特殊转化
    type = 'ac'
  }
  return type.toLocaleUpperCase()
}

//处理设备信息
function getAddDeviceInfo(data) {
  const moduleType = getModuleType(data)
  const mode = hasKey(data, 'mode') ? addDeviceSDK.getMode(data.mode) : ''
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
    SSID: getSsid(data),
    sn: hasKey(data, 'sn') ? data.sn : '',
  }
  return addDeviceInfo
}

//获取设备moduleType
function getModuleType(item) {
  if (item.mode == 3 || item.mode == '003') return '1'
  if (item.mode == 5 || item.mode == '005') return '0'
}

//检查 二维码链接是否是美的设备二维码
function checkUrlType(result) {
  let tag = false
  if (
    result.includes(brandConfig.qrcode || '//qrcode.midea.com') &&
    result.includes('mode') &&
    result.includes('type')
  ) {
    tag = true
  }
  if (result.includes(brandConfig.qrcode || '//qrcode.midea.com') && result.includes('cd=')) {
    //美的密文二维码支持
    tag = true
  }
  if (result.includes('www.midea.com') && result.includes('cd=')) {
    //美的密文二维码支持
    tag = true
  }
  if (
    result.includes(brandConfig.qrcode || '//qrcode.midea.com') &&
    (result.includes('v=5') || result.includes('V=5')) &&
    result.includes('dsn=')
  ) {
    //美的V5版本的新标准二维码
    tag = true
  }
  return tag
}

//检查 扫描的二维码链接是否是美的设备的
function checkUrlQrcode(result) {
  let tag = false
  if (result.includes(brandConfig.qrcode || '//qrcode.midea.com')) {
    tag = true
  }
  if (result.includes('www.midea.com')) {
    tag = true
  }
  return tag
}

// 校验非智能链接，微清还是生电的链接
function checkIntelligentDevice(result) {
  let tag = false
  if (
    result.includes('//www.smartmidea.net') &&
    (result.includes('/projects/sit/mini-qrcode/') || result.includes('/projects/mini-qrcode/'))
  ) {
    tag = true
  }
  return tag
}

// 校验最新标准非智能链接
function checkIntelligentDevices(result) {
  let tag = false
  if (
    (result.includes('//qrcode.midea.com/test/qrcode') || result.includes('//qrcode.midea.com/NI/')) &&
    (result.includes('tsn') || result.includes('dsn') || result.includes('type'))
  ) {
    tag = true
  }
  return tag
}

//获取设备ssid
function getSsid(data) {
  if (data.ssid) return data.ssid
  if (data.SSID) return data.SSID
  return ''
}

//密文二维码扫码解析
function scanCodeDecode(qrCode, timeout = 3000) {
  let resq = {
    qrCode: qrCode,
    reqId: getReqId(),
    stamp: getStamp(),
  }
  return new Promise((resolve, reject) => {
    requestService
      .request('scancodeDecode', resq, 'POST', '', timeout)
      .then((resp) => {
        console.log('密文二维码扫码解析', resp.data.data)
        resolve(resp.data.data)
      })
      .catch((error) => {
        console.log('密文二维码扫码解析error', error)
        reject(error)
      })
  })
}

//扫描结果埋点
function trackScanResult(result, linkType) {
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
}

//扫码不支持埋点
function scanCodeNotSupportTracking(deviceInfo, errorMsg, scanCodeRes) {
  clickEventTracking('user_page_view', 'scanCodeNotSuppotr', {
    device_info: {
      device_session_id: app.globalData.deviceSessionId, //一次配网事件标识
      sn: '', //sn码
      sn8: deviceInfo.sn8 || '', //sn8码
      a0: '', //a0码
      widget_cate: deviceInfo.type || '', //设备品类
      wifi_model_version: '', //模组wifi版本
      link_type: '', //连接方式 bluetooth/ap/...
      iot_device_id: '', //设备id
    },
    ext_info: {
      error_msg: errorMsg || '',
      url: scanCodeRes,
    },
  })
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

//扫描调出预览埋点
function trackViewScan() {
  clickEventTracking('user_page_view', 'trackViewScan', {
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

// 扫码失败埋点
function scanFailTracking(params) {
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
}
// 点击跳转机身二维码指引
function clickQRcodeGuide() {
  burialPoint.clickScanHint()
  jumpQRcodeGuide()
}
function jumpQRcodeGuide() {
  const brandConfig = app.globalData.brandConfig[app.globalData.brand]
  const guideUrl =
    brandConfig.QRcodeGuideUrl ||
    `${paths.webView}?webViewUrl=${encodeURIComponent(
      `${commonH5Api.url}deviceQrCode.html`,
    )}&pageTitle=如何找到设备的二维码`
  wx.navigateTo({
    url: guideUrl,
  })
}
