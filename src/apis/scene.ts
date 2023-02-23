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

export async function addScene(data: Scene.AddSceneDto) {
  return await mzaiotRequest.post<IAnyObject>({
    log: true,
    loading: true,
    url: '/v1/mzgd/scene/querySceneListByRoomId',
    data,
  })
}
