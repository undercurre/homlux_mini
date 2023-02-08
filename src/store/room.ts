import { observable } from 'mobx-miniprogram'
import { sceneMap } from '../config/index'

export const room = observable({
  roomList: [
    {
      roomId: '1',
      roomName: '客厅',
      icon: 'balcony',
      lightOnNumber: 3,
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
    },
    {
      roomId: '2',
      roomName: '卧室',
      icon: 'bathroom',
      lightOnNumber: 0,
      sceneList: [],
      deviceList: [],
    },
  ], // 测试数据，需要根据接口进行修改
  currentRoomIndex: 0, // 当前选择的房间，在roomList里的index
})

export const roomBinding = {
  store: room,
  fields: ['roomList', 'currentRoomIndex'],
  actions: [],
}
