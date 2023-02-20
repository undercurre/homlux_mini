// package-mine/hoom-manage/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { roomBinding } from '../../store/index'

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
    addRoom() {
      this.setData({
        isAddRoom: true,
      })
    },

    finishAddRoom() {
      this.setData({
        isAddRoom: false,
      })
    },
  },
})
