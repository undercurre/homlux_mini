// import cryptoUtils from './remoterCrypto'
import remoterProtocol from './remoterProtocol'
import { hideLoading, isAndroid, showLoading } from './system'
import { delay, Logger } from '../utils/index'
import { CMD } from '../config/remoter'
import Toast from '@vant/weapp/toast/toast'

// 是否广播中
let isAdvertising = false

// 是否有可中断的广播进行中
let isAbortableAdvertising = false

// 建立BLE服务
let _bleServer = null as WechatMiniprogram.BLEPeripheralServer | null

/**
 * @description 建立本地作为蓝牙[低功耗外围设备]的服务端
 */
export function createBleServer() {
  return new Promise<WechatMiniprogram.BLEPeripheralServer>((resolve, reject) => {
    if (_bleServer) {
      Logger.log('重用已有的BLE服务')
      resolve(_bleServer)
      return
    }

    wx.createBLEPeripheralServer({
      success(res) {
        Logger.log('BLE外围设备服务端创建成功', res)
        _bleServer = res.server
        resolve(res.server)
      },
      fail(err) {
        Logger.error(err)
        reject(err)
      },
    })
  })
}

/**
 * @description 开始发送广播
 * @param server
 * @param params.addr 蓝牙地址
 * @param params.payload 发送数据
 * @param params.autoEnd 自动发送结束指令
 * @param params.INTERVAL 广播时长
 */
export async function bleAdvertising(
  server: WechatMiniprogram.BLEPeripheralServer | null,
  params: {
    addr: string
    payload: string
    comId?: string
    autoEnd?: boolean
    INTERVAL?: number
    isFactory?: boolean
    debug?: boolean
  },
) {
  const { addr, payload, comId = '0x4D11', INTERVAL = 600, autoEnd = true, isFactory, debug = false } = params
  if (!server) {
    Logger.log('[server is Not existed]')
    return
  }

  const advertiseRequest = {} as WechatMiniprogram.AdvertiseReqObj & { payload: string }

  if (isAndroid()) {
    const manufacturerSpecificData = remoterProtocol.createAndroidBleRequest({ payload, addr, isFactory })
    Logger.log('广播数据准备', comId, '时长', isAndroid() ? INTERVAL * 2 : INTERVAL) // , cryptoUtils.ab2hex(manufacturerSpecificData).slice(0)

    advertiseRequest.manufacturerData = [
      {
        manufacturerId: comId,
        manufacturerSpecificData,
      },
    ]
  } else {
    const serviceUuids = remoterProtocol.createIOSBleRequest({ payload, addr, comId, isFactory })
    Logger.log('开始广播')

    advertiseRequest.serviceUuids = serviceUuids
  }

  advertiseRequest.payload = payload

  // 需要连发多次指令以防丢包
  await startAdvertising(server, advertiseRequest, { vibrate: true, debug })
  await delay(isAndroid() ? INTERVAL * 2 : INTERVAL)

  // 自动终止控制指令广播，并发终止指令广播
  if (autoEnd) {
    await stopAdvertising(server, '指令广播自动终止')
    await bleAdvertisingEnd(server, { addr, isFactory, debug })
  }
}

/**
 * @description 发送终止指令的广播
 * @param server
 * @param params.addr 蓝牙地址
 * @param params.INTERVAL 保底的广播时长
 */
export async function bleAdvertisingEnd(
  server: WechatMiniprogram.BLEPeripheralServer,
  params: { addr: string; comId?: string; INTERVAL?: number; isFactory?: boolean; debug?: boolean },
) {
  const { addr, comId = '0x4D11', INTERVAL = 600, isFactory, debug = false } = params
  const payload = remoterProtocol.generalCmdString([CMD.END]) // 固定发这个指令
  const advertiseRequest = {} as WechatMiniprogram.AdvertiseReqObj & { payload: string }

  Logger.log('广播数据准备[0x00]')

  if (isAndroid()) {
    const manufacturerSpecificData = remoterProtocol.createAndroidBleRequest({ payload, addr, isFactory })

    advertiseRequest.manufacturerData = [
      {
        manufacturerId: comId,
        manufacturerSpecificData,
      },
    ]
  } else {
    const serviceUuids = remoterProtocol.createIOSBleRequest({ payload, addr, comId, isFactory })

    advertiseRequest.serviceUuids = serviceUuids
  }

  advertiseRequest.payload = payload

  // 需要连发多次指令以防丢包
  await startAdvertising(server, advertiseRequest, { vibrate: false, debug })
  await delay(INTERVAL)

  // 设置可被打断的标志
  isAdvertising = false
  isAbortableAdvertising = true

  // 无操作时发送更多的终止指令包确保下一次指令执行
  setTimeout(() => {
    // 如果未被打断过，则需要再停止一下
    if (isAbortableAdvertising) {
      stopAdvertising(server, '（此前0x00未被中断过终止）')
    }
  }, 2000)
}

