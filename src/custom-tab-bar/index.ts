// custom-tab-bar/index.ts
import { ComponentWithStore } from 'mobx-miniprogram-bindings'
import { global } from '../store/index'
ComponentWithStore({
  options: {
    styleIsolation: 'apply-shared',
  },

  storeBindings: {
    store: global,
    fields: ['isLoadedSvg'],
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
    color: '#8A8A8F',
    selectedColor: '#000000',
    list: [
      {
        text: '首页',
        selectedIcon: 'ion:home',
        unSelectedIcon: 'ion:home-outline',
        path: '/pages/index/index',
      },
      {
        text: '我的',
        selectedIcon: 'ion:person-circle',
        unSelectedIcon: 'ion:person-circle-outline',
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
