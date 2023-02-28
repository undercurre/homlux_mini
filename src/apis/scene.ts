import { mzaioRequest } from '../utils/index'

export async function querySceneList(roomId: string) {
  return await mzaioRequest.post<Scene.SceneItem[]>({
    log: true,
    loading: true,
    url: '/v1/mzgd/scene/querySceneListByRoomId',
    data: {
      roomId,
    },
  })
}

export async function addScene(data: Scene.AddSceneDto) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: true,
    url: '/v1/mzgd/scene/addScene',
    data,
  })
}

export async function execScene(sceneId: string) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: true,
    url: '/v1/mzgd/scene/sceneControl',
    data: {
      sceneId,
    },
  })
}

export async function deleteScene(sceneId: string) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: true,
    url: '/v1/mzgd/scene/deleteScene',
    data: {
      sceneId,
    },
  })
}

export async function updateScene(data: Scene.UpdateSceneDto) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: true,
    url: '/v1/mzgd/scene/updateScene',
    data,
  })
}
