import { observable } from 'mobx-miniprogram'
import { querySceneList } from '../apis/scene'
import { roomStore } from './room'

export const sceneStore = observable({
  sceneList: [],
  /**
   * 选了了那些设备
   */
  selectScene: {
    sceneName: '',
    sceneId: '',
    sceneIcon: '',
  } as Scene.SceneInfo,

  async updateSceneList(roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomInfo.roomId) {
    const res = await querySceneList(roomId)
    console.log('updateSceneList', res)
  },
})

export const sceneBinding = {
  store: sceneStore,
  fields: ['selectScene', 'sceneList'],
  actions: [],
}
