import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'

ComponentWithComputed({
  options: {},
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
        icon: '/package-distribution/assets/guide/gateway.png',
        name: '智能网关',
        path: '/package-distribution/scan/index?type=gateway',
      },
      {
        icon: '/package-distribution/assets/guide/subdevice.png',
        name: '开关/灯具',
        path: '/package-distribution/scan/index?type=subdevice',
      },
      {
        icon: '/package-distribution/assets/guide/screen.png',
        name: '智慧屏',
        path: '/package-distribution/scan/index?type=screen',
      },
      {
        icon: '/package-distribution/assets/guide/sensor.png',
        name: '传感器',
        path: '/package-distribution/choose-sensor/index',
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
