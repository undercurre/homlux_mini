import { IApiRequestOption, Logger, mzaioRequest } from '../utils/index'
import homOs from 'js-homos'
import { sceneStore } from '../store/index'

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

export async function querySceneListByHouseId(houseId: string, options?: IApiRequestOption) {
  return await mzaioRequest.post<Scene.SceneItem[]>({
    log: true,
    loading: options?.loading ?? false,
    isDefaultErrorTips: options?.isDefaultErrorTips ?? true,
    url: '/v1/mzgd/scene/querySceneListByHouseId',
    data: {
      houseId,
    },
  })
}

export async function addScene(data: Scene.AddSceneDto | AutoScene.AddAutoSceneDto, options?: { loading?: boolean }) {
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
  const sceneItem = sceneStore.allRoomSceneList.find((item) => item.sceneId === sceneId)

  if (homOs.isSupportLan({ sceneId, updateStamp: sceneItem?.updateStamp })) {
    const localRes = await homOs.sceneExecute(sceneId)

    Logger.log('localRes', localRes)

    if (localRes.success) {
      return localRes
    } else {
      Logger.error('局域网调用失败，改走云端链路')
    }
  }

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

export async function updateScene(
  data: Scene.UpdateSceneDto | AutoScene.AddAutoSceneDto,
  options?: { loading?: boolean },
) {
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

export async function queryAutoSceneListByHouseId(houseId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<AutoScene.AutoSceneItem[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/scene/queryAutoSceneListByHouseId',
    data: {
      houseId,
    },
  })
}

export async function queryAutoSceneLogByHouseId(
  data: { houseId: string; reportTs?: number },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<AutoScene.AutoSceneLog[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/scene/querySceneLog',
    data,
  })
}

export async function setAutoSceneEnabled(
  data: { sceneId: string; isEnabled: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/scene/setSceneEnabled',
    data,
  })
}
