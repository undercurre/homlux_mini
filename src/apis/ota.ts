import { mzaioRequest } from '../utils/index'

interface OtaUpdateList {
  otaProductList: {
    /** 设备列表 */
    deviceList: string[]
    /** 产品icon */
    icon: string
    /** 产品id */
    productId: string
    /** 产品名称 */
    productName: string
    /** ota更新状态 */
    updateStatus: number
    /** ota固件版本 */
    version: string
    /** 版本描述 */
    versionDesc: string
  }[]
  otaUpdateList: {
    deviceId: string
    deviceName: string
    gatewayId: string
    otaMd5: string
    otaProductId: string
    otaUpdateStatus: number
    pic: string
    roomName: string
    updateVersion: string
    updateVersionUrl: string
    version: string
    versionDesc: string
  }[]
}

/**
 * 全屋设备是否有OTA版本更新
 */
export async function queryDeviceOtaUpdateList(houseId: string) {
  return await mzaioRequest.post<OtaUpdateList>({
    log: false,
    loading: true,
    url: '/v1/device/queryDeviceOtaUpdateList',
    data: {
      houseId,
    },
  })
}
