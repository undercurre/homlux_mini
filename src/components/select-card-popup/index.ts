import { ComponentWithComputed } from 'miniprogram-computed'
import { deviceStore, roomStore } from '../../store/index'
import { checkWifiSwitch } from '../../utils/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    /**
     * 弹窗标题
     */
    title: {
      type: String,
    },
    /**
     * 展示的列表
     * cardType 是 switch light 传入 Device.DeviceItem[]
     * cardType 是 scene 传入 Scene.SceneItem[]
     */
    list: {
      type: Array,
    },
    /**
     * 选中的设备的uniId
     * 灯：deviceId ；开关：deviceId:switchId
     */
    selectList: {
      type: Array,
    },
    show: {
      type: Boolean,
      value: false,
      observer() {
        if (this.data.roomListComputed.length) {
          this.setData({
            roomSelect: this.data.roomListComputed[0].roomId,
          })
        }
      },
    },
    /** 展示类型：light switch scene */
    cardType: {
      type: String,
      value: 'device',
    },
    showCancel: {
      type: Boolean,
      value: true,
    },
    cancelText: {
      type: String,
      value: '上一步',
    },
    showConfirm: {
      type: Boolean,
      value: true,
    },
    confirmlText: {
      type: String,
      value: '确定',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    roomSelect: '',
    showDeviceOffline: false,
    officeDeviceInfo: {} as Device.DeviceItem,
  },

  computed: {
    roomListComputed(data) {
      const roomList = [] as Room.RoomInfo[]
      // 从roomList遍历，保证房间顺序， 仅显示list的数据所在的房间列表
      roomStore.roomList.forEach((room) => {
        const isIncludes = data.list.some((item: { roomId: string }) => {
          if (item.roomId === room.roomId) {
            return true
          }
          return false
        })
        if (isIncludes) {
          roomList.push(room)
        }
      })
      return roomList
    },
    listComputed(data) {
      if (data.list) {
        return data.list.filter((item: Scene.SceneItem | Device.DeviceItem) => item.roomId === data.roomSelect)
      }
      return []
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async handleCardTap(e: { detail: { uniId?: string; sceneId?: string } }) {
      this.triggerEvent('select', e.detail.sceneId || e.detail.uniId)
    },
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm')
    },
    handleCancel() {
      this.triggerEvent('cancel')
    },
    handleRoomSelect(e: WechatMiniprogram.TouchEvent) {
      this.setData({
        roomSelect: e.currentTarget.dataset.item.roomId,
      })
    },
    handleOfflineTap(e: { detail: Device.DeviceItem }) {
      this.setData({
        showDeviceOffline: true,
        officeDeviceInfo: e.detail,
      })
      this.triggerEvent('offlineTap', e.detail)
    },
    handleCloseDeviceOffline() {
      this.setData({
        showDeviceOffline: false,
      })
    },
    handleRebindGateway() {
      // 预校验wifi开关是否打开
      if (!checkWifiSwitch()) {
        return
      }

      const gateway = deviceStore.allRoomDeviceMap[this.data.officeDeviceInfo.gatewayId]
      wx.navigateTo({
        url: `/package-distribution/wifi-connect/index?type=changeWifi&sn=${gateway.sn}`,
      })
    },
    blank() {},
  },
})
