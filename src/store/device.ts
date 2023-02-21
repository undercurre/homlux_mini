import { observable, runInAction } from 'mobx-miniprogram'
import { queryAllDevice, queryDeviceList, querySubDeviceList } from '../apis/device'
import { homeStore } from './home'
import { roomStore } from './room'

export const deviceStore = observable({
  /**
   * 当前房间
   */
  deviceList: [] as Device.DeviceItem[],
  /**
   * 当前选择的灯具的状态
   */
  lightInfo: {} as Record<string, number>,
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

  async updateAllRoomDeviceList(houseId: string = homeStore.currentHomeDetail.houseId) {
    const res = await queryAllDevice(houseId)
    if (res.success) {
      runInAction(() => {
        deviceStore.deviceList = res.result
      })
    }
  },

  async updateDeviceList(
    houseId: string = homeStore.currentHomeDetail.houseId,
    roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomId,
  ) {
    const res = await queryDeviceList(houseId, roomId)
    if (res.success) {
      runInAction(() => {
        deviceStore.deviceList = res.result
      })
    }
  },

  async updateSubDeviceList(
    houseId: string = homeStore.currentHomeDetail.houseId,
    roomId: string = roomStore.roomList[roomStore.currentRoomIndex].roomId,
  ) {
    const res = await querySubDeviceList(houseId, roomId)
    if (res.success) {
      runInAction(() => {
        deviceStore.deviceList = res.result
      })
    }
  },
})

export const deviceBinding = {
  store: deviceStore,
  fields: ['selectList', 'selectType', 'selectSwitchList', 'deviceList', 'lightInfo'],
  actions: [],
}
