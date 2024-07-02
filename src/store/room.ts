import { observable, runInAction } from 'mobx-miniprogram'
import { queryRoomList } from '../apis/index'
import { PRO_TYPE } from '../config/index'
import { deviceStore } from './device'
import { homeStore } from './home'
import { IApiRequestOption } from '../utils/index'

export const roomStore = observable({
  /**
   * 当前家庭的房间列表
   */
  roomList: [] as Room.RoomInfo[],
  /**
   * 选择进入了哪个房间的房间id
   */
  currentRoomId: '',

  get currentRoom(): Room.RoomInfo {
    return this.roomList.find((room) => room.roomId === this.currentRoomId) ?? ({} as Room.RoomInfo)
  },

  /**
   * 设置当前房间
   * @param id 要设置的房间id
   */
  setCurrentRoom(id: string) {
    runInAction(() => {
      // 指定房间id（用户操作）
      if (id) {
        roomStore.currentRoomId = id
        // 比较更新时间戳；若非最新，则按全屋设备列表，筛选出当前房间的设备列表
        if (deviceStore.deviceTimestamp <= deviceStore.allRoomDeviceTimestamp) {
          deviceStore.deviceList = deviceStore.allRoomDeviceList.filter((device) => device.roomId === id)
          deviceStore.deviceTimestamp = deviceStore.allRoomDeviceTimestamp
        }
        deviceStore.updateAllRoomDeviceListLanStatus()
      }
      // 设置为默认房间（列表第一个）；同时重置更新时间戳，以便下次进入房间时刷新
      else if (this.roomList?.length) {
        roomStore.currentRoomId = this.roomList[0].roomId
        deviceStore.deviceTimestamp = 0
      }
    })
  },

  async updateRoomList(options?: IApiRequestOption) {
    const res = await queryRoomList(homeStore.currentHomeId, options)
    if (res.success) {
      res.result.roomInfoList.forEach((room) => {
        // 过滤一下默认场景，没灯过滤明亮柔和，没灯没开关全部过滤
        const hasSwitch = deviceStore.allRoomDeviceList?.some(
          (device) => device.roomId === room.roomInfo.roomId && device.proType === PRO_TYPE.switch,
        )
        const hasLight = deviceStore.allRoomDeviceList?.some(
          (device) => device.roomId === room.roomInfo.roomId && device.proType === PRO_TYPE.light,
        )
        room.roomSceneList?.sort((a, b) => a.orderNum - b.orderNum) // 统一排序
        if (!hasSwitch && !hasLight) {
          // 四个默认场景都去掉
          room.roomSceneList = room.roomSceneList?.filter((scene) => scene.isDefault === '0')
        } else if (hasSwitch && !hasLight) {
          // 只有开关，去掉默认的明亮、柔和
          room.roomSceneList = room.roomSceneList?.filter((scene) => !['2', '3'].includes(scene.defaultType))
        }
      })

      runInAction(() => {
        roomStore.roomList = res.result.roomInfoList.map((room, index) => ({
          roomId: room.roomInfo.roomId,
          groupId: room.roomInfo.groupId,
          roomIcon: room.roomInfo.roomIcon || 'drawing-room',
          roomName: room.roomInfo.roomName,
          sceneList: room.roomSceneList,
          deviceNum: room.roomInfo.deviceNum,
          orderNum: index + 1,
          slimSize: !room.roomSceneList?.length, // 没有场景，显示小尺寸卡片
        }))
      })

      // 若默认房间值未设置，则设置为房间列表第一个
      if (!this.currentRoomId) {
        this.setCurrentRoom('')
      }
    }
  },
})

export const roomBinding = {
  store: roomStore,
  fields: ['roomList', 'currentRoomId', 'currentRoom'],
  actions: [],
}
