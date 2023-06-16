import { observable, runInAction } from 'mobx-miniprogram'
import { getRoomList } from '../apis/index'
import { PRO_TYPE } from '../config/index'
import { deviceStore } from './device'
import { homeStore } from './home'

export const roomStore = observable({
  /**
   * 当前家庭的房间列表
   */
  roomList: [] as Room.RoomInfo[],
  /**
   * 选择进入了哪个房间，在roomList中的index
   */
  currentRoomIndex: 0,
  /** 全屋设备，对应房间id作为key，房间的设备列表作为key */
  roomDeviceList: {} as Record<string, Device.DeviceItem[]>,

  get currentRoom(): Room.RoomInfo {
    return this.roomList[this.currentRoomIndex]
  },

  /**
   * 更新房间开灯数量
   * ButtonMode 0 普通面板或者关联开关 2 场景 3 关联灯
   */
  updateRoomCardLightOnNum() {
    const list = {} as Record<string, Device.DeviceItem[]>
    deviceStore.allRoomDeviceList
      .sort((a, b) => a.deviceId.localeCompare(b.deviceId))
      .forEach((device) => {
        if (list[device.roomId]) {
          list[device.roomId].push(device)
        } else {
          list[device.roomId] = [device]
        }
      })
    roomStore.roomList.forEach((roomInfo) => {
      const roomDeviceList = list[roomInfo.roomId]
      // 统计多少灯打开（开关不关联灯或者关联场景都算进去）
      let deviceLightOnNum = 0
      // 统计多少个子设备
      let subDeviceNum = 0
      roomDeviceList?.forEach((device) => {
        if (device.proType !== PRO_TYPE.gateway) {
          subDeviceNum++
        }
        if (!device.onLineStatus) return
        if (device.proType === PRO_TYPE.light && device.mzgdPropertyDTOList['1']?.OnOff) {
          deviceLightOnNum++
        } else if (device.proType === PRO_TYPE.switch) {
          device.switchInfoDTOList.forEach((switchItem) => {
            if (
              device.mzgdPropertyDTOList && // 避免个别设备未上报数据导致的整个页面异常
              device.mzgdPropertyDTOList[switchItem.switchId]?.OnOff &&
              device.mzgdPropertyDTOList[switchItem.switchId].ButtonMode === 0
            ) {
              deviceLightOnNum++
            }
          })
        }
      })
      roomInfo.deviceLightOnNum = deviceLightOnNum
      roomInfo.subDeviceNum = subDeviceNum
    })

    runInAction(() => {
      roomStore.roomDeviceList = list
      roomStore.roomList = [...roomStore.roomList]
    })
  },

  async updateRoomList(options?: { loading: boolean }) {
    const res = await getRoomList(homeStore.currentHomeId, options)
    if (res.success) {
      res.result.roomInfoList.forEach((roomInfo) => {
        const roomDeviceList = roomStore.roomDeviceList[roomInfo.roomInfo.roomId]
        // 过滤一下默认场景，没灯过滤明亮柔和，没灯没开关全部过滤
        const hasSwitch = roomDeviceList?.some((device) => device.proType === PRO_TYPE.switch) ?? false
        const hasLight = roomDeviceList?.some((device) => device.proType === PRO_TYPE.light) ?? false
        if (!hasSwitch && !hasLight) {
          // 四个默认场景都去掉
          roomInfo.roomSceneList = roomInfo.roomSceneList.filter((scene) => scene.isDefault === '0')
        } else if (hasSwitch && !hasLight) {
          // 只有开关，去掉默认的明亮、柔和
          roomInfo.roomSceneList = roomInfo.roomSceneList.filter((scene) => !['2', '3'].includes(scene.defaultType))
        }
        // 统计多少灯打开（开关不关联灯或者关联场景都算进去）
        let deviceLightOnNum = 0
        // 统计多少个子设备
        let subDeviceNum = 0
        roomDeviceList?.forEach((device) => {
          if (device.proType !== PRO_TYPE.gateway) {
            subDeviceNum++
          }
          if (!device.onLineStatus) return
          if (device.proType === PRO_TYPE.light && device.mzgdPropertyDTOList['1'].OnOff) {
            deviceLightOnNum++
          } else if (device.proType === PRO_TYPE.switch) {
            device.switchInfoDTOList.forEach((switchItem) => {
              if (
                device.mzgdPropertyDTOList && // 避免个别设备未上报数据导致的整个页面异常
                device.mzgdPropertyDTOList[switchItem.switchId]?.OnOff &&
                !device.mzgdPropertyDTOList[switchItem.switchId].ButtonMode
              ) {
                deviceLightOnNum++
              }
            })
          }
        })
        roomInfo.roomInfo.deviceLightOnNum = deviceLightOnNum
        roomInfo.roomInfo.subDeviceNum = subDeviceNum
      })

      runInAction(() => {
        roomStore.roomList = res.result.roomInfoList.map((room) => ({
          roomId: room.roomInfo.roomId,
          roomIcon: room.roomInfo.roomIcon || 'drawing-room',
          roomName: room.roomInfo.roomName,
          deviceLightOnNum: room.roomInfo.deviceLightOnNum,
          sceneList: room.roomSceneList,
          deviceNum: room.roomInfo.deviceNum,
          subDeviceNum: room.roomInfo.subDeviceNum,
        }))
      })
    }
  },
})

export const roomBinding = {
  store: roomStore,
  fields: ['roomList', 'currentRoomIndex', 'roomDeviceList', 'currentRoom'],
  actions: [],
}
