import { observable, runInAction } from 'mobx-miniprogram'
import { queryAllDevice, querySubDeviceList } from '../apis/device'
import { PRO_TYPE } from '../config/index'
import { homeStore } from './home'
import { roomStore } from './room'
import { sceneStore } from './scene'
import homOs from 'js-homos'
import { IApiRequestOption, deviceFlatten } from '../utils/index'

export const deviceStore = observable({
  /**
   * 全屋设备
   */
  allRoomDeviceList: [] as Device.DeviceItem[],

  /**
   * 当前房间设备
   */
  deviceList: [] as Device.DeviceItem[],

  /**
   * deviceId -> device 映射
   */
  get deviceMap(): Record<string, Device.DeviceItem> {
    return Object.fromEntries(deviceStore.deviceList.map((device: Device.DeviceItem) => [device.deviceId, device]))
  },

  get allRoomDeviceMap(): Record<string, Device.DeviceItem> {
    return Object.fromEntries(
      deviceStore.allRoomDeviceList.map((device: Device.DeviceItem) => [device.deviceId, device]),
    )
  },

  /**
   * @description 房间设备列表
   * 将有多个按键的开关拍扁，保证每个设备和每个按键都是独立一个item，并且uniId唯一
   */
  get deviceFlattenList(): Device.DeviceItem[] {
    return deviceFlatten(this.deviceList)
  },

  // 当前房间灯组数量
  get groupCount(): number {
    const { roomId = 0 } = roomStore.currentRoom ?? {}
    const groups = this.allRoomDeviceList.filter((device) => device.roomId === roomId && device.deviceType === 4)
    return groups.length
  },

  get allRoomDeviceFlattenMap(): Record<string, Device.DeviceItem> {
    return Object.fromEntries(
      deviceStore.allRoomDeviceFlattenList.map((device: Device.DeviceItem) => [device.uniId, device]),
    )
  },
  get allRoomDeviceFlattenList(): Device.DeviceItem[] {
    return deviceFlatten(this.allRoomDeviceList)
  },

  /**
   * 关联场景关系映射(deviceActions的关联)
   * switchUniId -> sceneId  开关  -》 所属的场景列表
   */
  get switchSceneActionMap(): Record<string, string[]> {
    const map = {} as Record<string, string[]>
    sceneStore.allRoomSceneList.forEach((scene) => {
      scene.deviceActions?.forEach((action) => {
        if (action.proType === PRO_TYPE.switch) {
          action.controlAction.forEach((controlData) => {
            if (map[`${action.deviceId}:${controlData.modelName}`]) {
              if (!map[`${action.deviceId}:${controlData.modelName}`].includes(scene.sceneId)) {
                map[`${action.deviceId}:${controlData.modelName}`].push(scene.sceneId)
              }
            } else {
              map[`${action.deviceId}:${controlData.modelName}`] = [scene.sceneId]
            }
          })
        }
      })
    })
    return map
  },

  /**
   * 关联场景关系映射(deviceConditions的关联)，
   * switchUniId -> sceneId  开关 -》 关联的场景
   */
  get switchSceneConditionMap(): Record<string, string> {
    const map = {} as Record<string, string>
    sceneStore.allRoomSceneList.forEach((scene) => {
      scene.deviceConditions?.forEach((condition) => {
        map[`${condition.deviceId}:${condition.controlEvent[0].modelName}`] = scene.sceneId
      })
    })
    return map
  },

  /**
   * 更新全屋设备列表
   */
  async updateAllRoomDeviceList(houseId: string = homeStore.currentHomeId, options?: IApiRequestOption) {
    const res = await queryAllDevice(houseId, options)
    const { roomId = '0' } = roomStore.currentRoom
    if (res.success) {
      const list = {} as Record<string, Device.DeviceItem[]>
      res.result
        ?.sort((a, b) => a.deviceId.localeCompare(b.deviceId))
        .forEach((device) => {
          if (list[device.roomId]) {
            list[device.roomId].push(device)
          } else {
            list[device.roomId] = [device]
          }
        })
      runInAction(() => {
        roomStore.roomDeviceList = list
        deviceStore.allRoomDeviceList = res.result

        if (roomId) {
          deviceStore.deviceList = res.result.filter((device) => device.roomId === roomId)
        }

        this.updateAllRoomDeviceListLanStatus(false)
      })
    } else {
      console.log('加载全屋设备失败！', res)
    }
  },

  /**
   * 更新当前房间设备列表
   */
  async updateRoomDeviceList(
    houseId: string = homeStore.currentHomeId,
    roomId: string = roomStore.currentRoom.roomId,
    options?: IApiRequestOption,
  ) {
    const res = await querySubDeviceList({ houseId, roomId }, options)
    if (res.success) {
      const list = {} as Record<string, Device.DeviceItem[]>
      res.result.forEach((device) => {
        if (list[device.roomId]) {
          list[device.roomId].push(device)
        } else {
          list[device.roomId] = [device]
        }
      })
      runInAction(() => {
        roomStore.roomDeviceList = list
        deviceStore.deviceList = res.result

        this.updateAllRoomDeviceListLanStatus(false)
      })
    } else {
      console.log('加载房间设备失败！', res)
    }
  },

  /**
   * 更新全屋设备列表的局域网状态
   */
  updateAllRoomDeviceListLanStatus(isUpdateUI = true) {
    const allRoomDeviceList = deviceStore.allRoomDeviceList.map((item) => {
      const { deviceId, updateStamp } = item

      const canLanCtrl =
        item.deviceType === 4
          ? homOs.isSupportLan({ groupId: deviceId, updateStamp })
          : homOs.isSupportLan({ deviceId })

      return {
        ...item,
        canLanCtrl,
      }
    })

    if (!isUpdateUI) {
      deviceStore.allRoomDeviceList = allRoomDeviceList
      return
    }

    runInAction(() => {
      deviceStore.allRoomDeviceList = allRoomDeviceList
    })
  },
})

export const deviceBinding = {
  store: deviceStore,
  fields: ['deviceList', 'allRoomDeviceList', 'deviceFlattenList'],
  actions: [],
}
