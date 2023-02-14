import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding } from '../../store/index'

Component({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    isAddRoom: false,
    deviceInfo: {
      roomId: '',
      deviceName: '',
    },
    roomList: [],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    selectRoom(event: WechatMiniprogram.CustomEvent) {
      console.log('selectRoom', event)

      this.setData({
        'deviceInfo.roomId': event.currentTarget.dataset.id,
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
        'deviceInfo.deviceName': event.detail,
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
