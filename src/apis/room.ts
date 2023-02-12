import { mzaiotRequest } from '../utils/index'

export async function getRoomList(houseId: string) {
  return await mzaiotRequest.post<User.UserLoginRes>({
    log: true,
    loading: true,
    url: '/v1/mzgd/user/house/queryRoomList',
    data: {
      houseId,
    },
  })
}
