// custom-tab-bar/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../behaviors/pageBehaviors'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, userBinding } from '../store/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, userBinding] }), pageBehavior],

  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    selected: 0,
    color: '#a2a2a2',
    selectedColor: '#1E2C46',
    list: [
      {
        text: '全屋',
        selectedIcon: '/assets/img/tabbar/home-selected.png',
        unSelectedIcon: '/assets/img/tabbar/home-unselected.png',
        path: '/pages/index/index',
      },
      {
        text: '自动化',
        selectedIcon: '/assets/img/tabbar/automation-selected.png',
        unSelectedIcon: '/assets/img/tabbar/automation-unselected.png',
        path: '/pages/automation/index',
      },
      {
        text: '我的',
        selectedIcon: '/assets/img/tabbar/mine-selected.png',
        unSelectedIcon: '/assets/img/tabbar/mine-unselected.png',
        path: '/pages/mine/index',
      },
    ],
  },
  computed: {
    menuList(data: IAnyObject) {
      const list = data.list
      if (!data.isLogin || data.isVisitor) {
        return list.filter((item: IAnyObject) => item.text !== '自动化')
      }
      return list
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    switchTab(data: { currentTarget: { dataset: { index: number; path: string } } }) {
      wx.switchTab({
        url: data.currentTarget.dataset.path,
      })
    },
  },
})
