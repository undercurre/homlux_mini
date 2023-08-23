import cryptoUtils from './remoterCrypto'
import remoterProtocol from './remoterProtocol'

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
 */
export function bleAdvertising(
  server: WechatMiniprogram.BLEPeripheralServer,
  params: { addr: string; payload: string; comId?: string },
) {
  const { addr, payload, comId = '0x4D11' } = params
  return new Promise((resolve, reject) => {
    const sequence = 1 //new Date().getTime()
    const manufacturerSpecificData = remoterProtocol.createAndroidBleRequest(`${addr}${payload}`, sequence)
    console.log('开始广播：', comId, cryptoUtils.ab2hex(manufacturerSpecificData).slice(0))

    server.startAdvertising({
      advertiseRequest: {
        manufacturerData: [
          {
            manufacturerId: remoterProtocol.getManufacturerId(true, comId!),
            manufacturerSpecificData,
          },
        ],
      },
      success(res) {
        console.log('广播结束', res)
        server.stopAdvertising()
        resolve(res)
      },
      fail(err) {
        console.error(err)
        reject(err)
      },
    })
  })
}
