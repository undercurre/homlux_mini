import cryptoUtils from './remoterCrypto'
import { DEFAULT_ENCRYPT, deviceConfig } from '../config/remoter'

// bit位定义
export const BIT_0 = 0x01 << 0 //1     0x01
export const BIT_1 = 0x01 << 1 //2     0x02
export const BIT_2 = 0x01 << 2 //4     0x04
export const BIT_3 = 0x01 << 3 //8     0x08
export const BIT_4 = 0x01 << 4 //16    0x10
export const BIT_5 = 0x01 << 5 //32    0x20
export const BIT_6 = 0x01 << 6 //64    0x40
export const BIT_7 = 0x01 << 7 //128    0x80

// 遥控器支持设备列表
const SUPPORT_LIST = Object.keys(deviceConfig)

/**
 * @description 小程序扫描蓝牙回调处理函数
 * @param manufacturerId 设备ID，
 */
const _searchDeviceCallBack = (device: WechatMiniprogram.BlueToothDevice) => {
  if (!device.advertisData) return
  const advertisData = cryptoUtils.ab2hex(device.advertisData)
  const manufacturerId = advertisData.slice(0, 4)
  const deviceType = manufacturerId.slice(2)
  //	筛选指定设备
  if (!SUPPORT_LIST.includes(deviceType.toLocaleUpperCase())) return
  const VBCV = advertisData.slice(4, 6)
  const encryptFlag = advertisData.slice(6, 8)
  const addr = advertisData.slice(8, 20)
  const deviceModel = advertisData.slice(20, 22)
  const payload = advertisData.slice(22) // 按调整后的协议，从第11字节开始

  return {
    fullAdvertistData: advertisData.slice(0),
    ...device,
    manufacturerId,
    deviceType,
    ..._parseVBCV(VBCV),
    ..._parseEncryptFlag(encryptFlag),
    addr,
    deviceModel,
    payload,
    deviceAttr: _parsePayload(payload, deviceType, deviceModel),
  }
}

//	解析 version,btp,src,connect,visibility
const _parseVBCV = (vbcvHexStr: string) => {
  //	16进制字符串转为2进制,补全8位
  const vbcvBinary = parseInt(vbcvHexStr, 16).toString(2).padStart(8, '0')
  const version = parseInt(vbcvBinary.slice(0, 4), 2)
  const src = +vbcvBinary[4]
  const BTP = !!+vbcvBinary[5]
  const connect = !!+vbcvBinary[6]
  const visibility = !!+vbcvBinary[7]
  return {
    version,
    src,
    BTP,
    connect,
    visibility,
  }
}
//	解析 encrypt_flag
const _parseEncryptFlag = (encryptFlag: string) => {
  const hexStr = parseInt(encryptFlag, 16).toString(2).padStart(8, '0')
  const encryptType = parseInt(hexStr.slice(0, 4), 2)
  const encryptIndex = parseInt(hexStr.slice(4), 2)
  return {
    encryptType,
    encryptIndex,
  }
}

/**
 * @name 转换设备状态
 * @description
 * @returns key 命名须与 src\config\remoter.ts 中的 actions.key 保持一致
 */
const _parsePayload = (payload: string, deviceType: string, deviceModel?: string) => {
  const rxBuf = new ArrayBuffer(payload.length) // 申请内存
  const rxU16 = new Uint16Array(rxBuf)
  for (let i = 0; i < payload.length / 2; ++i) {
    rxU16[i] = parseInt(payload.slice(i * 2, i * 2 + 2), 16)
  }
  if (deviceType === '13') {
    // 共有属性
    const res: IAnyObject = {
      LIGHT_LAMP: !!(rxU16[0] & BIT_0), // 开关
      COLORTEMP_MIN: (rxU16[1] << 8) + rxU16[2], // 色温最小值
      COLORTEMP_MAX: (rxU16[3] << 8) + rxU16[4], // 色温最大值
      LIGHT_BRIGHT: rxU16[5], // 当前亮度
      LIGHT_COLOR_TEMP: rxU16[6], // 当前色温
    }
    // 不同灯的专有属性
    if (deviceModel === '01') {
      res.DELAY_OFF = rxU16[7] // 延时关灯剩余分钟数，0表示延时关灯失效
      res.LIGHT_NIGHT_LAMP = rxU16[8] === 0x06 // 小夜灯状态，0x06代表开启
    } else if (deviceModel === '02') {
      res.DELAY_OFF = (rxU16[7] << 8) + rxU16[8] // 延时关风扇剩余分钟数
      res.FAN_SWITCH = !!(rxU16[9] & BIT_0) // 风扇开关状态
      res.FAN_NEGATIVE = !!(rxU16[9] & BIT_1) // 风扇是否反转状态
      res.FAN_NATURE = !!(rxU16[9] & BIT_2) // 风扇自然风状态
      res.SPEED = rxU16[10] // 风扇档位
    }
    return res
  }
  if (deviceType === '26') {
    return {
      BATH_WARM: !!(rxU16[4] & BIT_5),
      BATH_WIND: !!(rxU16[4] & BIT_2),
      BATH_VENTILATE: !!(rxU16[4] & BIT_1),
      BATH_DRY: !!(rxU16[4] & BIT_0),
      BATH_LAMP: !!(rxU16[1] & BIT_0),
    }
  }
  return {}
}

