import { observable, runInAction } from 'mobx-miniprogram'
import { queryAllDevice, queryDeviceList, querySubDeviceList } from '../apis/device'
import { proType } from '../config/index'
import { homeStore } from './home'
import { roomStore } from './room'
import { sceneStore } from './scene'

export const deviceStore = observable({
  /**
   * 当前房间
   */
  deviceList: [] as Device.DeviceItem[],
  /**
   * 当前选择的灯具的状态
   */
  lightInfo: {} as Record<string, number>,
  /**
   * 选了了那些设备
   */
  selectList: [] as string[],
  /**
   * 选择了什么类型
   */
  selectType: [] as string[],

  /**
   * deviceId -> device 映射
   */
  get deviceMap(): Record<string, Device.DeviceItem> {
    return Object.fromEntries(deviceStore.deviceList.map((device: Device.DeviceItem) => [device.deviceId, device]))
  },

  /**
   * 将有多个按键的开关拍扁，保证每个设备和每个按键都是独立一个item，并且uniId唯一
   */
  get deviceFlattenList() {
    const list = [] as Device.DeviceItem[]
    deviceStore.deviceList.forEach((device) => {
      if (device.proType === proType.light) {
        list.push({
          ...device,
          uniId: device.deviceId,
        })
      } else if (device.proType === proType.switch) {
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
    })
    return list
  },

  /**
   * 关联设备关系映射
   * deviceId -> {lightRelId: string}
   * lightRelId:switchId -> {switchRelId?: string;lightRelId?: string}
   */
  get deviceRefMap(): Record<string, { switchRelId?: string; lightRelId?: string }> {
    const map = {} as Record<string, { switchRelId?: string; lightRelId?: string }>
    deviceStore.deviceList.forEach((device) => {
      if (device.proType === proType.switch) {
        device.switchInfoDTOList.forEach((switchItem) => {
          const ref = {} as { switchRelId?: string; lightRelId?: string }
          if (switchItem.switchRelId) {
            ref.switchRelId = switchItem.switchRelId
          }
          if (switchItem.lightRelId) {
            ref.lightRelId = switchItem.lightRelId
          }
          if (Object.keys(ref).length !== 0) {
            map[`${device.deviceId}:${switchItem.switchId}`] = ref
          }
        })
      } else {
        if (device.lightRelId) {
          map[device.deviceId] = { lightRelId: device.lightRelId }
        }
      }
    })
    return map
  },

  /**
   * 关联场景关系映射
   * switchUniId -> sceneId
   */
  get switchSceneMap(): Record<string, string> {
    const map = {} as Record<string, string>
    sceneStore.sceneList.forEach((scene) => {
      scene.deviceConditions?.forEach((condition) => {
        map[`${condition.deviceId}:${condition.controlEvent[0].ep}`] = scene.sceneId
      })
    })
    return map
  },

  async updateAllRoomDeviceList(houseId: string = homeStore.currentHomeDetail.houseId) {
    const res = await queryAllDevice(houseId)
    if (res.success) {
      runInAction(() => {
        deviceStore.deviceList = res.result
      })
    }
  },

  async updateDeviceList(
    houseId: string = homeStore.currentHomeDetail.houseId,
    roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomId,
  ) {
    const res = await queryDeviceList(houseId, roomId)
    runInAction(() => {
      deviceStore.deviceList = res.success ? res.result : []
    })
  },

  async updateSubDeviceList(
    houseId: string = homeStore.currentHomeDetail.houseId,
    roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomId,
  ) {
    const res = await querySubDeviceList(houseId, roomId)
    runInAction(() => {
      deviceStore.deviceList = res.success ? res.result : []
    })
  },
})

export const deviceBinding = {
  store: deviceStore,
  fields: ['selectList', 'selectType', 'deviceList', 'lightInfo'],
  actions: [],
}
