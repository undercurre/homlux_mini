// package-mine/hoom-manage/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { homeBinding } from '../../store/index'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isEditRole: false,
    actionList: [
      {
        text: '设为管理员',
        label: '与创建者相同的设备/场景管理权限',
        isCheck: true,
      },
      {
        text: '成为访客',
        label: '仅可使用设备与场景',
        isCheck: false,
      },
      {
        text: '取消管理员',
        isCheck: false,
      },
      {
        text: '移除该成员',
        isCheck: false,
      },
    ],
  },

  computed: {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  methods: {
    changeRole() {
      this.setData({
        isEditRole: true,
      })
    },
    cancelChangeRole() {
      this.setData({
        isEditRole: false,
      })
    },
  },
})