/**
 * @description 将 server.startAdvertising 封装为Promise
 * @param server
 * @param advertiseRequest
 * @param option.vibrate 发指令时是否振动
 */
export async function startAdvertising(
  server: WechatMiniprogram.BLEPeripheralServer,
  advertiseRequest: WechatMiniprogram.AdvertiseReqObj & { payload: string },
  option: { vibrate?: boolean; debug?: boolean } = { vibrate: true, debug: false },
) {
  if (isAdvertising) {
    Logger.log('[Advertisng aborted by last one]')
    return
  } else if (isAbortableAdvertising) {
    await stopAdvertising(server, '（终止进行中的广播）')
    await delay(0)
    Logger.log('[Advertisng aborted by A new one]')
  }

  return new Promise((resolve, reject) => {
    isAdvertising = true

    // 振动逻辑放到有效广播后
    if (wx.vibrateShort && option.vibrate) wx.vibrateShort({ type: 'heavy' })

    server.startAdvertising({
      powerLevel: 'high',
      advertiseRequest,
      success(res) {
        Logger.log('广播中...', advertiseRequest.payload)
        if (option.debug && advertiseRequest.payload) {
          Toast(advertiseRequest.payload)
        }
        resolve(res)
      },
      fail(err) {
        Logger.error(err)
        reject(err)
      },
    })
  })
}

/**
 * @description 将server.startAdvertising封装为Promise
 * @param server
 * @param advertiseRequest
 */
export function stopAdvertising(server: WechatMiniprogram.BLEPeripheralServer, logs?: string) {
  return new Promise((resolve, reject) => {
    server.stopAdvertising({
      success(res) {
        Logger.log('停止广播成功', logs ?? '')
        resolve(res)
      },
      fail(err) {
        Logger.error(err)
        reject(err)
      },
      complete() {
        isAdvertising = false
        isAbortableAdvertising = false
      },
    })
  })
}

/**
 * 基于[连接]的低功耗蓝牙设备服务
 */
export class BleService {
  addr: string
  deviceId: string // 搜索到设备的 deviceId
  serviceId = ''
  characteristics = [] as WechatMiniprogram.BLECharacteristic[]
  isConnected = false
  receCallback: null | ((data: string) => void) = null
  connectStateCallback: null | ((isConnected: boolean) => void) = null

  constructor(device: { addr: string; deviceId: string }) {
    const { addr, deviceId } = device

    this.addr = addr
    this.deviceId = deviceId
  }

  // 建立连接
  async connect() {
    showLoading('正在建立蓝牙连接')
    const startTime = Date.now()

    Logger.log('lmn>>>', `${this.addr} 开始连接蓝牙`)

    // 会出现createBLEConnection一直没返回的情况（低概率）
    // 微信bug，安卓端timeout参数无效
    const connectRes = await wx
      .createBLEConnection({
        deviceId: this.deviceId,
        timeout: 10000,
      })
      .catch((err: WechatMiniprogram.BluetoothError) => err)

    const costTime = Date.now() - startTime
    Logger.log('lmn>>>', `${this.addr} connectRes `, connectRes, `连接蓝牙时间： ${costTime}ms`)

    hideLoading()

    // 判断是否连接蓝牙，0为连接成功，-1为已经连接
    // 避免-1的情况，因为安卓如果重复调用 wx.createBLEConnection 创建连接，有可能导致系统持有同一设备多个连接的实例，导致调用 closeBLEConnection 的时候并不能真正的断开与设备的连接。占用蓝牙资源
    if (connectRes.errCode !== 0 && connectRes.errCode !== -1) {
      return {
        code: -1,
        error: connectRes,
      }
    }

    wx.onBLEConnectionStateChange((res) => {
      if (res.deviceId == this.deviceId && this.connectStateCallback) this.connectStateCallback(res.connected)
    })

    // 新连接，未记录过服务ID
    const res = await wx
      .getBLEDeviceServices({
        deviceId: this.deviceId,
      })
      .catch((err) => {
        throw err
      })
    Logger.log('lmn>>>getBLEDeviceServices::res=', JSON.stringify(res))

    this.serviceId = res.services[0].uuid

    // 更新持久化记录
    // const _localList = (storage.get('_localList') ?? {}) as Remoter.LocalList
    // _localList[this.addr].serviceId = res.services[0].uuid
    // storage.set('_localList', _localList)

    return {
      code: 0,
      error: connectRes,
    }
  }

