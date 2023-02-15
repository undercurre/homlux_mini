import { observable, runInAction } from 'mobx-miniprogram'
import { getRoomList } from '../apis/index'
import { homeStore } from './home'

export const roomStore = observable({
  /**
   * 当前家庭的房间列表
   */
  roomList: [] as Room.RoomItem[],
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
        roomStore.roomList = res.result.roomInfoList
      })
    }
  },
})

export const roomBinding = {
  store: roomStore,
  fields: ['roomList', 'currentRoomIndex'],
  actions: [],
}
