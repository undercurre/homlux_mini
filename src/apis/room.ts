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

export async function addRoom(data: { houseId: string; roomIcon: string; roomName: string }) {
  return await mzaiotRequest.post<object>({
    log: true,
    loading: true,
    url: '/v1/mzgd/user/saveHouseRoomInfo',
    data,
  })
}
