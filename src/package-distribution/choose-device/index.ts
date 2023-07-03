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
        icon: '/package-distribution/assets/choose-device/gateway.png',
        name: '智能网关',
        path: '/package-distribution/scan/index'
      },
      {
        icon: '/package-distribution/assets/choose-device/subdevice.png',
        name: '开关/灯具',
        path: '/package-distribution/scan/index'
      },
      {
        icon: '/package-distribution/assets/choose-device/screen.png',
        name: '智慧屏',
        path: '/package-distribution/scan/index'
      }
      // {
      //   icon: '/package-distribution/assets/choose-device/sensor.png',
      //   name: '传感器'
      // }
    ]
  },

  lifetimes: {
    ready() {},
    detached() {},
  },

  /**
   * 组件的方法列表
   */
  methods: {

  },
})
