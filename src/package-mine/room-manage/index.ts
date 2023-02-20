// package-mine/hoom-manage/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { roomBinding } from '../../store/index'
import { strUtil } from '../../utils/index'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isAddRoom: false,
  },

  computed: {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  methods: {
    editRoom(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset

      const item = roomBinding.store.roomList[index]

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-mine/room-detail/index', {
          roomId: item.roomId,
          roomName: item.roomName,
          roomIcon: item.roomIcon,
        }),
      })
    },

    addRoom() {
      this.setData({
        isAddRoom: true,
      })
    },

    cancelAddRoom() {
      this.setData({
        isAddRoom: false,
      })
    },

    finishAddRoom() {
      this.setData({
        isAddRoom: false,
      })
    },
  },
})
