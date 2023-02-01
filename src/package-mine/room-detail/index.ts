// package-mine/hoom-manage/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import pageBehaviors from '../../behaviors/pageBehaviors'
import Dialog from '@vant/weapp/dialog/dialog'
import { roomBinding, othersBinding, userBinding } from '../../store/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'shared',
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, othersBinding, userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isEditName: false,
    roomInfo: {
      name: '客厅1',
    },
  },

  computed: {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  methods: {
    editName() {
      this.setData({
        isEditName: true,
      })
    },
    onClose() {
      this.setData({
        isEditName: false,
      })
    },
    delRoom() {
      Dialog.confirm({
        message: '弹窗内容',
      })
        .then(() => {
          // on confirm
        })
        .catch(() => {
          // on cancel
        })
    },
  },
})
