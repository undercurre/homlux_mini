import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, deviceBinding, deviceStore } from '../../store/index'
import { emitter } from '../../utils/eventBus'

type SimRoomInfo = Pick<Room.RoomInfo, 'roomId' | 'roomName'>

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    sDeviceList: {
      type: Array,
      value: [],
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    roomSelect: '0',
    roomMenuList: [] as SimRoomInfo[],
  },
  computed: {},

  lifetimes: {
    async ready() {
      await deviceStore.updateAllRoomDeviceList()
      this.getRoomMenuList()

      emitter.on('deviceEdit', async () => {
        await deviceStore.updateAllRoomDeviceList()
        this.getRoomMenuList()
      })
    },
    detached() {
      emitter.off('deviceEdit')
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * @description 包括待选设备的房间列表
     * 默认塞入全部设备
     */
    getRoomMenuList() {
      const list = this.data.sDeviceList?.length ? this.data.sDeviceList : deviceStore.allRoomDeviceList
      const deviceList: Device.DeviceItem[] = list.filter((device: Device.DeviceItem) => device.deviceType === 2)
      const roomList: SimRoomInfo[] = []

      deviceList.forEach(({ roomId, roomName }) => {
        if (roomList.findIndex((room) => room.roomId === roomId) === -1) {
          roomList.push({
            roomId,
            roomName,
          })
        }
      })

      this.setData({
        roomMenuList: roomList ? [{ roomId: '0', roomName: '全屋' }, ...roomList] : [],
      })
    },
    handleRoomSelect(e: WechatMiniprogram.TouchEvent) {
      const roomSelect = e.currentTarget.dataset.item.roomId
      this.setData({ roomSelect })
      this.triggerEvent('roomSelect', roomSelect)
    },
  },
})
