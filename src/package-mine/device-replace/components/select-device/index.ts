import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, deviceBinding } from '../../../../store/index'

Component({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] })],

  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  lifetimes: {
    async ready() {
      await roomBinding.store.updateRoomList()

      deviceBinding.store.updateDeviceList()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap(event: WechatMiniprogram.CustomEvent) {
      console.log('changeRoomName', event)
    },

    handleClose() {
      this.triggerEvent('close')
    },
  },
})
