import { mzaiotRequest } from '../utils/index'

export async function querySceneList(roomId: string) {
  return await mzaiotRequest.post<User.UserLoginRes>({
    log: true,
    loading: true,
    url: '/v1/mzgd/scene/querySceneListByRoomId',
    data: {
      roomId,
    },
  })
}
