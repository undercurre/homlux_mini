import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import { deviceStore, homeBinding, homeStore, otaStore, roomBinding, roomStore } from '../../../store/index'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { waitingDeleteDevice, editDeviceInfo, queryDeviceInfoByDeviceId } from '../../../apis/index'
import { proName, PRO_TYPE, SCREEN_PID } from '../../../config/index'
import Dialog from '@vant/weapp/dialog/dialog'
import { emitter } from '../../../utils/index'

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
      // 网关规则
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
    // 普通网关，排除智慧屏
    isGateway(data) {
      return data.deviceInfo.deviceType === 1 && !data.deviceInfo.isScreenGateway
    },
    isSubDevice(data) {
      return data.deviceInfo.deviceType === 2
    },
    isSubDeviceOrGateway(data) {
      return [1, 2].includes(data.deviceInfo.deviceType)
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
    /**
     * @description 是否显示按键设置
     * 包括面板，智慧屏
     */
    hasSwitchSetting(data) {
      return data.deviceInfo.proType === PRO_TYPE.switch || SCREEN_PID.includes(data.deviceInfo.productId)
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

      this.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          console.log(res)
          if (res[0]?.height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },

    onShow() {
      if (this.data.firstShow) {
        this.setData({
          firstShow: false,
        })
        return
      }
      this.updateDeviceInfo()
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
        deviceType: this.data.deviceInfo.deviceType,
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
        deviceType: this.data.deviceInfo.deviceType,
        deviceId: this.data.deviceId,
        roomId: this.data.roomId,
        houseId: homeStore.currentHomeDetail.houseId,
      })
      if (res.success) {
        this.updateDeviceInfo()
        await homeStore.updateRoomCardList()
        await roomStore.updateRoomList()
        roomStore.updateRoomCardLightOnNum()
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
        title: '确定删除该设备？',
      }).then(async () => {
        const res = await waitingDeleteDevice({
          deviceId: this.data.deviceId,
          deviceType: this.data.deviceInfo.deviceType,
          sn: this.data.deviceInfo.proType === PRO_TYPE.gateway ? this.data.deviceInfo.sn : this.data.deviceId,
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

    clickMac() {
      wx.setClipboardData({
        data: this.data.mac,
      })
    },
  },
})
