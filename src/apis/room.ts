import { mzaiotRequest } from '../utils/index'

export async function getRoomList(houseId: string) {
  return await mzaiotRequest.post<{ roomInfoList: Room.RoomItem[] }>({
    log: true,
    loading: true,
    url: '/v1/mzgd/user/house/queryRoomList',
    data: {
      houseId,
    },
  })
}

/**
 * 新增或更新房间信息
 * @param params
 */
export async function saveHouseRoomInfo(params: {
  houseId: string
  roomIcon: string
  roomId?: string
  roomName: string
}) {
  return await mzaiotRequest.post({
    log: true,
    loading: true,
    url: '/v1/mzgd/user/saveHouseRoomInfo',
    data: params,
  })
}

/**
 * 删除房间
 * @param params
 */
export async function delHouseRoom(roomId: string) {
  return await mzaiotRequest.post({
    log: true,
    loading: true,
    url: '/v1/mzgd/user/house/delHouseRoom',
    data: { roomId },
  })
}
