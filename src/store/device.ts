import { observable, runInAction } from 'mobx-miniprogram'
import { queryAllDevice, queryDeviceList, querySubDeviceList } from '../apis/device'
import { PRO_TYPE } from '../config/index'
import { homeStore } from './home'
import { roomStore } from './room'
import { sceneStore } from './scene'
import { transferDeviceProperty } from '../utils/index'

export const deviceStore = observable({
  /**
   * 当前房间
   */
  deviceList: [] as Device.DeviceItem[],
  /**
   * 全屋设备
   */
  allRoomDeviceList: [] as Device.DeviceItem[],

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

  get deviceFlattenMap(): Record<string, Device.DeviceItem> {
    return Object.fromEntries(deviceStore.deviceFlattenList.map((device: Device.DeviceItem) => [device.uniId, device]))
  },

  /**
   * 将有多个按键的开关拍扁，保证每个设备和每个按键都是独立一个item，并且uniId唯一
   */
  get deviceFlattenList() {
    const list = [] as Device.DeviceItem[]
    deviceStore.deviceList.forEach((device) => {
      if (device.proType === PRO_TYPE.switch) {
        device.switchInfoDTOList?.forEach((switchItem) => {
          list.push({
            ...device,
            mzgdPropertyDTOList: {
              [switchItem.switchId]: device.mzgdPropertyDTOList[switchItem.switchId],
            },
            switchInfoDTOList: [switchItem],
            uniId: `${device.deviceId}:${switchItem.switchId}`,
            orderNum: switchItem.orderNum,
          })
        })
      }
      // 包括proType.light在内，所有非网关设备都用这种方案插值
      else if (device.proType !== PRO_TYPE.gateway) {
        list.push({
          ...device,
          uniId: device.deviceId,
          mzgdPropertyDTOList: {
            1: transferDeviceProperty(device.proType, device.mzgdPropertyDTOList[1]),
          },
        })
      }
    })
    return list
  },

  get allRoomDeviceFlattenMap(): Record<string, Device.DeviceItem> {
    return Object.fromEntries(
      deviceStore.allRoomDeviceFlattenList.map((device: Device.DeviceItem) => [device.uniId, device]),
    )
  },
  get allRoomDeviceFlattenList() {
    const list = [] as Device.DeviceItem[]
    deviceStore.allRoomDeviceList.forEach((device) => {
      if (device.proType === PRO_TYPE.switch) {
        device.switchInfoDTOList?.forEach((switchItem) => {
          list.push({
            ...device,
            mzgdPropertyDTOList: {
              [switchItem.switchId]: device.mzgdPropertyDTOList[switchItem.switchId],
            },
            switchInfoDTOList: [switchItem],
            uniId: `${device.deviceId}:${switchItem.switchId}`,
          })
        })
      }
      // 包括proType.light在内，所有非网关设备都用这种方案插值
      else if (device.proType !== PRO_TYPE.gateway) {
        list.push({
          ...device,
          uniId: device.deviceId,
          mzgdPropertyDTOList: {
            1: transferDeviceProperty(device.proType, device.mzgdPropertyDTOList[1]),
          },
        })
      }
    })
    return list
  },

  /**
   * 关联场景关系映射(deviceActions的关联)
   * switchUniId -> sceneId
   */
  get switchSceneActionMap(): Record<string, string[]> {
    const map = {} as Record<string, string[]>
    sceneStore.allRoomSceneList.forEach((scene) => {
      scene.deviceActions?.forEach((action) => {
        if (action.proType === PRO_TYPE.switch) {
          action.controlAction.forEach((controlData) => {
            if (map[`${action.deviceId}:${controlData.ep}`]) {
              if (!map[`${action.deviceId}:${controlData.ep}`].includes(scene.sceneId)) {
                map[`${action.deviceId}:${controlData.ep}`].push(scene.sceneId)
              }
            } else {
              map[`${action.deviceId}:${controlData.ep}`] = [scene.sceneId]
            }
          })
        }
      })
    })
    return map
  },

  /**
   * 关联场景关系映射(deviceConditions的关联)
   * switchUniId -> sceneId
   */
  get switchSceneConditionMap(): Record<string, string> {
    const map = {} as Record<string, string>
    sceneStore.allRoomSceneList.forEach((scene) => {
      scene.deviceConditions?.forEach((condition) => {
        map[`${condition.deviceId}:${condition.controlEvent[0].ep}`] = scene.sceneId
      })
    })
    return map
  },

  async updateAllRoomDeviceList(houseId: string = homeStore.currentHomeId, options?: { loading: boolean }) {
    const res = await queryAllDevice(houseId, options)
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
      })
    } else {
      console.log('加载全屋设备失败！', res)
    }
  },

  async updateDeviceList(
    houseId: string = homeStore.currentHomeId,
    roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomId,
    options?: { loading: boolean },
  ) {
    const res = await queryDeviceList({ houseId, roomId }, options)
    runInAction(() => {
      deviceStore.deviceList = res.success ? res.result.sort((a, b) => a.deviceId.localeCompare(b.deviceId)) : []
    })
  },

  async updateSubDeviceList(
    houseId: string = homeStore.currentHomeId,
    roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomId,
    options?: { loading: boolean },
  ) {
    const res = await querySubDeviceList({ houseId, roomId }, options)
    runInAction(() => {
      deviceStore.deviceList = res.success ? res.result : []
    })
  },
})

export const deviceBinding = {
  store: deviceStore,
  fields: ['deviceList', 'allRoomDeviceList', 'deviceFlattenList'],
  actions: [],
}
