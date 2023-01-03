import { observable } from 'mobx-miniprogram'
import { sceneMap } from '../config/index'

export const room = observable({
  roomList: [
    {
      roomId: '1',
      roomName: '客厅',
      lightOnNumber: 3,
      sceneList: [sceneMap['all-on'], sceneMap['all-off'], sceneMap['bright'], sceneMap['mild']],
      sceneSelect: 'all-on',
    },
    {
      roomId: '2',
      roomName: '卧室',
      lightOnNumber: 0,
      sceneList: [sceneMap['all-on'], sceneMap['all-off'], sceneMap['bright'], sceneMap['mild']],
      sceneSelect: 'all-off',
    },
  ], // 测试数据，需要根据接口进行修改
  currentRoomIndex: 0, // 当前选择的房间，在roomList里的index
})
