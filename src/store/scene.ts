import { observable, runInAction } from 'mobx-miniprogram'
import { querySceneList } from '../apis/scene'
import { roomStore } from './room'

export const sceneStore = observable({
  sceneList: [] as Scene.SceneItem[],
  /**
   * 选了哪个场景
   */
  selectSceneIndex: -1,

  get sceneIdMp(): Record<string, Scene.SceneItem> {
    return Object.fromEntries(sceneStore.sceneList.map((scene) => [scene.sceneId, scene]))
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
})

export const sceneBinding = {
  store: sceneStore,
  fields: ['selectSceneIndex', 'sceneList'],
  actions: [],
}