//	创建蓝牙连接发送协议
const _createBluetoothProtocol = (params: { addr: string; data: string; opcode?: number }) => {
  const { addr, opcode = 0x0b, data } = params
  //	1. len
  const commandData = [0x00]

  //	2. sequence,opcode
  const encryptIndex = Math.round(Math.random() * 15)
  const sequenceOpcode = parseInt(encryptIndex.toString(2) + opcode.toString(2), 2)
  commandData.push(sequenceOpcode)

  //	3. encrypt data
  const encrytpedData = cryptoUtils.enCodeData(data, addr, encryptIndex)
  console.log('蓝牙协议 加密后的数据:', encrytpedData)
  commandData.push(...encrytpedData)

  //	4. set length =>  payload length
  commandData[0] = commandData.length - 2
  console.log('commandData', commandData, commandData.length)

  //	5. create buffer
  const buffer = new ArrayBuffer(commandData.length)
  const dataView = new DataView(buffer)
  for (let i = 0; i < commandData.length; i++) {
    dataView.setInt8(i, commandData[i])
  }
  return buffer
}

/**
 * @description 按发送协议拼接数据
 * @param params.isEncrypt 是否加密
 * @param params.isFactory 是否工厂产测模式，模拟实体遥控器
 */
const createBleProtocol = (params: { payload: string; addr: string; isEncrypt?: boolean; isFactory?: boolean }) => {
  const { payload, addr, isEncrypt = DEFAULT_ENCRYPT, isFactory = false } = params
  // 第一个字节
  const version = '0001'
  const src = isFactory ? 0 : 1 // 0:设备发出  1:手机发出
  const BTP = 0 // 不分包
  const connected = 0
  const visibility = 1 // 设备可见
  const VBCV = parseInt(`${version}${src}${BTP}${connected}${visibility}`, 2)

  // 第二个字节
  const encryptType = isEncrypt ? '0001' : '0000'
  const encryptIndex = Math.round(Math.random() * 15)
  const encryptIndexBin = encryptIndex.toString(2).padStart(4, '0')
  const dataArr = [VBCV, parseInt(`${encryptType}${encryptIndexBin}`, 2)]

  // addr
  for (let i = 0; i < addr.length; i += 2) {
    dataArr.push(parseInt(addr.slice(i, i + 2), 16))
  }

  // 不加密则直接返回
  if (!isEncrypt) {
    for (let i = 0; i < payload.length; i += 2) {
      dataArr.push(parseInt(payload.slice(i, i + 2), 16))
    }
  }
  // encode payload
  else {
    const channel = parseInt(payload.slice(0, 2))
    const encrytpedData = cryptoUtils.enCodeData(payload.slice(2), addr, encryptIndex)
    // console.log(
    //   '加密后的数据',
    //   encrytpedData.map((b) => b.toString(16)),
    // )
    dataArr.push(channel, ...encrytpedData)
  }
  console.log('dataArr', dataArr)

  // const buffer = new ArrayBuffer(dataArr.length)
  // const dataView = new DataView(buffer)
  // for (let i = 0; i < dataArr.length; i++) {
  //   dataView.setInt8(i, dataArr[i])
  // }
  return dataArr
}

