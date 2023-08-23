import cryptoUtils from './remoterCrypto'

/**
 * @description 小程序扫描蓝牙回调处理函数
 * @param comId 企业ID，TODO 默认暂为CA0A，需要与设备电控同步改为4D11
 */
const _searchDeviceCallBack = (device: WechatMiniprogram.BlueToothDevice, comId = 'CA0A') => {
  if (!device.advertisData) return
  const advertisData = cryptoUtils.ab2hex(device.advertisData)
  const compid = advertisData.slice(0, 4)
  //	筛选指定设备
  if (!compid.toLocaleUpperCase().includes(comId)) return
  const advData = _parseAdvertisData(advertisData.slice(4))
  return {
    advertisDataStr: advertisData.slice(0),
    ...device,
    ...advData,
  }
}
//	解析 advertisData
const _parseAdvertisData = (advertisDataStr: string) => {
  const VBCV = advertisDataStr.slice(0, 2)
  const { version, fromDevice, BTP, connect, visibility } = _parseVBCV(VBCV)
  const encryptFlag = advertisDataStr.slice(2, 4)
  const { encryptType, encryptIndex } = _parseEncryptFlag(encryptFlag)
  const addr = advertisDataStr.slice(4, 16)
  const payload = advertisDataStr.slice(16)
  return {
    version,
    fromDevice,
    BTP,
    connect,
    visibility,
    encryptType,
    encryptIndex,
    addr,
    payload,
  }
}
//	解析 version,btp.src,connect,visibility
const _parseVBCV = (vbcvHexStr: string) => {
  //	16进制字符串转为2进制,补全8位
  const vbcvBinary = parseInt(vbcvHexStr, 16).toString(2).padStart(8, '0')
  const version = parseInt(vbcvBinary.slice(0, 4), 2)
  const fromDevice = !!+vbcvBinary[4]
  const BTP = !+vbcvBinary[5]
  const connect = !+vbcvBinary[6]
  const visibility = !+vbcvBinary[7]
  return {
    version,
    fromDevice,
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
  const encrytpedData = cryptoUtils.enCodeData(data, addr, sequence, false)
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

//	创建轻智能发送协议
const createBleProtocol = (params: { data: string; addr: string; sequence: number }) => {
  const { data, addr, sequence = 0 } = params
  //	1. set version, src, placeholder
  const version = parseInt('0001' + '1000', 2)
  //	2. set sequence
  const header = [version, parseInt('0001' + sequence.toString(2).padStart(4, '0'), 2)]
  //	3. set addr
  for (let i = 0; i < addr.length; i += 2) {
    header.push(parseInt(addr.slice(i, i + 2), 16))
  }
  //	4. encode payload
  const encrytpedData = cryptoUtils.enCodeData(data, addr, sequence)
  console.log('加密后的数据', encrytpedData)

  header.push(...encrytpedData)
  return header
}

/**
 * 创建 安卓 轻智能广播数据
 * 拼接在 advertiseRequest.manufacturerData [{
 *  	manufacturerId: getManufacturerId(true, '0xxxxx'),
 * 		manufacturerSpecificData: _createAndroidBleRequest()
 * }]
 * @returns
 */
const _createAndroidBleRequest = (data: string, sequence: number): Uint8Array => {
  //	1. get addr
  const addr = data.slice(0, 12)
  //	2. get payload
  const payload = data.slice(12)
  const manufacturerData = createBleProtocol({ data: payload, addr, sequence })
  // console.log('manufacturerData', manufacturerData)
  const commandData = new Uint8Array(manufacturerData.length)
  commandData.set(manufacturerData)
  return commandData
}

/**
 * 创建 ios 轻智能广播数据
 * 拼接在 advertiseRequest.serviceUuids
 * @param data string[]
 * @param compid string
 * @returns string[]
 */
const _createIOSBleRequest = (data: string, sequence: number, compid: string): string[] => {
  //	1. get addr
  const addr = data.slice(0, 12)
  //	2. get payload
  const payload = data.slice(12)
  //	3. concat data
  const manufacturerId = _getManufacturerId(false, compid)
  const manufacturerData = createBleProtocol({ data: payload, addr, sequence })
  const arrayData: string[] = []
  arrayData.push(manufacturerId)
  for (let i = 0; i < manufacturerData.length; i += 2) {
    const hex1 = manufacturerData[i].toString(16).padStart(2, '0')
    const hex2 = (manufacturerData[i + 1] ?? '00').toString(16).padStart(2, '0')
    arrayData.push(hex2.concat(hex1))
  }
  if (arrayData.length < 13) {
    const testData = ['1bee', '78c8', '4af6', '1344', '9744', '1b61', '7c72', '4746', '23c2', '795b', '85c2', '7a36']
    arrayData.push(...testData.slice(0, 13 - arrayData.length))
  }
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
    .enCodeData(payload, addr, sequence, false)
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

export default {
  searchDeviceCallBack: _searchDeviceCallBack,
  createAndroidBleRequest: _createAndroidBleRequest,
  createIOSBleRequest: _createIOSBleRequest,
  getManufacturerId: _getManufacturerId,
  createBluetoothProtocol: _createBluetoothProtocol,
  handleBluetoothResponse: _handleBluetoothResponse,
  handleBleResponse: _handleBleResponse,
}
