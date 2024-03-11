import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { strUtil } from '../../../utils/index'
import cacheData from '../../common/cacheData'
import { productImgDir } from '../../../config/index'

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
        icon: `${productImgDir}/0x16.png`,
        name: '智能网关',
        path: '/package-distribution/pages/scan/index?scanType=gateway',
      },
      {
        icon: `${productImgDir}/subdevice.png`,
        name: '开关/灯具',
        path: '/package-distribution/pages/choose-model/index?proType=0x13',
      },
      {
        icon: `${productImgDir}/screen.png`,
        name: '智慧屏',
        path: '/package-distribution/pages/scan/index?scanType=screen',
      },
      {
        icon: `${productImgDir}/sensor.png`,
        name: '传感器',
        path: '/package-distribution/pages/choose-model/index?proType=0xBC',
      },
      {
        icon: `${productImgDir}/0x14.png`,
        name: '窗帘',
        source: 'meiju',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: '14',
          sn8: '79700Z76',
          mode: 0,
        } as Meiju.IProductItem),
      },
      {
        icon: `${productImgDir}/0x26.png`,
        name: '浴霸',
        source: 'meiju',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: '26',
          sn8: 'M0100032,57066708',
          mode: 0,
        } as Meiju.IProductItem),
      },
      {
        icon: `${productImgDir}/0x17.png`,
        name: '晾衣机',
        source: 'meiju',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: '17',
          sn8: 'M0100035',
          mode: 0,
        } as Meiju.IProductItem),
      },
      {
        icon: `${productImgDir}/0xAC.png`,
        name: '空调',
        path: '/package-distribution/pages/choose-model/index?proType=0xAC',
      },
    ],
  },

  lifetimes: {
    ready() {
      const routes = getCurrentPages()

      // 保存进入配网流程的页面入口
      cacheData.pageEntry = '/' + (routes.length > 2 ? routes[routes.length - 2].route : 'pages/index/index')
    },
    detached() {},
  },

  /**
   * 组件的方法列表
   */
  methods: {},
})
