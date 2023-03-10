import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, roomBinding } from '../../../../store/index'

Component({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding] })],

  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },

  observers: {},

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    changeRoomName(event: WechatMiniprogram.CustomEvent) {
      console.log('changeRoomName', event)

      this.setData({
        'roomInfo.name': event.detail.value,
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },
  },
})
