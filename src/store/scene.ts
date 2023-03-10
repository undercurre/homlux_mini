import { observable, runInAction } from 'mobx-miniprogram'
import { querySceneList, querySceneListByHouseId } from '../apis/scene'
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
   * 选了哪个场景
   */
  selectSceneIndex: -1,

  get sceneIdMp(): Record<string, Scene.SceneItem> {
    return Object.fromEntries(sceneStore.sceneList.map((scene) => [scene.sceneId, scene]))
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
    sceneStore.sceneList.forEach((scene) => {
      scene.deviceConditions?.forEach((condition) => {
        map[scene.sceneId] = `${condition.deviceId}:${condition.controlEvent[0].ep}`
      })
    })
    return map
  },

  async updateSceneList(roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomId) {
    const res = await querySceneList(roomId)
    if (res.success) {
      runInAction(() => {
        sceneStore.sceneList = res.result.sort((a, b) => a.orderNum - b.orderNum)
      })
    }
  },

  async updateAllRoomSceneList(houseId: string = homeStore.currentHomeId) {
    const res = await querySceneListByHouseId(houseId)
    if (res.success) {
      runInAction(() => {
        sceneStore.allRoomSceneList = res.result
      })
    }
  },
})

export const sceneBinding = {
  store: sceneStore,
  fields: ['selectSceneIndex', 'sceneList'],
  actions: [],
}
