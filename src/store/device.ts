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
   * 全屋设备
   */
  allRoomDeviceList: [] as Device.DeviceItem[],
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

  get allRoomDeviceMap(): Record<string, Device.DeviceItem> {
    return Object.fromEntries(
      deviceStore.allRoomDeviceList.map((device: Device.DeviceItem) => [device.deviceId, device]),
    )
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

  get allRoomDeviceFlattenList() {
    const list = [] as Device.DeviceItem[]
    deviceStore.allRoomDeviceList.forEach((device) => {
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
   * deviceId:switchId -> {switchRelId?: string;lightRelId?: string}
   */
  get deviceRelMap(): Record<string, { switchRelId?: string; lightRelId?: string }> {
    const map = {} as Record<string, { switchRelId?: string; lightRelId?: string }>
    deviceStore.allRoomDeviceFlattenList.forEach((device) => {
      if (device.proType === proType.switch) {
        const ref = {} as { switchRelId?: string; lightRelId?: string }
        if (device.switchInfoDTOList[0].switchRelId) {
          ref.switchRelId = device.switchInfoDTOList[0].switchRelId
        }
        if (device.switchInfoDTOList[0].lightRelId) {
          ref.lightRelId = device.switchInfoDTOList[0].lightRelId
        }
        if (Object.keys(ref).length !== 0) {
          map[device.uniId] = ref
        }
      } else {
        if (device.lightRelId) {
          map[device.deviceId] = { lightRelId: device.lightRelId }
        }
      }
    })
    return map
  },

  /**
   * relId 和设备关联映射
   */
  get relDeviceMap(): Record<string, string[]> {
    const map = {} as Record<string, string[]>
    deviceStore.allRoomDeviceFlattenList.forEach((device) => {
      if (device.lightRelId) {
        if (map[device.lightRelId]) {
          map[device.lightRelId].push(device.uniId)
        } else {
          map[device.lightRelId] = [device.uniId]
        }
      }
      if (device.uniId.includes(':')) {
        if (device.switchInfoDTOList[0].lightRelId) {
          if (map[device.switchInfoDTOList[0].lightRelId]) {
            map[device.switchInfoDTOList[0].lightRelId].push(device.uniId)
          } else {
            map[device.switchInfoDTOList[0].lightRelId] = [device.uniId]
          }
        }
        if (device.switchInfoDTOList[0].switchRelId) {
          if (map[device.switchInfoDTOList[0].switchRelId]) {
            map[device.switchInfoDTOList[0].switchRelId].push(device.uniId)
          } else {
            map[device.switchInfoDTOList[0].switchRelId] = [device.uniId]
          }
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
      runInAction(() => {
        deviceStore.allRoomDeviceList = res.result ? res.result : []
      })
    }
  },

  async updateDeviceList(
    houseId: string = homeStore.currentHomeId,
    roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomId,
    options?: { loading: boolean },
  ) {
    const res = await queryDeviceList({ houseId, roomId }, options)
    runInAction(() => {
      deviceStore.deviceList = res.success ? res.result : []
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

  async updataHomeDeviceList(options?: { loading: boolean }) {
    console.log('请求房间设备：', homeStore.currentHomeId)
    const res = await queryAllDevice(homeStore.currentHomeId, options)
    const list = {} as Record<string, Device.DeviceItem[]>
    if (res.success) {
      res.result?.forEach((device) => {
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
      return
    } else {
      return Promise.reject('获取全屋设备信息失败')
    }
  },
})

export const deviceBinding = {
  store: deviceStore,
  fields: ['selectList', 'selectType', 'deviceList', 'lightInfo', 'allRoomDeviceList'],
  actions: [],
}
