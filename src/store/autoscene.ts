import { observable, runInAction } from 'mobx-miniprogram'
import { queryAutoSceneListByHouseId, setAutoSceneEnabled } from '../apis/scene'
import { homeStore } from './home'
import { strUtil } from '../utils/index'
import { autoSceneConditionPropertyOptions, PRO_TYPE, pwdType } from '../config/index'
import { deviceStore } from './device'
import { formLimitString } from '../utils/index'
import { deviceTransmit } from '../apis/device'

export const autosceneStore = observable({
  /**
   * 全屋的自动化场景
   */
  allRoomAutoSceneList: [] as AutoScene.AutoSceneItem[],

  get allRoomAutoSceneListComputed() {
    const templist = [...this.allRoomAutoSceneList]
    try {
      return templist.map((item: AutoScene.AutoSceneItem) => {
        if (item.timeConditions !== null) {
          const desc = strUtil.transDesc(item.effectiveTime, item.timeConditions[0])
          item.desc = desc.length > 18 ? desc.substring(0, 18) + '...' : desc
        } else {
          item.desc = ''
        }
        const reg = /^icon-\d+$/ //自动化场景图标统一为该名称格式
        if (!reg.test(item.sceneIcon)) item.sceneIcon = 'icon-1'
        item.deviceActions.forEach((action) => {
          if (action.proType === PRO_TYPE.light) {
            const device = deviceStore.allRoomDeviceFlattenList.find((item) => item.uniId === action.deviceId)
            if (device) {
              runInAction(() => {
                action.controlAction[0] = {
                  ...action.controlAction[0],
                  minColorTemp: device.property!.minColorTemp,
                  maxColorTemp: device.property!.maxColorTemp,
                }
              })
            } else {
              console.log('allRoomAutoSceneListComputed设备不存在', action)
            }
          }
        })
        runInAction(() => {
          item.sceneName = formLimitString(item.sceneName, 13, 9, 2)
        })
        return item
      })
    } catch (e) {
      console.log('自动化场景列表处理出错', e)
      return []
    }
  },

  deviceConditionPropertyList: {} as { [key: string]: { title: string; key: string; value: IAnyObject }[] },
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
    } else {
      this.allRoomAutoSceneList = []
    }
  },
  async updateDeviceConditionPropertyList(productId: string) {
    const propertyList = this.deviceConditionPropertyList[productId] || autoSceneConditionPropertyOptions[productId]
    const index = propertyList.findIndex((item) => item.title === 'XX权限名XX方式开门')

    if (index >= 0) {
      propertyList.splice(index, 1)

      const {
        result: { list },
      } = (await deviceTransmit('PWD_LIST', { deviceId: '177021372098906', pwdType: '0' })) as IAnyObject
      const userList = list.map((item: { pwdName: string; pwdType: number; pwdId: number }) => {
        return {
          title: item.pwdName + pwdType[item.pwdType] + '开锁',
          key: 'pwd',
          value: {
            modelName: 'doorLock',
            cmdType: 141,
            doorEvent: 'triggerOpenDoor',
            usrType: item.pwdType,
            userId: item.pwdId,
          },
        }
      })
      propertyList.push(...userList)
    }
    runInAction(() => {
      this.deviceConditionPropertyList[productId] = propertyList
    })
  },
})

export const autosceneBinding = {
  store: autosceneStore,
  fields: ['allRoomAutoSceneList', 'allRoomAutoSceneListComputed', 'deviceConditionPropertyList'],
  actions: ['updateAllRoomAutoSceneList', 'updateDeviceConditionPropertyList'],
}
