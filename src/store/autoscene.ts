import { observable, runInAction } from 'mobx-miniprogram'
import { queryAutoSceneListByHouseId, setAutoSceneEnabled } from '../apis/scene'
import { homeStore } from './home'
import { strUtil } from '../utils/index'

export const autosceneStore = observable({
  /**
   * 全屋的自动化场景
   */
  allRoomAutoSceneList: [] as AutoScene.AutoSceneItem[],

  get allRoomAutoSceneListComputed() {
    const list = [...this.allRoomAutoSceneList]
    list.forEach((item) => {
      item.desc = strUtil.transDesc(item.effectiveTime, item.timeConditions[0])
    })

    return list
  },

  async changeAutoSceneEnabled(data: { sceneId: string; isEnabled: '1' | '0' }) {
    const res = await setAutoSceneEnabled(data)
    if (res.success) {
      this.allRoomAutoSceneList.forEach((scene) => {
        if (scene.sceneId === data.sceneId) {
          scene.isEnabled = data.isEnabled
        }
      })
      runInAction(() => {
        this.allRoomAutoSceneList = [...this.allRoomAutoSceneList]
      })
    }
  },

  async updateAllRoomAutoSceneList(houseId: string = homeStore.currentHomeId) {
    const res = await queryAutoSceneListByHouseId(houseId)
    console.log('自动化场景列表', res)

    if (res.success) {
      const list = res.result.filter((scene) => scene.deviceActions && scene.deviceActions.length)
      runInAction(() => {
        this.allRoomAutoSceneList = [...list]
      })
    }
  },
})

export const autosceneBinding = {
  store: autosceneStore,
  fields: ['allRoomAutoSceneList', 'allRoomAutoSceneListComputed'],
  actions: ['updateAllRoomAutoSceneList'],
}
