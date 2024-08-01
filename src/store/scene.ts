import { observable, runInAction } from 'mobx-miniprogram'
import { querySceneListByHouseId } from '../apis/scene'
import { homeStore } from './home'
import { roomStore } from './room'
import { IApiRequestOption, Logger } from '../utils/index'

export const sceneStore = observable({
  /**
   * 全屋的场景
   */
  allRoomSceneList: [] as Scene.SceneItem[],

  /**
   * 准备添加到场景的actions
   */
  addSceneActions: [] as Device.ActionItem[],

  get sceneIdMap(): Record<string, Scene.SceneItem> {
    return Object.fromEntries(this.allRoomSceneList.map((scene) => [scene.sceneId, scene]))
  },

  /**
   * 当前房间场景
   */
  get sceneList(): Scene.SceneItem[] {
    const { roomId } = roomStore.currentRoom
    const roomInfo = roomStore.roomList.find((room) => room.roomId === roomId) ?? ({} as Room.RoomInfo)
    return roomInfo?.sceneList
  },

  // 房间场景映射，未被使用，可删除
  get roomSceneList(): Record<string, Scene.SceneItem[]> {
    const data = {} as Record<string, Scene.SceneItem[]>
    this.allRoomSceneList.forEach((scene) => {
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
    this.allRoomSceneList.forEach((scene) => {
      scene.deviceConditions?.forEach((condition) => {
        map[scene.sceneId] = `${condition.deviceId}:${condition.controlEvent[0].modelName}`
      })
    })
    return map
  },

  async updateAllRoomSceneList(houseId: string = homeStore.currentHomeId, options?: IApiRequestOption) {
    if (!houseId) {
      Logger.error('updateAllRoomSceneList缺少houseId参数')
      return
    }

    const res = await querySceneListByHouseId(houseId, options)
    if (res.success) {
      const list = res.result
        .filter((scene) => scene.deviceActions && scene.deviceActions.length)
        .sort((a, b) => a.orderNum - b.orderNum)
      runInAction(() => {
        this.allRoomSceneList = [...list]
      })
    }
  },

  addCondition(updateSceneDto: Scene.UpdateSceneDto) {
    const scene = this.allRoomSceneList.find(
      (item) => updateSceneDto.sceneId && item.sceneId === updateSceneDto.sceneId,
    )
    if (scene) {
      runInAction(() => {
        scene.deviceConditions = updateSceneDto.deviceConditions!
      })
    }
  },

  removeCondition(sceneId: string) {
    const scene = this.allRoomSceneList.find((item) => sceneId && item.sceneId === sceneId)
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
