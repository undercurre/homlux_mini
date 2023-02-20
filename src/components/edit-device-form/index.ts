import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, roomBinding } from '../../store/index'

Component({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    deviceName: {
      type: String,
      value: '',
    },
    roomId: {
      type: String,
      value: '',
    },
  },

  observers: {
    'deviceName, roomId': function (deviceName, roomId) {
      console.log('observers-deviceName', deviceName, roomId)

      this.setData({
        deviceInfo: {
          roomId: roomId,
          roomName: '',
          deviceName: deviceName,
        },
      })
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isAddRoom: false,
    deviceInfo: {
      roomId: '',
      roomName: '',
      deviceName: '',
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    selectRoom(event: WechatMiniprogram.CustomEvent) {
      console.log('selectRoom', event)

      this.setData({
        'deviceInfo.roomId': event.currentTarget.dataset.id,
        'deviceInfo.roomName': event.currentTarget.dataset.name,
      })

      this.triggerEvent('change', Object.assign({}, this.data.deviceInfo))
    },

    addRoom() {
      this.setData({
        isAddRoom: true,
      })
    },

    changeDeviceName(event: WechatMiniprogram.CustomEvent) {
      console.log('changeDeviceName', event)

      this.setData({
        'deviceInfo.deviceName': event.detail.value,
      })

      this.triggerEvent('change', Object.assign({}, this.data.deviceInfo))
    },
    closeAddRoom() {
      this.setData({
        isAddRoom: false,
      })
    },
  },
})
