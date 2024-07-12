import { observable, runInAction } from 'mobx-miniprogram'
import { queryAllDevice, querySubDeviceList } from '../apis/device'
import { PRO_TYPE, PRODUCT_ID } from '../config/index'
import { homeStore } from './home'
import { roomStore } from './room'
import { sceneStore } from './scene'
import homOs from 'js-homos'
import { IApiRequestOption, deviceFlatten } from '../utils/index'
import { emitter } from '../utils/eventBus'

export const deviceStore = observable({
  /**
   * 全屋设备
   */
  allRoomDeviceList: [] as Device.DeviceItem[],
  allRoomDeviceTimestamp: 0,

  /**
   * 当前房间设备
   */
  deviceList: [] as Device.DeviceItem[],
  deviceTimestamp: 0,

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
   * @description 全屋设备拍扁列表
   * 将有多个按键的开关拍扁，保证每个设备和每个按键都是独立一个item，并且uniId唯一
   */
  get allRoomDeviceFlattenList(): Device.DeviceItem[] {
    return deviceFlatten(this.allRoomDeviceList)
  },
  /**
   * @description 房间设备拍扁列表
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

  get allRoomSensorList(): Device.DeviceItem[] {
    const sensorList = deviceStore.allRoomDeviceList.filter((item) => item.proType === PRO_TYPE.sensor)
    sensorList.forEach((item) => {
      item.uniId = item.deviceId
      if (item.productId === PRODUCT_ID.humanSensor) {
        item.property = { occupancy: 1, modelName: 'irDetector' }
      } else if (item.productId === PRODUCT_ID.doorSensor) {
        item.property = { doorStatus: 1, modelName: 'magnet' }
      } else {
        item.property = { buttonClicked: 1, modelName: 'freepad' }
      }
    })
    return sensorList
  },

  /**
   * 更新全屋设备列表
   * FIXME 只有非首次app.onShow时才执行
   */
  async updateAllRoomDeviceList(houseId: string = homeStore.currentHomeId, options?: IApiRequestOption) {
    const res = await queryAllDevice(houseId, options)
    const { currentRoomId = '' } = roomStore
    if (!res.success) {
      console.log('加载全屋设备失败！', res)
      return
    }

    runInAction(() => {
      deviceStore.allRoomDeviceList = res.result
      deviceStore.allRoomDeviceTimestamp = res.timestamp

      if (currentRoomId && res.result?.length) {
        deviceStore.deviceList = res.result.filter((device) => device.roomId === currentRoomId)
        deviceStore.deviceTimestamp = res.timestamp
        emitter.emit('roomDeviceSync')
      }

      this.updateAllRoomDeviceListLanStatus()
    })
  },

  /**
   * 更新当前房间设备列表
   */
  async updateRoomDeviceList(
    houseId: string = homeStore.currentHomeId,
    roomId: string = roomStore.currentRoomId,
    options?: IApiRequestOption,
  ) {
    const res = await querySubDeviceList({ houseId, roomId }, { ...options, loading: true })
    if (!res.success) {
      console.log('加载房间设备失败！', res)
      return
    }

    runInAction(() => {
      deviceStore.deviceList = res.result
      deviceStore.deviceTimestamp = res.timestamp
      this.updateAllRoomDeviceListLanStatus()
    })
  },

  /**
   * 更新全屋设备列表的局域网状态
   */
  updateAllRoomDeviceListLanStatus() {
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

    runInAction(() => {
      deviceStore.allRoomDeviceList = allRoomDeviceList
    })
  },
  /**
   * 更新全屋设备的在离线状态
   */
  updateAllRoomDeviceOnLineStatus(isOnLine = true) {
    const allRoomDeviceList = deviceStore.allRoomDeviceList.map((item) => {
      return {
        ...item,
        onLineStatus: isOnLine ? 1 : 0,
      }
    })

    runInAction(() => {
      deviceStore.allRoomDeviceList = allRoomDeviceList
    })
  },
})

export const deviceBinding = {
  store: deviceStore,
  fields: ['deviceList', 'allRoomDeviceList', 'deviceFlattenList', 'deviceTimestamp'],
  actions: [],
}
