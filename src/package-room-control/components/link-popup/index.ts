import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceBinding, deviceStore, roomBinding, roomStore } from '../../../store/index'

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
        }
        if (this.data.roomListComputed.length > 0) {
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
      const roomMap = roomStore.roomMap
      const roomListSet = new Set<string>(data.list.map((item: { roomId: string }) => item.roomId))
      const roomList = [] as Room.RoomInfo[]
      roomListSet.forEach((roomId) => roomList.push(roomMap[roomId]))
      return roomList
    },
    listComputed(data) {
      if (data.list) {
        if (data.linkType === 'scene') {
          console.log(
            data.list.filter((scene: Scene.SceneItem) => {
              console.log(data.roomSelect, data.list)
              return scene.roomId === data.roomSelect
            }),
          )
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
    handleCloseDeviceOffice() {
      this.setData({
        showDeviceOffline: false,
      })
    },
    handleRebindGateway() {
      const gateway = deviceStore.allRoomDeviceMap[this.data.officeDeviceInfo.gatewayId]
      wx.navigateTo({
        url: `/package-distribution/wifi-connect/index?type=changeWifi&sn=${gateway.sn}`,
      })
    },
    blank() {},
  },
})
