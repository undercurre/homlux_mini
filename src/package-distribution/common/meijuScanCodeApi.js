/* eslint-disable @typescript-eslint/no-var-requires */
//扫设备二维码 一维码 能效二维码 触屏动态二维码 非智设备码 进入配网

import { hasKey } from 'm-utilsdk/index'

//配网方式list
const modeList = {
  0: 'ap',
  1: '快连',
  2: '声波配网',
  3: '蓝牙配网',
  4: '零配',
  5: '单蓝牙',
  6: 'zebee网关',
  7: '网线',
  8: 'NB - IOT',
  9: 'Msmart - lite协议',
  17: '数字遥控器配网',
  10: '本地蓝牙直连',
  20: '家用协议直连',
  21: '家用协议配网',
  30: 'msmart 直连', //小程序自定义
  31: 'msmart 直连后做wifi绑定', //小程序自定义
  100: '动态二维码(触屏配网)',
  101: 'zebee网关 + 手机蓝牙',
  102: '蓝牙网关 + 手机蓝牙',
  103: '大屏账号绑定',
  104: '蓝牙网关 + zebee网关 + 手机蓝牙',
  998: '客方配网',
  999: '非智能设备',
}

/**
 * 获取美的二维码扫码结果
 * @returns
 */
export function actionScanResult(scanCodeRes) {
  const scanResult = {
    success: false,
    msg: '',
    deviceInfo: {
      category: '',
      sn8: '',
      mode: 0,
    },
  }

  wx.showLoading() //解析等待loading
  const map = ['3', '5', '0', '100', '103']
  let result = scanCodeRes.replace(/\s*/g, '') //移除空格
  //如果链接里没有mode，补上默认mode=0
  if (!result.includes('mode=')) {
    result = result + '&mode=0'
  }
  const urlType = checkUrlType(result)
  const ifMideaQrcode = checkUrlQrcode(result)
  console.log('扫码成功返回', urlType, ifMideaQrcode, result)

  // 此二维码不适用于添加设备
  if (!ifMideaQrcode) {
    wx.hideLoading()
    scanResult.msg = '二维码无法识别' // 该二维码无法识别，请扫描机身上携带“智能产品”标识的二维码
    return scanResult
  }

  // 非美的合规的二维码   该设备暂不支持小程序配网，我们会尽快开放，敬请期待
  if (ifMideaQrcode && !urlType) {
    wx.hideLoading()
    scanResult.msg = '非美的合规的二维码'
    return scanResult
  }

  let data = {}
  // 密文二维码扫码解析 接口不支持
  if (urlType && !result.includes('cd=')) {
    data = getUrlParamy(result)
  }
  console.debug('扫码解析出来数据', data)
  data.mode = data.mode || 0 //mode不存在 默认0
  if (data.mode.toString() === '999') {
    wx.hideLoading()
    scanResult.msg = '扫码 不支持 非智能设备'
    return scanResult
  }
  if (!map.includes((data.mode + '').toString())) {
    wx.hideLoading()
    scanResult.msg = '扫码 不支持 的配网方式'
    return scanResult
  }
  const addDeviceInfo = getAddDeviceInfo(data)
  if (addDeviceInfo.moduleType == 0 && addDeviceInfo.category !== 'C0') {
    scanResult.msg = '扫码 不支持 特殊品类不支持'
    return scanResult
  }
  wx.hideLoading()
  // 扫码成功时不执行自发现，防止扫码跳转后异常执行自发现
  // app.globalData.ifBackFromScan = true

  scanResult.success = true
  scanResult.deviceInfo = addDeviceInfo

  return scanResult
}

//获取扫描的二维码链接参数
function getUrlParamy(result) {
  const map = ['mode', 'type', 'tsn', 'type', 'v', 'SSID', 'dsn', 'ssid']
  if (
    (result.includes('//qrcode.midea.com') && result.includes('mode') && result.includes('type')) ||
    result.includes('dsn')
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
    let obj = {}
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
          obj[key] = getMode(value)
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
  const mode = hasKey(data, 'mode') ? getMode(data.mode) : ''
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

//获取设备mode
function getMode(mode) {
  if (mode == '003') {
    return 3
  } else if (mode == '005') {
    return 5
  } else if (mode == '000' || mode == '001' || mode == '1') {
    //001 1 的mode临时转为ap配网
    return 0
  } else if (mode == '' || !Object.keys(modeList).includes(mode.toString())) {
    //mode为空 或者不规则都转为ap配网
    return 0
  }
  return mode
}

//检查 二维码链接是否是美的设备二维码
export function checkUrlType(result) {
  let tag = false
  if (result.includes('//qrcode.midea.com') && result.includes('mode') && result.includes('type')) {
    tag = true
  }
  if (result.includes('//qrcode.midea.com') && result.includes('cd=')) {
    //美的密文二维码支持
    tag = true
  }
  if (result.includes('www.midea.com') && result.includes('cd=')) {
    //美的密文二维码支持
    tag = true
  }
  if (
    result.includes('//qrcode.midea.com') &&
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
  if (result.includes('//qrcode.midea.com')) {
    tag = true
  }
  if (result.includes('www.midea.com')) {
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
