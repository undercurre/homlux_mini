import cryptoUtils from './remoterCrypto'
import { deviceConfig } from '../config/remoter'

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
  const advData = _parseAdvertisData(advertisData.slice(4))
  return {
    fullAdvertistData: advertisData.slice(0),
    manufacturerId,
    deviceType,
    ...device,
    ...advData,
  }
}
//	解析 advertisData
const _parseAdvertisData = (advertisDataStr: string) => {
  const VBCV = advertisDataStr.slice(0, 2)
  const encryptFlag = advertisDataStr.slice(2, 4)
  const addr = advertisDataStr.slice(4, 16)
  const payload = advertisDataStr.slice(16)
  const deviceModel = advertisDataStr.slice(16, 18)
  return {
    ..._parseVBCV(VBCV),
    ..._parseEncryptFlag(encryptFlag),
    deviceModel,
    addr,
    payload,
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

//	创建蓝牙发送协议
const _createBluetoothProtocol = (params: { sequence: number; addr: string; data: string; opcode?: number }) => {
  const { sequence, addr, opcode = 0x0b, data } = params
  //	1. len
  const commandData = [0x00]
  //	2. sequence,opcode
  const sequenceOpcode = parseInt(sequence.toString(2) + opcode.toString(2), 2)
  commandData.push(sequenceOpcode)
  //	3. encrypt data
  const encrytpedData = cryptoUtils.enCodeData(data, addr, sequence)
  console.log('蓝牙协议 加密后的数据:', encrytpedData)
  commandData.push(...encrytpedData)
  //	4. set length =>  payload length
  commandData[0] = commandData.length - 2
  //	5. create buffer
  console.log('commandData length', commandData.length)
  const buffer = new ArrayBuffer(commandData.length)
  const dataView = new DataView(buffer)
  for (let i = 0; i < commandData.length; i++) {
    dataView.setInt8(i, commandData[i])
  }
  return buffer
}

/**
 * @description 按播发送协议拼接数据
 * @param params.isEncrypt 是否加密
 */
const createBleProtocol = (params: { payload: string; addr: string; isEncrypt?: boolean }) => {
  const { payload, addr, isEncrypt = true } = params
  // 第一个字节
  const version = '0001'
  const src = 1 // 手机发出
  const BTP = 0 // 不分包
  const connected = 0
  const visibility = 1 // 设备可见
  const VBCV = parseInt(`${version}${src}${BTP}${connected}${visibility}`, 2)

  // 第二个字节
  const encryptType = isEncrypt ? '0001' : '0000'
  const encryptIndex = 0 // Math.round(Math.random() * 15)
  const encryptIndexBin = encryptIndex.toString(2).padStart(4, '0')
  const advData = [VBCV, parseInt(`${encryptType}${encryptIndexBin}`, 2)]

  // addr
  for (let i = 0; i < addr.length; i += 2) {
    advData.push(parseInt(addr.slice(i, i + 2), 16))
  }

  // 不加密则直接返回
  if (!isEncrypt) {
    for (let i = 0; i < payload.length; i += 2) {
      advData.push(parseInt(payload.slice(i, i + 2), 16))
    }
    return advData
  }

  // encode payload
  const channel = parseInt(payload.slice(0, 2))
  const encrytpedData = cryptoUtils.enCodeData(payload.slice(2), addr, encryptIndex)
  console.log(
    '加密后的数据',
    encrytpedData.map((b) => b.toString(16)),
  )

  advData.push(channel, ...encrytpedData)
  return advData
}

/**
 * 创建安卓广播数据
 * 拼接在 advertiseRequest.manufacturerData [{
 *  	manufacturerId: getManufacturerId(true, '0xxxxx'),
 * 		manufacturerSpecificData: _createAndroidBleRequest()
 * }]
 * @returns
 */
const _createAndroidBleRequest = (params: { payload: string; addr: string }): Uint8Array => {
  const { payload, addr } = params
  const manufacturerData = createBleProtocol({ payload, addr })
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
const _createIOSBleRequest = (params: { payload: string; addr: string; comId: string }): string[] => {
  const { payload, addr, comId } = params

  const manufacturerId = comId.slice(2)
  const manufacturerData = createBleProtocol({ payload, addr })
  const arrayData: string[] = []
  arrayData.push(manufacturerId)
  for (let i = 0; i < manufacturerData.length; i += 2) {
    const hex1 = manufacturerData[i].toString(16).padStart(2, '0')
    const hex2 = (manufacturerData[i + 1] ?? '00').toString(16).padStart(2, '0')
    arrayData.push(hex2.concat(hex1))
  }
  // if (arrayData.length < 13) {
  //   const testData = ['1bee', '78c8', '4af6', '1344', '9744', '1b61', '7c72', '4746', '23c2', '795b', '85c2', '7a36']
  //   arrayData.push(...testData.slice(0, 13 - arrayData.length))
  // }
  return arrayData
}

/**
 * 根据手机系统获取 compid
 * @param isAndroid
 * @param compid
 * @returns
 */
const _getManufacturerId = (isAndroid: boolean, compid: string) => {
  return isAndroid ? compid : compid.slice(2)
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
 * 根据电控协议生成设备指令数据
 */
const _generalCmdString = (key: number) => {
  const channel = 0x01
  const version = 0x01
  const sequence = 0x00
  const sum = (channel + version + sequence + key) % 256
  const data = [channel, version, sequence, key]
  // Byte4...Byte14 预留，默认0x00
  for (let i = 4; i <= 14; ++i) {
    data[i] = 0x00
  }
  data.push(sum)
  return data.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export default {
  searchDeviceCallBack: _searchDeviceCallBack,
  createAndroidBleRequest: _createAndroidBleRequest,
  createIOSBleRequest: _createIOSBleRequest,
  getManufacturerId: _getManufacturerId,
  createBluetoothProtocol: _createBluetoothProtocol,
  handleBluetoothResponse: _handleBluetoothResponse,
  handleBleResponse: _handleBleResponse,
  generalCmdString: _generalCmdString,
}
