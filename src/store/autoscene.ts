import { observable, runInAction } from 'mobx-miniprogram'
import { queryAutoSceneListByHouseId, setAutoSceneEnabled } from '../apis/scene'
import { homeStore } from './home'
import { strUtil, transferDeviceProperty } from '../utils/index'
import { PRO_TYPE } from '../config/index'
import { deviceStore } from './device'

export const autosceneStore = observable({
  /**
   * 全屋的自动化场景
   */
  allRoomAutoSceneList: [] as AutoScene.AutoSceneItem[],

  get allRoomAutoSceneListComputed() {
    const templist = [...this.allRoomAutoSceneList]
    return templist.map((item: AutoScene.AutoSceneItem) => {
      const desc = strUtil.transDesc(item.effectiveTime, item.timeConditions[0])
      item.desc = desc.length > 18 ? desc.substring(0, 18) + '...' : desc
      const reg = /^icon-\d+$/ //自动化场景图标统一为该名称格式
      if (!reg.test(item.sceneIcon)) item.sceneIcon = 'icon-1'
      item.deviceActions.forEach((action) => {
        if (action.proType === PRO_TYPE.light) {
          const device = deviceStore.allRoomDeviceFlattenList.find((item) => item.uniId === action.deviceId)
          if (device) {
            runInAction(() => {
              action.controlAction[0] = transferDeviceProperty(device.proType, {
                ...action.controlAction[0],
                minColorTemp: device.property!.minColorTemp,
                maxColorTemp: device.property!.maxColorTemp,
              })
            })
          } else {
            console.log('allRoomAutoSceneListComputed设备不存在', action)
          }
        }
      })
      return item
    })
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
