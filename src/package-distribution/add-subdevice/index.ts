import { IPageData } from './typings'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { getCurrentPageParams } from '../../utils/index'

Component({
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
    deviceType: 'gateway', // 添加设备类型，网关or子设备
    status: 'networking',
    currentStep: '连接设备',
    stepList: [
      {
        text: '连接设备',
        isCheck: true,
      },
      {
        text: '设备联网',
        isCheck: false,
      },
      {
        text: '账号绑定',
        isCheck: false,
      },
    ],
  } as WechatMiniprogram.IAnyObject & IPageData,

  pageLifetimes: {
    show() {
      const params = getCurrentPageParams()

      console.log('getCurrentPageParams', params)
    },
  },

  lifetimes: {
    attached() {},
    detached() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {},
})
