import { observable, runInAction } from 'mobx-miniprogram'
import { getRoomList, queryAllDevice } from '../apis/index'
import { proType } from '../config/index'
import { homeStore } from './home'

export const roomStore = observable({
  /**
   * 当前家庭的房间列表
   */
  roomList: [] as Room.RoomInfo[],
  /**
   * 选择进入了哪个房间，在roomList中的index todo:
   */
  currentRoomIndex: 0,
  /** 全屋设备，对应房间id作为key，房间的设备列表作为key */
  roomDeviceList: {} as Record<string, Device.DeviceItem[]>,

  async updataHomeDeviceList() {
    const res = await queryAllDevice(homeStore.currentHomeDetail.houseId)
    const list = {} as Record<string, Device.DeviceItem[]>
    if (res.success) {
      res.result.forEach((device) => {
        if (list[device.roomId]) {
          list[device.roomId].push(device)
        } else {
          list[device.roomId] = [device]
        }
      })
      runInAction(() => {
        roomStore.roomDeviceList = list
      })
      return
    } else {
      return Promise.reject('获取全屋设备信息失败')
    }
  },

  async updateRoomList() {
    const res = await getRoomList(homeStore.currentHomeId)
    if (res.success) {
      res.result.roomInfoList.forEach((roomInfo) => {
        const roomDeviceList = roomStore.roomDeviceList[roomInfo.roomInfo.roomId]
        const hasSwitch = roomDeviceList?.some((device) => device.proType === proType.switch) ?? false
        const hasLight = roomDeviceList?.some((device) => device.proType === proType.light) ?? false
        if (!hasSwitch && !hasLight) {
          // 四个默认场景都去掉
          roomInfo.roomSceneList = roomInfo.roomSceneList.filter((scene) => scene.isDefault === '0')
        } else if (hasSwitch && !hasLight) {
          // 只有开关，去掉默认的明亮、柔和
          roomInfo.roomSceneList = roomInfo.roomSceneList.filter((scene) => !['2', '3'].includes(scene.defaultType))
        }
      })
      runInAction(() => {
        roomStore.roomList = res.result.roomInfoList.map((room) => ({
          roomId: room.roomInfo.roomId,
          roomIcon: room.roomInfo.roomIcon || 'drawing-room',
          roomName: room.roomInfo.roomName,
          deviceLightOnNum: room.roomInfo.deviceLightOnNum,
          sceneList: room.roomSceneList,
          deviceNum: room.roomInfo.deviceNum,
        }))
      })
    }
  },
})

export const roomBinding = {
  store: roomStore,
  fields: ['roomList', 'currentRoomIndex'],
  actions: [],
}
