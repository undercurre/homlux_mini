import { observable, runInAction } from 'mobx-miniprogram'
import { getRoomList } from '../apis/index'
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
  /**
   * 房间详细信息
   */
  // roomDetail: {

  // },

  async updateRoomList() {
    const res = await getRoomList(homeStore.currentHomeId)
    if (res.success) {
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
