import { observable, runInAction } from 'mobx-miniprogram'
import { queryAllDevice } from '../apis/device'
import { MODEL_NAME, PRO_TYPE } from '../config/index'
import { homeStore } from './home'
import { roomStore } from './room'
import { sceneStore } from './scene'
import homOs from 'js-homos'

export const deviceStore = observable({
  /**
   * 全屋设备
   */
  allRoomDeviceList: [] as Device.DeviceItem[],

  get deviceList(): Device.DeviceItem[] {
    const { roomId = 0 } = roomStore.currentRoom ?? {}
    return this.allRoomDeviceList.filter((device) => device.roomId === roomId)
  },
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
    this.deviceList.forEach((device) => {
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
      // 包括proType.light在内，所有非网关、可显示的设备都用这种方案插值
      else if (
        device.proType !== PRO_TYPE.gateway &&
        device.proType !== PRO_TYPE.sensor &&
        device.mzgdPropertyDTOList // 过滤不完整的数据，避免引起整个列表加载出错
      ) {
        const modelName = MODEL_NAME[device.proType]
        list.push({
          ...device,
          uniId: device.deviceId,
          mzgdPropertyDTOList: {
            [modelName]: device.mzgdPropertyDTOList[modelName],
          },
        })
      }
    })
    return list
  },

  /**
   * 在灯组中的灯ID
   */
  get lightsInGroup() {
    const list = [] as string[]
    deviceStore.deviceList.forEach((device) => {
      if (device.deviceType === 4) {
        list.push(...device.groupDeviceList!.map((device) => device.deviceId))
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
      // 过滤属性数据不完整的数据
      if (!device.mzgdPropertyDTOList) {
        return
      }
      if (device.proType === PRO_TYPE.switch) {
        device.switchInfoDTOList?.forEach((switchItem) => {
          list.push({
            ...device,
            property: device.mzgdPropertyDTOList[switchItem.switchId],
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
        const modelName = MODEL_NAME[device.proType]
        list.push({
          ...device,
          uniId: device.deviceId,
          property: device.mzgdPropertyDTOList[modelName],
          mzgdPropertyDTOList: {
            [modelName]: device.mzgdPropertyDTOList[modelName],
          },
        })
      }
    })
    return list
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

  /**
   * 更新全屋设备列表的局域网状态
   */
  updateAllRoomDeviceListLanStatus() {
    runInAction(() => {
      deviceStore.allRoomDeviceList = deviceStore.allRoomDeviceList.map((item) => {
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
    })
  },
})

export const deviceBinding = {
  store: deviceStore,
  fields: ['deviceList', 'allRoomDeviceList', 'deviceFlattenList'],
  actions: [],
}
