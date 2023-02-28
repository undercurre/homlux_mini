import { observable, runInAction } from 'mobx-miniprogram'
import { querySceneList } from '../apis/scene'
import { roomStore } from './room'

export const sceneStore = observable({
  sceneList: [] as Scene.SceneItem[],
  /**
   * 选了哪个场景
   */
  selectSceneIndex: -1,

  async updateSceneList(roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomId) {
    const res = await querySceneList(roomId)
    if (res.success) {
      runInAction(() => {
        sceneStore.sceneList = res.result
      })
    }
  },
})

export const sceneBinding = {
  store: sceneStore,
  fields: ['selectSceneIndex', 'sceneList'],
  actions: [],
}
