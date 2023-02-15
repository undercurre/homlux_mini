import { observable } from 'mobx-miniprogram'

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
})

export const sceneBinding = {
  store: sceneStore,
  fields: ['selectScene'],
  actions: [],
}
