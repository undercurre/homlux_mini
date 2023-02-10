import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding } from '../../../store/index'
import pageBehavior from '../../../behaviors/pageBehaviors'
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    roomId: '',
    deviceId: '',
    device: null,
  },

  computed: {
    title(data) {
      if (data.roomList && data.roomList.length > 0) {
        const room = data.roomList.find((room: { roomId: string }) => room.roomId === data.roomId)
        if (room.deviceList && room.deviceList.length > 0) {
          return room.deviceList.find((device: { deviceId: string }) => device.deviceId === data.deviceId).deviceName
        }
      }
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(value: { roomId: string; deviceId: string }) {
      this.setData({
        roomId: value.roomId,
        deviceId: value.deviceId,
      })
    },

    handleDeviceNameEditPopup() {
      console.log(111)
    },
  },
})
