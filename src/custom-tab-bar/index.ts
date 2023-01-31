// custom-tab-bar/index.ts
import { ComponentWithStore } from 'mobx-miniprogram-bindings'
import { others } from '../store/index'
ComponentWithStore({
  options: {
    styleIsolation: 'apply-shared',
  },

  storeBindings: {
    store: others,
    fields: ['showTabbar'],
    actions: {},
  },

  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    selected: 0,
    color: '#E3E4E8',
    selectedColor: '#1E2C46',
    list: [
      {
        text: '首页',
        selectedIcon: '/assets/img/tabbar/home-selected.png',
        unSelectedIcon: '/assets/img/tabbar/home-unselected.png',
        path: '/pages/index/index',
      },
      {
        text: '我的',
        selectedIcon: '/assets/img/tabbar/mine-selected.png',
        unSelectedIcon: '/assets/img/tabbar/mine-unselected.png',
        path: '/pages/mine/index',
      },
    ],
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
