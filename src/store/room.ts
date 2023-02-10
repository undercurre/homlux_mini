import { observable, runInAction } from 'mobx-miniprogram'
// import { getRoomList } from '../apis/index'
import { sceneMap } from '../config/index'
import { homeStore } from './home'

// 测试数据，
type RoomList = {
  roomId: string
  roomName: string
  icon: string
  lightOnNumber: number
  sceneList: Scene.SceneInfo[]
  deviceList: (Device.LightInfo | Device.SwitchInfo | Device.CurtainInfo)[]
}

export const roomStore = observable({
  roomList: [] as RoomList[], // 测试数据，需要根据接口进行修改
  currentRoomIndex: 0, // 当前选择的房间，在roomList里的index

  async updateRoomList() {
    // const res = await getRoomList(homeStore.currentHomeId) // todo: 接口未完成
    runInAction(() => {
      console.log(homeStore.currentHomeDetail)
      roomStore.roomList = homeStore.currentHomeDetail.roomList.map((room) => ({
        roomId: room.roomId,
        roomName: room.roomName,
        icon: 'bathroom',
        lightOnNumber: 0,
        sceneList: [
          {
            sceneName: sceneMap['all-on'].name,
            sceneId: '1',
            sceneIcon: sceneMap['all-on'].value,
          },
          {
            sceneName: sceneMap['all-off'].name,
            sceneId: '2',
            sceneIcon: sceneMap['all-off'].value,
          },
          {
            sceneName: sceneMap['bright'].name,
            sceneId: '3',
            sceneIcon: sceneMap['bright'].value,
          },
          {
            sceneName: sceneMap['mild'].name,
            sceneId: '4',
            sceneIcon: sceneMap['mild'].value,
          },
        ] as Scene.SceneInfo[],
        deviceList: [
          // TODO： mock数据，联调后删除
          {
            deviceId: '1',
            deviceName: '筒灯1',
            deviceType: 'light',
            isOnline: true,
            brightness: 50,
            colorTemperature: 50,
            power: true,
          },
          {
            deviceId: '2',
            deviceName: '筒灯2',
            deviceType: 'light',
            isOnline: true,
            brightness: 50,
            colorTemperature: 50,
            power: true,
          },
          {
            deviceId: '3',
            deviceName: '三路开关1',
            deviceType: 'switch',
            isOnline: false,
            linkDeviceId: '1',
          },
          {
            deviceId: '4',
            deviceName: '三路开关2',
            deviceType: 'switch',
            isOnline: true,
            linkDeviceId: '2',
          },
          {
            deviceId: '5',
            deviceName: '三路开关3',
            deviceType: 'switch',
            isOnline: true,
            linkDeviceId: '2',
          },
          {
            deviceId: '6',
            deviceName: '窗帘',
            deviceType: 'curtain',
            isOnline: true,
            openDeg: 50,
          },
        ] as Array<Device.LightInfo | Device.SwitchInfo | Device.CurtainInfo>,
      }))
    })
  },
})

export const roomBinding = {
  store: roomStore,
  fields: ['roomList', 'currentRoomIndex'],
  actions: [],
}
