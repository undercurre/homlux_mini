import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { strUtil } from '../../utils/index'

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
      {
        icon: '/package-distribution/assets/guide/curtain.png',
        name: '窗帘',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: '14',
          sn8: '79700Z76',
          productId: 'SC-1/M2-Z',
          deviceImg: '/package-distribution/assets/guide/curtain.png',
          mode: 0,
        } as Meiju.IProductItem),
      },
      {
        icon: '/package-distribution/assets/guide/light-wifi.png',
        name: '吸顶灯',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: '13',
          sn8: '7909AC81',
          productId: '美的智能吸顶灯',
          deviceImg: '/package-distribution/assets/guide/light-wifi.png',
          mode: 0,
        } as Meiju.IProductItem),
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
