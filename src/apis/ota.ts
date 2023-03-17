import { mzaioRequest } from '../utils/index'

/**
 * 全屋设备是否有OTA版本更新
 */
export async function queryDeviceOtaUpdateList(houseId: string) {
  return await mzaioRequest.post<{ otaProductList: Ota.OtaProduct[]; otaUpdateList: Ota.OtaUpdate[] }>({
    log: false,
    loading: false,
    url: '/v1/device/queryDeviceOtaUpdateList',
    data: {
      houseId,
    },
  })
}

export async function execOtaUpdate(data: { deviceOtaList: Ota.DeviceOtaUpdateReqDTO[] }) {
  return await mzaioRequest.post<{ otaProductList: Ota.OtaProduct[]; otaUpdateList: Ota.OtaUpdate[] }>({
    log: false,
    loading: true,
    url: '/v1/device/deviceOtaUpdate',
    data,
  })
}
