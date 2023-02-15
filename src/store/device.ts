import { observable } from 'mobx-miniprogram'
import { getDeviceList, getSubDeviceList } from '../apis/device'
import { homeStore } from './home'
import { roomStore } from './room'

export const deviceStore = observable({
  /**
   * 当前房间
   */
  deviceList: [] as Device.DeviceItem[],
  /**
   * 选了了那些设备
   */
  selectList: [] as string[],
  /**
   * 选择了什么类型
   */
  selectType: [] as string[],
  /**
   * 选择了多少个开关
   */
  selectSwitchList: [] as string[],

  async updateDeviceList(
    houseId: string = homeStore.currentHomeDetail.houseId,
    roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomInfo.roomId,
  ) {
    const res = await getDeviceList(houseId, roomId)
    console.log(res)
  },

  async updateSubDeviceList(
    houseId: string = homeStore.currentHomeDetail.houseId,
    roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomInfo.roomId,
  ) {
    const res = await getSubDeviceList(houseId, roomId)
    console.log(res)
  },
})

export const deviceBinding = {
  store: deviceStore,
  fields: ['selectList', 'selectType', 'selectSwitchList', 'selectLinkDevice'],
  actions: [],
}
