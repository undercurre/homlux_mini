import { observable } from 'mobx-miniprogram'

export const scene = observable({
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
  store: scene,
  fields: ['selectScene'],
  actions: [],
}
