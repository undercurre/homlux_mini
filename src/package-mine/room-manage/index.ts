// package-mine/hoom-manage/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { roomBinding, othersBinding, userBinding } from '../../store/index'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, othersBinding, userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {},

  computed: {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  methods: {},
})