  async close() {
    showLoading('正在断开蓝牙连接')

    Logger.log(`${this.addr} ${this.deviceId} 开始关闭蓝牙连接`)
    const res = await wx.closeBLEConnection({ deviceId: this.deviceId }).catch((err) => err)

    // 存在调用关闭蓝牙连接指令和与设备蓝牙连接真正断开有时间差，强制等待1s
    await delay(1000)

    Logger.log(`${this.addr} closeBLEConnection`, res)
    hideLoading()
  }

  // 初始化蓝牙特征值
  async init() {
    // 未经连接步骤的初始化，从缓存中获取 serviceId
    // if (!this.serviceId) {
    //   const _localList = (storage.get('_localList') ?? {}) as Remoter.LocalList
    //   this.serviceId = _localList[this.addr].serviceId as string
    // }
    // IOS无法跳过该接口，否则后续接口会报10005	no characteristic	没有找到指定特征
    const characRes = await wx
      .getBLEDeviceCharacteristics({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
      })
      .catch((err) => {
        throw err
      })

    Logger.log('lmn>>>getBLEDeviceCharacteristics::', JSON.stringify(characRes))

    // 取第一个属性（固定，为可写可读可监听），不同品类的子设备的characteristicId不一样，同类的一样
    this.characteristics = characRes.characteristics
    this.initNotify()
  }

  initNotify() {
    const characteristic = this.characteristics.find((c) => c.properties.notify)
    if (!characteristic) {
      return
    }
    console.log('lmn>>>notiy uuid=', characteristic.uuid)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this
    wx.notifyBLECharacteristicValueChange({
      state: true,
      deviceId: this.deviceId,
      serviceId: this.serviceId,
      characteristicId: characteristic.uuid,
      success () {
        console.log('lmn>>>', '启用通知成功')
        wx.onBLECharacteristicValueChange((res) => {
          const binStr = that.ab2hex(res.value)
          console.log('lmn>>>rece data=', binStr)
          if (that.receCallback) that.receCallback(binStr)
        })
      }
    })
  }

  ab2hex(buffer: ArrayBuffer) {
    const hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function(bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  }
  
  registerReceCallback(fun: (data: string)=>void) {
    this.receCallback = fun
  }

  registerConnectState(fun: (isConnected: boolean)=>void) {
    this.connectStateCallback = fun
  }

  async sendCmd(payload: string) {
    const characteristic = this.characteristics.find((c) => c.properties.write)
    if (!characteristic) {
      return
    }
    console.log('lmn>>>sendCmd::payload bin=', payload)
    await wx
      .writeBLECharacteristicValue({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: characteristic.uuid,
        //value: remoterProtocol.createBluetoothProtocol(payload),
        value: remoterProtocol.createBluetoothProtocol({
          addr: this.addr,
          data: payload,
        }),
      })
      .catch((err) => {
        throw err
      })

    // 收到延迟，安卓平台上，在调用 wx.notifyBLECharacteristicValueChange 成功后立即调用本接口，在部分机型上会发生 10008 系统错误
    // if (isAndroid()) {
    //   await delay(500)
    // }
  }

  async readState() {
    const characteristic = this.characteristics.find((c) => c.properties.read)
    if (!characteristic) {
      return
    }

    const res = await wx
      .readBLECharacteristicValue({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: characteristic.uuid,
      })
      .catch((err) => {
        throw err
      })

    Logger.log('readBLECharacteristicValue', res)
  }
}
