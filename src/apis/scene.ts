import { mzaiotRequest } from '../utils/index'

export async function querySceneList(roomId: string) {
  return await mzaiotRequest.post<Scene.SceneItem[]>({
    log: true,
    loading: true,
    url: '/v1/mzgd/scene/querySceneListByRoomId',
    data: {
      roomId,
    },
  })
}
