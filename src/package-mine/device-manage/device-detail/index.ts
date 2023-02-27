import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeStore, roomBinding } from '../../../store/index'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { checkOtaVersion, deleteDevice, editDeviceInfo, queryDeviceInfoByDeviceId } from '../../../apis/index'
import { proName, proType } from '../../../config/index'
import Dialog from '@vant/weapp/dialog/dialog'
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
      checkOtaVersion(deviceId).then((res) => {
        console.log(res)
      })
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
      if (!e.detail) {
        wx.showToast({
          icon: 'error',
          title: '设备名称不能为空',
        })
        return
      }
      this.setData({
        showEditNamePopup: false,
        deviceName: e.detail,
      })
      this.editDeviceInfo()
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
    handleDeviceRoomEditConfirm(e: { detail: string }) {
      this.setData({
        showEditRoomPopup: false,
        roomId: e.detail,
      })
      this.editDeviceInfo()
    },
    handleToOTA() {
      wx.navigateTo({
        url: '/package-mine/device-manage/ota/index',
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
          wx.showToast({
            icon: 'success',
            title: '删除成功',
          })
          wx.navigateBack()
        } else {
          wx.showToast({
            icon: 'error',
            title: '删除失败',
          })
        }
      })
    },
    async updateDeviceInfo() {
      const res = await queryDeviceInfoByDeviceId(this.data.deviceId)
      if (res.success) {
        this.setData({
          deviceInfo: res.result,
          deviceName: res.result.deviceName,
          roomId: res.result.roomId,
        })
      }
    },
    async editDeviceInfo(isSwitch?: boolean) {
      if (isSwitch) {
        //todo
      } else {
        const res = await editDeviceInfo({
          isSwitch: false,
          deviceId: this.data.deviceId,
          deviceName: this.data.deviceName,
          roomId: this.data.roomId,
          houseId: homeStore.currentHomeDetail.houseId,
        })
        if (res.success) {
          this.updateDeviceInfo()
        }
      }
    },
  },
})
