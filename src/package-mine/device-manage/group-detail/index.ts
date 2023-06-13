import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import { deviceStore, homeBinding, homeStore, otaStore, roomBinding } from '../../../store/index'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { delGroup, editDeviceInfo, queryGroup } from '../../../apis/index'
import { proName, proType } from '../../../config/index'
import Dialog from '@vant/weapp/dialog/dialog'
import { emitter, checkWifiSwitch } from '../../../utils/index'
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, homeBinding] }), pageBehavior],
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
    firstShow: true,
  },

  computed: {
    roomName(data) {
      if (data.roomList && data.roomId) {
        return data.roomList.find((room: { roomId: string }) => room.roomId === data.roomId)?.roomName
      }
      return ''
    },
    mac(data) {
      if (data.deviceInfo.deviceType === 1) {
        return data.deviceInfo.sn.substring(8, 9) + data.deviceInfo.sn.substring(17, 28)
      } else {
        return data.deviceId
      }
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
    canEditDevice(data) {
      return data.isCreator || data.isAdmin
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
      this.updateGroupInfo()
    },

    onShow() {
      if (this.data.firstShow) {
        this.setData({
          firstShow: false,
        })
        return
      }
      this.updateGroupInfo()
    },

    handleDeviceNameEditPopup() {
      if (!this.data.canEditDevice) return
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
        this.updateGroupInfo()
        emitter.emit('deviceEdit')
      }
    },
    handleDeviceRoomEditPopup() {
      if (!this.data.canEditDevice) return
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
        this.updateGroupInfo()
        homeStore.updateRoomCardList()
        emitter.emit('deviceEdit')
      }
    },
    handleToOTA() {
      if (!this.data.canEditDevice) return
      wx.navigateTo({
        url: '/package-mine/ota/index?fromDevice=1',
      })
    },
    handleDeviceDelete() {
      if (!this.data.canEditDevice) return
      Dialog.confirm({
        title: '确定解散该灯组？',
      }).then(async () => {
        const res = await delGroup({
          groupId: this.data.deviceId,
        })
        if (res.success) {
          Toast('删除成功')
          homeStore.updateRoomCardList()
          emitter.emit('deviceEdit')
          emitter.emit('homeInfoEdit')
          wx.navigateBack()
        } else {
          Toast('删除失败')
        }
      })
    },
    async updateGroupInfo() {
      const res = await queryGroup({ groupId: this.data.deviceId })
      if (res.success) {
        this.setData({
          deviceName: res.result.groupName,
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
        this.updateGroupInfo()
      }
    },

    clickMac() {
      wx.setClipboardData({
        data: this.data.mac,
      })
    },

    toChangeWifi() {
      // 预校验wifi开关是否打开
      if (!checkWifiSwitch()) {
        return
      }

      wx.navigateTo({
        url: `/package-distribution/wifi-connect/index?type=changeWifi&sn=${this.data.deviceInfo.sn}`,
      })
    },
  },
})
