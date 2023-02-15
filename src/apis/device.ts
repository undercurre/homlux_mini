import { mzaiotRequest } from '../utils/index'
// import { mzaiotTestRequest } from '../utils/index'

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
