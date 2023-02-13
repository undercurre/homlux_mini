import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, roomStore } from '../../../store/index'
import pageBehavior from '../../../behaviors/pageBehaviors'
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    roomId: '',
    device: null,
    deviceId: '',
    deviceName: '',
    showEditNamePopup: false,
    showEditRoomPopup: false,
  },

  computed: {
    roomName(data) {
      if (data.roomList) {
        return data.roomList.find((room: { roomId: string }) => room.roomId === data.roomId)?.roomName
      }
      return ''
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
      const room = roomStore.roomList.find((room: { roomId: string }) => room.roomId === this.data.roomId)
      if (room) {
        const deviceName = room.deviceList.find(
          (device: { deviceId: string }) => device.deviceId === this.data.deviceId,
        )?.deviceName
        this.setData({
          deviceName: deviceName ?? '',
          roomId: room.roomId,
        })
      }
    },

    handleDeviceNameEditPopup() {
      this.setData({
        showEditNamePopup: true,
      })
    },
    handleDeviceNameEditCancel() {
      this.setData({
        showEditNamePopup: false,
      })
    },
    handleDeviceNameEditConfirm(e: { detail: string }) {
      this.setData({
        showEditNamePopup: false,
        deviceName: e.detail,
      })
    },
    handleDeviceRoomEditPopup() {
      this.setData({
        showEditRoomPopup: true,
      })
    },
    handleDeviceRoomEditCancel() {
      this.setData({
        showEditRoomPopup: false,
      })
    },
    handleDeviceRoomEditConfirm() {
      this.setData({
        showEditRoomPopup: false,
        // deviceName: e.detail
      })
    },
    handleToOTA() {
      wx.navigateTo({
        url: '/package-mine/device-manage/ota/index',
      })
    },
  },
})
