import { mzaiotRequest } from '../utils/index'

/**
 * 根据设备Id获取设备明细
 */
export async function queryDeviceInfoByDeviceId(params: { deviceId: string; houseId: string; roomId: string }) {
  // 	"onlineStauts": 在线离线状态(0:离线1:在线
  return await mzaiotRequest.post<{
    deviceId: string
    deviceName: string
    gatewayName: string
    pic: string
    roomName: string
    version: string
  }>({
    log: false,
    loading: true,
    url: '/v1/device/queryDeviceInfoByDeviceId',
    data: params,
  })
}

/**
 * 查询设备在线离线状态
 */
export async function queryDeviceOnlineStatus(params: { deviceType: string; sn: string }) {
  // 	"onlineStauts": 在线离线状态(0:离线1:在线
  return await mzaiotRequest.post<{ deviceId: string; onlineStatus: number }>({
    log: false,
    loading: false,
    url: '/v1/device/queryDeviceOnlineStatus',
    data: params,
  })
}

/**
 * 配网-绑定
 */
export async function bindDevice(params: {
  houseId?: string
  roomId?: string
  sn?: string
  deviceId?: string
  deviceName: string
}) {
  return await mzaiotRequest.post<{ isBind: boolean; msg: string }>({
    log: false,
    loading: true,
    url: '/v1/device/bindDevice',
    data: params,
  })
}