/**
 * 创建安卓广播数据
 * @returns
 */
const _createAndroidBleRequest = (params: { payload: string; addr: string; isFactory?: boolean }): Uint8Array => {
  const { payload, addr, isFactory } = params
  const manufacturerData = createBleProtocol({ payload, addr, isFactory })
  // console.log('manufacturerData', manufacturerData)
  const commandData = new Uint8Array(manufacturerData.length)
  commandData.set(manufacturerData)
  return commandData
}

/**
 * 创建 ios 广播数据
 * 拼接在 advertiseRequest.serviceUuids
 * @param data string[]
 * @param comId string
 * @returns string[]
 */
const _createIOSBleRequest = (params: {
  payload: string
  addr: string
  comId: string
  isFactory?: boolean
}): string[] => {
  const { payload, addr, comId, isFactory } = params

  const manufacturerId = comId.slice(2)
  const manufacturerData = createBleProtocol({ payload, addr, isFactory })
  const arrayData: string[] = []
  arrayData.push(manufacturerId)
  for (let i = 0; i < manufacturerData.length; i += 2) {
    const hex1 = manufacturerData[i].toString(16).padStart(2, '0')
    const hex2 = (manufacturerData[i + 1] ?? '00').toString(16).padStart(2, '0')
    arrayData.push(hex2.concat(hex1))
  }
  return arrayData
}

/**
 * 解析蓝牙特征值变化上报
 */
const _handleBluetoothResponse = (response: string, addr: string) => {
  const len = parseInt(response.slice(0, 2), 16)
  const seqOpcode = parseInt(response.slice(2, 4), 16).toString(2).padStart(8, '0')
  const sequence = parseInt(seqOpcode.slice(0, 4), 2)
  const opCode = parseInt(seqOpcode.slice(4), 2)
  const payload = response.slice(4, len * 2 + 2)
  const decryptData = cryptoUtils
    .enCodeData(payload, addr, sequence)
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('')
  return {
    opCode,
    decryptData,
  }
}
/**
 * 解析轻智能上报
 */
const _handleBleResponse = (response: string) => {
  const { encryptIndex } = _parseEncryptFlag(response.slice(6, 8))
  const addr = response.slice(8, 20)
  const payload = response.slice(20)
  const decryptData = cryptoUtils
    .enCodeData(payload, addr, encryptIndex)
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('')
  return {
    decryptData: response.slice(0, 20) + decryptData,
  }
}

/**
 * 根据电控协议生成设备指令
 */
// const _generalCmdString = (key: number) => {
//   const channel = 0x01 // 通道，固定值
//   const version = 0x01 // 协议版本
//   const cmdType = 0x00 // 命令号
//   const sum = (channel + version + cmdType + key) % 256
//   const data = [channel, version, cmdType, key]
//   // 其余字节预留，默认0x00
//   for (let i = 4; i <= 14; ++i) {
//     data[i] = 0x00
//   }
//   data.push(sum)
//   return data.map((byte) => byte.toString(16).padStart(2, '0')).join('')
// }

/**
 * 根据电控协议生成控制指令
 * cmdType 命令号。灯协议，固定为0x00，实际上未使用；浴霸协议，控制键值为0x00，参数设置0x01；故统一按浴霸规则发送
 */
const _generalCmdString = (values: number[]) => {
  console.log('_generalCmdString', values)
  const channel = 0x01 // 通道，固定值
  const version = 0x01 // 协议版本
  const cmdType = values.length > 1 ? 0x01 : 0x00
  let sum = channel + version + cmdType
  const data = [channel, version, cmdType, ...values]
  for (const v of values) {
    sum += v
  }
  // 其余字节预留，默认0x00
  for (let i = 3 + values.length; i <= 14; ++i) {
    data[i] = 0x00
  }
  data.push(sum % 256)
  return data.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export default {
  searchDeviceCallBack: _searchDeviceCallBack,
  createAndroidBleRequest: _createAndroidBleRequest,
  createIOSBleRequest: _createIOSBleRequest,
  createBluetoothProtocol: _createBluetoothProtocol,
  handleBluetoothResponse: _handleBluetoothResponse,
  handleBleResponse: _handleBleResponse,
  generalCmdString: _generalCmdString,
}
