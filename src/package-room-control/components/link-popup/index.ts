import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceBinding, deviceStore, roomBinding, roomStore } from '../../../store/index'
import Toast from '@vant/weapp/toast/toast'
import { checkWifiSwitch } from '../../../utils/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    /**
     * 展示的列表
     * linkType 是 switch light 传入 Device.DeviceItem[]
     * linkType 是 scene 传入 Scene.SceneItem[]
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
    /**
     * 选中的场景id
     */
    selectSceneId: {
      type: String,
    },
    show: {
      type: Boolean,
      value: false,
      observer(val) {
        if (val) {
          setTimeout(() => {
            this.getHeight()
          }, 100)
          if (!this.data.list.length) {
            Toast({
              message: `当前没有可关联的${this.data.linkType === 'scene' ? '场景' : '设备'}`,
              zIndex: 9999,
            })
          }
        }
        if (this.data.roomListComputed.length) {
          this.setData({
            roomSelect: this.data.roomListComputed[0].roomId,
          })
        }
      },
    },
    /** 展示类型：light switch scene */
    linkType: {
      type: String,
    },
    hasReturn: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    contentHeight: 0,
    roomSelect: '',
    showDeviceOffline: false,
    officeDeviceInfo: {} as Device.DeviceItem,
  },

  computed: {
    title(data) {
      if (data.linkType === 'light') {
        return '关联智能灯'
      } else if (data.linkType === 'switch') {
        return '关联智能开关'
      } else if (data.linkType === 'scene') {
        return '关联场景'
      }
      return ''
    },
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
        if (data.linkType === 'scene') {
          return data.list.filter((scene: Scene.SceneItem) => scene.roomId === data.roomSelect)
        } else {
          return data.list.filter((device: Device.DeviceItem) => device.roomId === data.roomSelect)
        }
      }
      return []
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap(e: { detail: { uniId?: string; sceneId?: string } }) {
      this.triggerEvent('select', this.data.linkType === 'scene' ? e.detail.sceneId : e.detail.uniId)
    },
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm')
    },
    handleReturn() {
      this.triggerEvent('return')
    },
    getHeight() {
      this.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
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
