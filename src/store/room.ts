import { observable } from 'mobx-miniprogram'
import { sceneMap } from '../config/index'

export const room = observable({
  roomList: [
    {
      roomId: '1',
      roomName: '客厅',
      lightOnNumber: 3,
      sceneList: [sceneMap['all-on'], sceneMap['all-off'], sceneMap['bright'], sceneMap['mild']],
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
      sceneSelect: 'all-on',
    },
    {
      roomId: '2',
      roomName: '卧室',
      lightOnNumber: 0,
      sceneList: [sceneMap['all-on'], sceneMap['all-off'], sceneMap['bright'], sceneMap['mild']],
      deviceList: [],
      sceneSelect: 'all-off',
    },
    {
      roomId: '3',
      roomName: '客厅1',
      lightOnNumber: 3,
      sceneList: [sceneMap['all-on'], sceneMap['all-off'], sceneMap['bright'], sceneMap['mild']],
      deviceList: [],
      sceneSelect: 'all-on',
    },
    {
      roomId: '4',
      roomName: '卧室1',
      lightOnNumber: 0,
      sceneList: [sceneMap['all-on'], sceneMap['all-off'], sceneMap['bright'], sceneMap['mild']],
      deviceList: [],
      sceneSelect: 'all-off',
    },
  ], // 测试数据，需要根据接口进行修改
  currentRoomIndex: 0, // 当前选择的房间，在roomList里的index
})

export const roomBinding = {
  store: room,
  fields: ['roomList', 'currentRoomIndex'],
  actions: [],
}
