import { mzaiotRequest } from '../utils/index'

/**
 * 根据家庭id房间id查询房间所有设备
 */
export async function getDeviceList(houseId: string, roomId: string) {
  return await mzaiotRequest.post<User.UserLoginRes>({
    log: true,
    loading: true,
    url: '/v1/device/queryDeviceInfoByRoomId',
    data: {
      houseId,
      roomId,
    },
  })
}

/**
 * 根据家庭id房间id查询房间除了网关的子设备
 */
export async function getSubDeviceList(houseId: string, roomId: string) {
  return await mzaiotRequest.post<User.UserLoginRes>({
    log: true,
    loading: true,
    url: '/v1/device/querySubDeviceInfoByRoomId',
    data: {
      houseId,
      roomId,
    },
  })
}

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
 * 设备类型（1:网关 2:子设备 3:wifi
 */
export async function queryDeviceOnlineStatus(params: { deviceType: '1' | '2' | '3'; sn?: string, deviceId?: string }) {
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

/**
 * 设备控制-下发命令
 */
export async function controlDevice(
  params: {
    customJson?: IAnyObject
    deviceId: string
    method: string
    topic: string
    inputData: IAnyObject[]
  },
  option?: { loading: boolean },
) {
  return await mzaiotRequest.post<IAnyObject>({
    log: false,
    loading: option?.loading || false,
    url: '/v1/device/down',
    data: params,
  })
}

/**
 * 设备控制-下发命令
 */
export async function sendCmdAddSsubdevice(params: { deviceId: string; expire: number; buzz: 0 | 1 }) {
  return await controlDevice({
    deviceId: params.deviceId,
    topic: '/subdevice/add',
    method: 'subdeviceAdd',
    inputData: [
      {
        expire: 60,
        buzz: 1,
      },
    ],
  })
}
