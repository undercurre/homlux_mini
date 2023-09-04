import cryptoUtils from './remoterCrypto'
import remoterProtocol from './remoterProtocol'
import { isAndroid } from './app'
import { delay } from '../utils/index'
import { CMD } from '../config/remoter'

/**
 * @description 建立本地作为蓝牙[低功耗外围设备]的服务端
 */
export function createBleServer() {
  return new Promise<WechatMiniprogram.BLEPeripheralServer>((resolve, reject) => {
    wx.createBLEPeripheralServer({
      success(res) {
        console.log('BLE外围设备服务端创建成功', res)
        resolve(res.server)
      },
      fail(err) {
        console.error(err)
        reject(err)
      },
    })
  })
}

/**
 * TODO 区分安卓与IOS
 * @description 开始发送广播
 * @param server
 * @param params.addr 蓝牙地址
 * @param params.payload 发送数据
 * @param params.INTERVAL 广播时长
 */
export async function bleAdvertising(
  server: WechatMiniprogram.BLEPeripheralServer | null,
  params: { addr: string; payload: string; comId?: string; INTERVAL?: number },
) {
  const { addr, payload, comId = '0x4D11', INTERVAL = 800 } = params
  if (!server) {
    console.log('server is Not existed')
    return
  }
  const payloadEnd = remoterProtocol.generalCmdString(CMD.END)
  const manufacturerSpecificData = remoterProtocol.createAndroidBleRequest({ payload, addr })
  const serviceUuids = remoterProtocol.createIOSBleRequest({ payload, addr, comId })
  console.log('Android广播：', comId, cryptoUtils.ab2hex(manufacturerSpecificData).slice(0))
  console.log('IOS广播：', serviceUuids)

  const manufacturerSpecificDataEnd = remoterProtocol.createAndroidBleRequest({ payload: payloadEnd, addr })
  const serviceUuidsEnd = remoterProtocol.createIOSBleRequest({ payload: payloadEnd, addr, comId })

  const advertiseRequest = {} as WechatMiniprogram.AdvertiseReqObj
  const advertiseRequestEnd = {} as WechatMiniprogram.AdvertiseReqObj

  if (isAndroid()) {
    advertiseRequest.manufacturerData = [
      {
        manufacturerId: comId,
        manufacturerSpecificData,
      },
    ]
    advertiseRequestEnd.manufacturerData = [
      {
        manufacturerId: comId,
        manufacturerSpecificData: manufacturerSpecificDataEnd,
      },
    ]
  } else {
    advertiseRequest.serviceUuids = serviceUuids
    advertiseRequestEnd.serviceUuids = serviceUuidsEnd
  }

  // 需要连发多次指令以防丢包
  await startAdvertising(server, advertiseRequest)
  await delay(INTERVAL)
  await stopAdvertising(server)

  // 指令结束要发终止指令
  await startAdvertising(server, advertiseRequestEnd)
  await delay(INTERVAL)
  await stopAdvertising(server)
}

/**
 * @description 将server.startAdvertising封装为Promise
 * @param server
 * @param advertiseRequest
 */
export function startAdvertising(
  server: WechatMiniprogram.BLEPeripheralServer,
  advertiseRequest: WechatMiniprogram.AdvertiseReqObj,
) {
  return new Promise((resolve, reject) => {
    server.startAdvertising({
      powerLevel: 'high',
      advertiseRequest,
      success(res) {
        console.log('广播成功', res)
        resolve(res)
      },
      fail(err) {
        console.error(err)
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
export function stopAdvertising(server: WechatMiniprogram.BLEPeripheralServer) {
  return new Promise((resolve, reject) => {
    server.stopAdvertising({
      success(res) {
        console.log('广播停止成功', res)
        resolve(res)
      },
      fail(err) {
        console.error(err)
        reject(err)
      },
    })
  })
}
