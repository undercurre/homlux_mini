import { mzaiotRequest } from '../utils/index'

/**
 * 全屋设备是否有OTA版本更新
 */
export async function queryDeviceOtaUpdateList(houseId: string) {
  return await mzaiotRequest.post<Device.DeviceItem[]>({
    log: false,
    loading: true,
    url: '/v1/device/queryDeviceOtaUpdateList',
    data: {
      houseId,
    },
  })
}
