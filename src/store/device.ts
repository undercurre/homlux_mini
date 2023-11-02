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
   * @description 房间设备列表
   * 将有多个按键的开关拍扁，保证每个设备和每个按键都是独立一个item，并且uniId唯一
   */
  get deviceFlattenList(): Device.DeviceItem[] {
    const { roomId = 0 } = roomStore.currentRoom ?? {}
    return this.allRoomDeviceFlattenList.filter((device) => device.roomId === roomId)
  },

  // 房间所有灯的亮度计算
  get lightStatusInRoom(): { brightness: number; colorTemperature: number } {
    let sumOfBrightness = 0,
      sumOfColorTemp = 0,
      count = 0
    this.deviceFlattenList.forEach((device) => {
      const { proType, deviceType, mzgdPropertyDTOList, onLineStatus } = device

      // 只需要灯需要参与计算，过滤属性数据不完整的数据，过滤灯组，过滤不在线设备，过滤未开启设备
      if (
        proType !== PRO_TYPE.light ||
        deviceType === 4 ||
        onLineStatus !== 1 ||
        mzgdPropertyDTOList?.light?.power !== 1
      ) {
        return
      }

      sumOfBrightness += mzgdPropertyDTOList.light?.brightness ?? 0
      sumOfColorTemp += mzgdPropertyDTOList.light?.colorTemperature ?? 0
      count++
    })

    if (count === 0) {
      return { brightness: 0, colorTemperature: 0 }
    }

    return { brightness: sumOfBrightness / count, colorTemperature: sumOfColorTemp / count }
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
  get allRoomDeviceFlattenList(): Device.DeviceItem[] {
    const list = [] as Device.DeviceItem[]
    this.allRoomDeviceList.forEach((device) => {
      // 过滤属性数据不完整的数据
      if (!device.mzgdPropertyDTOList) {
        return
      }
      // 开关面板需要前端拆分处理
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
            orderNum: switchItem.orderNum,
          })
        })
      }
      // 包括 PRO_TYPE.light PRO_TYPE.sensor在内，所有非网关、可显示的设备都用这种方案插值
      else if (device.proType !== PRO_TYPE.gateway) {
        const modelName = MODEL_NAME[device.proType]
        list.push({
          ...device,
          uniId: device.deviceId,
          property: device.mzgdPropertyDTOList[modelName],
          mzgdPropertyDTOList: {
            [modelName]: device.mzgdPropertyDTOList[modelName],
          },
          orderNum: device.deviceType === 4 ? -1 : device.orderNum, // 灯组强制排前面
        })
      }
    })

    // 排序，先按排序字段升序，相同则再按设备id升序
    return list.sort((a, b) => a.orderNum - b.orderNum || parseInt(a.deviceId) - parseInt(b.deviceId))
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

        this.updateAllRoomDeviceListLanStatus(false)
      })
    } else {
      console.log('加载全屋设备失败！', res)
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
