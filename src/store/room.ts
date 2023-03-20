import { observable, runInAction } from 'mobx-miniprogram'
import { getRoomList } from '../apis/index'
import { proType } from '../config/index'
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

  async updateRoomList(options?: { loading: boolean }) {
    const res = await getRoomList(homeStore.currentHomeId, options)
    if (res.success) {
      res.result.roomInfoList.forEach((roomInfo) => {
        const roomDeviceList = roomStore.roomDeviceList[roomInfo.roomInfo.roomId]
        // 过滤一下默认场景，没灯过滤明亮柔和，没灯没开关全部过滤
        const hasSwitch = roomDeviceList?.some((device) => device.proType === proType.switch) ?? false
        const hasLight = roomDeviceList?.some((device) => device.proType === proType.light) ?? false
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
          if (device.proType !== proType.gateway) {
            subDeviceNum++
          }
          if (!device.onLineStatus) return
          if (device.proType === proType.light && device.mzgdPropertyDTOList['1'].OnOff) {
            deviceLightOnNum++
          } else if (device.proType === proType.switch) {
            device.switchInfoDTOList.forEach((switchItem) => {
              if (
                !switchItem.lightRelId &&
                device.mzgdPropertyDTOList[switchItem.switchId].OnOff &&
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
  fields: ['roomList', 'currentRoomIndex', 'roomDeviceList'],
  actions: [],
}
