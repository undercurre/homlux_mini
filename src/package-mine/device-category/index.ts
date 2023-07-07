// package-mine/hoom-manage/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceBinding } from '../../store/index'
import { getCurrentPageParams } from '../../utils/index'
import { SCREEN_PID, PRO_TYPE } from '../../config/device'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },

  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    pageParam: '',
    defaultImg: {
      gateway: '../../assets/img/default-img/only-gateway.png',
      sensor: '../../assets/img/default-img/only-gateway.png',
      screen: '../../assets/img/default-img/only-gateway.png',
    },
  },

  computed: {
    pageTitle(data) {
      switch (data.pageParam) {
        case 'gateway':
          return '智能网关'
        case 'sensor':
          return '传感器'
        case 'screen':
          return '智慧屏'
        default:
          return ''
      }
    },
    deviceListCompited(data) {
      const list = data.allRoomDeviceList ? [...data.allRoomDeviceList].sort((a, b) => a.orderNum - b.orderNum) : []
      if (data.pageParam === 'gateway') {
        return list.filter((d: Device.DeviceItem) => d.proType === PRO_TYPE.gateway)
      } else if (data.pageParam === 'sensor') {
        return list.filter((d: Device.DeviceItem) => d.proType === PRO_TYPE.sensor)
      } else {
        return list.filter(
          (d: Device.DeviceItem) =>
            d.proType === PRO_TYPE.gateway &&
            SCREEN_PID.findIndex((item) => {
              item === d.productId
            }) !== -1,
        )
      }
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    ready: function () {
      const { param } = getCurrentPageParams()
      if (param) {
        this.setData({
          pageParam: param,
        })
      }
    },
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  methods: {
    handleCardClick(e: { currentTarget: { dataset: { deviceId: string; deviceType: number } } }) {
      const { deviceId, deviceType } = e.currentTarget.dataset
      console.log('handleCardClick', deviceId, deviceType)
      const pageName = deviceType === 4 ? 'group-detail' : 'device-detail'

      wx.navigateTo({
        url: `/package-mine/device-manage/${pageName}/index?deviceId=${deviceId}`,
      })
    },
    handleAddDevice() {
      wx.navigateTo({ url: '/package-distribution/scan/index' })
    },
  },
})
