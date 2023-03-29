import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import { deviceStore, homeStore, otaStore, roomBinding } from '../../../store/index'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { deleteDevice, editDeviceInfo, queryDeviceInfoByDeviceId } from '../../../apis/index'
import { proName, proType } from '../../../config/index'
import Dialog from '@vant/weapp/dialog/dialog'
import { emitter } from '../../../utils/eventBus'
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    roomId: '',
    deviceId: '',
    deviceName: '',
    showEditNamePopup: false,
    showEditRoomPopup: false,
    deviceInfo: {} as Device.DeviceItem,
    gatewayDesc: '',
  },

  computed: {
    roomName(data) {
      if (data.roomList && data.roomId) {
        return data.roomList.find((room: { roomId: string }) => room.roomId === data.roomId)?.roomName
      }
      return ''
    },
    prodType(data) {
      if (data.deviceInfo.proType) {
        return proName[data.deviceInfo.proType]
      }
      return ''
    },
    isSubDevice(data) {
      return ([proType.switch, proType.light] as string[]).includes(data.deviceInfo.proType)
    },
    belongsToGateway(data) {
      if (data.deviceInfo.gatewayId) {
        const gateway = deviceStore.allRoomDeviceList.find((device) => device.deviceId === data.deviceInfo.gatewayId)
        if (gateway) {
          return `${gateway.deviceName} | ${gateway.roomName}`
        }
        return ''
      }
      return ''
    },
    hasOtaUpdate(data) {
      if (data.deviceInfo.deviceId) {
        return !!otaStore.deviceVersionInfoMap[data.deviceInfo.deviceId]
      }
      return false
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad({ deviceId, roomId }: { deviceId: string; roomId: string }) {
      this.setData({
        deviceId,
        roomId,
      })
      this.updateDeviceInfo()
      // checkOtaVersion(deviceId).then((res) => {
      //   console.log('ota', res)
      // })
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
    async handleDeviceNameEditConfirm(e: { detail: string }) {
      if (!e.detail) {
        Toast('设备名称不能为空')
        return
      }
      this.setData({
        showEditNamePopup: false,
        deviceName: e.detail,
      })
      const res = await editDeviceInfo({
        type: '0',
        deviceId: this.data.deviceId,
        deviceName: this.data.deviceName,
        houseId: homeStore.currentHomeDetail.houseId,
      })
      if (res.success) {
        this.updateDeviceInfo()
        emitter.emit('deviceEdit')
      }
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
    async handleDeviceRoomEditConfirm(e: { detail: string }) {
      this.setData({
        showEditRoomPopup: false,
        roomId: e.detail,
      })
      const res = await editDeviceInfo({
        type: '1',
        deviceId: this.data.deviceId,
        roomId: this.data.roomId,
        houseId: homeStore.currentHomeDetail.houseId,
      })
      if (res.success) {
        this.updateDeviceInfo()
        homeStore.updateRoomCardList()
        emitter.emit('deviceEdit')
      }
    },
    handleToOTA() {
      wx.navigateTo({
        url: '/package-mine/ota/index?fromDevice=1',
      })
    },
    handleDeviceDelete() {
      Dialog.confirm({
        title: '确定删除该设备？',
      }).then(async () => {
        const res = await deleteDevice({
          deviceId: this.data.deviceId,
          deviceType: this.data.deviceInfo.deviceType,
          sn: this.data.deviceInfo.proType === proType.gateway ? this.data.deviceInfo.sn : this.data.deviceId,
        })
        if (res.success) {
          Toast('删除成功')
          homeStore.updateRoomCardList()
          emitter.emit('deviceEdit')
          wx.navigateBack()
        } else {
          Toast('删除失败')
        }
      })
    },
    async updateDeviceInfo() {
      const res = await queryDeviceInfoByDeviceId({ deviceId: this.data.deviceId, roomId: this.data.roomId })
      if (res.success) {
        this.setData({
          deviceInfo: res.result,
          deviceName: res.result.deviceName,
          roomId: res.result.roomId,
        })
      }
    },
    async editDeviceInfo() {
      const res = await editDeviceInfo({
        deviceId: this.data.deviceId,
        deviceName: this.data.deviceName,
        roomId: this.data.roomId,
        houseId: homeStore.currentHomeDetail.houseId,
      })
      if (res.success) {
        this.updateDeviceInfo()
      }
    },
  },
})
