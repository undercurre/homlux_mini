import { observable, runInAction } from 'mobx-miniprogram'
import { querySceneList, querySceneListByHouseId } from '../apis/scene'
import { PRO_TYPE } from '../config/device'
import { homeStore } from './home'
import { roomStore } from './room'

export const sceneStore = observable({
  /**
   * 当前房间的场景
   */
  sceneList: [] as Scene.SceneItem[],
  /**
   * 全屋的场景
   */
  allRoomSceneList: [] as Scene.SceneItem[],

  /**
   * 准备添加到场景的actions
   */
  addSceneActions: [] as Device.ActionItem[],

  get sceneIdMp(): Record<string, Scene.SceneItem> {
    return Object.fromEntries(sceneStore.allRoomSceneList.map((scene) => [scene.sceneId, scene]))
  },

  get roomSceneList(): Record<string, Scene.SceneItem[]> {
    const data = {} as Record<string, Scene.SceneItem[]>
    sceneStore.allRoomSceneList.forEach((scene) => {
      if (data[scene.roomId]) {
        data[scene.roomId].push(scene)
        return
      }
      data[scene.roomId] = [scene]
    })
    return data
  },

  /**
   * 关联场景关系映射
   * sceneId -> switchUniId
   */
  get sceneSwitchMap(): Record<string, string> {
    const map = {} as Record<string, string>
    sceneStore.allRoomSceneList.forEach((scene) => {
      scene.deviceConditions?.forEach((condition) => {
        map[scene.sceneId] = `${condition.deviceId}:${condition.controlEvent[0].modelName}`
      })
    })
    return map
  },

  async updateSceneList(roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomId) {
    const res = await querySceneList(roomId)
    if (res.success) {
      const roomDeviceList = roomStore.roomDeviceList[roomId]
      const hasSwitch = roomDeviceList?.some((device) => device.proType === PRO_TYPE.switch) ?? false
      const hasLight = roomDeviceList?.some((device) => device.proType === PRO_TYPE.light) ?? false

      let list = [...res.result]
      if (!hasSwitch && !hasLight) {
        // 四个默认场景都去掉
        list = list.filter((scene) => scene.isDefault === '0')
      } else if (hasSwitch && !hasLight) {
        // 只有开关，去掉默认的明亮、柔和
        list = list.filter((scene) => !['2', '3'].includes(scene.defaultType))
      }
      list = list
        .filter((scene) => scene.deviceActions && scene.deviceActions.length > 0)
        .sort((a, b) => a.orderNum - b.orderNum)

      runInAction(() => {
        sceneStore.sceneList = list
      })
    }
  },

  async updateAllRoomSceneList(houseId: string = homeStore.currentHomeId) {
    const res = await querySceneListByHouseId(houseId)
    if (res.success) {
      const list = res.result
        .filter((scene) => scene.deviceActions && scene.deviceActions.length)
        .sort((a, b) => a.orderNum - b.orderNum)
      runInAction(() => {
        sceneStore.allRoomSceneList = [...list]
      })
    }
  },

  addCondition(updateSceneDto: Scene.UpdateSceneDto) {
    const scene = sceneStore.allRoomSceneList.find(
      (item) => updateSceneDto.sceneId && item.sceneId === updateSceneDto.sceneId,
    )
    if (scene) {
      runInAction(() => {
        scene.deviceConditions = updateSceneDto.deviceConditions!
      })
    }
  },

  removeCondition(sceneId: string) {
    const scene = sceneStore.allRoomSceneList.find((item) => sceneId && item.sceneId === sceneId)
    if (scene) {
      runInAction(() => {
        scene.deviceConditions = []
      })
    }
  },
})

export const sceneBinding = {
  store: sceneStore,
  fields: ['sceneList', 'allRoomSceneList', 'addSceneActions'],
  actions: [],
}
