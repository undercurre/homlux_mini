// package-mine/hoom-manage/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { roomBinding, othersBinding, userBinding } from '../../store/index'
import { StatusType } from './typings'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, othersBinding, userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    status: 'begin' as StatusType,
  },

  computed: {
    btnText(data) {
      const textMap = {
        introduce: '开始使用',
        begin: '下一步',
      }

      return textMap[data.status]
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  methods: {
    clickBtn() {
      if (this.data.status === 'introduce') {
        this.setData({
          status: 'begin',
        })
      }
    },
  },
})
