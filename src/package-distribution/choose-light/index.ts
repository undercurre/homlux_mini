import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
// import { strUtil } from '../../utils/index'

ComponentWithComputed({
  options: {},
  behaviors: [pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据  /package-distribution/scan/index?type=subdevice
   */
  data: {
    deviceList: [
      // {
      //   icon: '/package-distribution/assets/guide/light-wifi.png',
      //   name: '吸顶灯',
      //   tag: 'wifi',
      //   path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
      //     proType: '13',
      //     sn8: '7909AC81',
      //     productId: '美的智能吸顶灯',
      //     deviceImg: '/package-distribution/assets/guide/light-wifi.png',
      //     mode: 0,
      //   } as Meiju.IProductItem),
      // },
      {
        icon: '/package-distribution/assets/guide/downlight.png',
        name: '筒射灯',
        tag: 'zigbee',
        path: '/package-distribution/scan/index?type=subdevice',
      },
      {
        icon: '/package-distribution/assets/guide/magnetic-track-light.png',
        name: '磁吸灯',
        tag: 'zigbee',
        path: '/package-distribution/scan/index?type=subdevice',
      },
      {
        icon: '/package-distribution/assets/guide/tape-light.png',
        name: 'CW灯带',
        tag: 'zigbee',
        path: '/package-distribution/scan/index?type=subdevice',
      },
      {
        icon: '/package-distribution/assets/guide/switch.png',
        name: '智能开关',
        tag: 'zigbee',
        path: '/package-distribution/scan/index?type=subdevice',
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
