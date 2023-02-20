import { observable, runInAction } from 'mobx-miniprogram'
import { querySceneList } from '../apis/scene'
import { roomStore } from './room'

export const sceneStore = observable({
  sceneList: [] as Scene.SceneItem[],
  /**
   * 选了了那些设备
   */
  selectScene: {
    sceneName: '',
    sceneId: '',
    sceneIcon: '',
  } as Scene.SceneItem,

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
  fields: ['selectScene', 'sceneList'],
  actions: [],
}
