import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import { homeBinding, homeStore, roomBinding } from '../../../store/index'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { delGroup, queryGroup, renameGroup } from '../../../apis/index'
import { proName } from '../../../config/index'
import Dialog from '@vant/weapp/dialog/dialog'
import { emitter } from '../../../utils/index'
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, homeBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    roomId: '',
    groupId: '',
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
    prodType(data) {
      if (data.deviceInfo.proType) {
        return proName[data.deviceInfo.proType]
      }
      return ''
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
        groupId: deviceId,
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
        Toast('灯组名称不能为空')
        return
      }

      this.setData({
        showEditNamePopup: false,
        deviceName: e.detail,
      })
      const res = await renameGroup({
        groupId: this.data.groupId,
        groupName: this.data.deviceName,
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
    handleGroupDelete() {
      if (!this.data.canEditDevice) return
      Dialog.confirm({
        title: '确定解散该灯组？',
      }).then(async () => {
        const res = await delGroup({
          groupId: this.data.groupId,
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
      const res = await queryGroup({ groupId: this.data.groupId })
      if (res.success) {
        this.setData({
          deviceInfo: res.result,
          deviceName: res.result.groupName,
          roomId: res.result.roomId,
        })
      }
    },
  },
})
