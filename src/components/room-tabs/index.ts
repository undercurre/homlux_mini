import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, deviceBinding, deviceStore } from '../../store/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    roomSelect: '',
  },
  computed: {
    roomSelectMenuList(data: IAnyObject) {
      const roomList: Room.RoomInfo[] = data.roomList
      if (roomList) {
        return [
          { roomId: '', roomName: '全屋' },
          ...roomList.map((room) => ({
            roomId: room.roomId,
            roomName: room.roomName,
          })),
        ]
      }
      return []
    },
  },

  lifetimes: {
    async ready() {
      deviceStore.updateAllRoomDeviceList()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleRoomSelect(e: WechatMiniprogram.TouchEvent) {
      const roomSelect = e.currentTarget.dataset.item.roomId
      this.setData({ roomSelect })
      this.triggerEvent('roomSelect', roomSelect)
    },
  },
})
