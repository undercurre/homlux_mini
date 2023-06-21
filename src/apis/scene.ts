import { mzaioRequest } from '../utils/index'

export async function querySceneList(roomId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Scene.SceneItem[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/scene/querySceneListByRoomId',
    data: {
      roomId,
    },
  })
}

export async function querySceneListByHouseId(houseId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Scene.SceneItem[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/scene/querySceneListByHouseId',
    data: {
      houseId,
    },
  })
}

export async function addScene(data: Scene.AddSceneDto, options?: { loading?: boolean }) {
  return await mzaioRequest.post<{ sceneId: string }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/scene/addScene',
    data,
  })
}

/**
 * 场景重试
 */
export async function retryScene(
  data: { deviceActions: Scene.DeviceAction[]; sceneId: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/scene/sceneRetry',
    data,
  })
}

export async function execScene(sceneId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/scene/sceneControl',
    data: {
      sceneId,
    },
  })
}

export async function deleteScene(sceneId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/scene/deleteScene',
    data: {
      sceneId,
    },
  })
}

export async function updateScene(data: Scene.UpdateSceneDto, options?: { loading?: boolean }) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/scene/updateScene',
    data,
  })
}

export async function updateSceneSort(
  data: { sceneSortList: { orderNum: number; sceneId: string }[] },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/scene/updateSceneSort',
    data,
  })
}
