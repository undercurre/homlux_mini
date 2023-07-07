import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    deviceList: [
      {
        icon: '/package-distribution/assets/guide/sensor-body.png',
        name: '人体传感器',
        path: '/package-distribution/connect-guide/index?sn8=7961012A',
      },
      {
        icon: '/package-distribution/assets/guide/sensor-door.png',
        name: '门磁传感器',
        path: '/package-distribution/connect-guide/index?sn8=79610128',
      },
      {
        icon: '/package-distribution/assets/guide/sensor-switch.png',
        name: '无线开关',
        path: '/package-distribution/connect-guide/index?sn8=7937772A',
      },
    ],
  },

  lifetimes: {
    ready() {},
    detached() {},
  },

  /**
   * 组件的方法列表
   */
  methods: {},
})
