import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { getCurrentPageParams, strUtil } from '../../utils/index'
import { queryDeviceInfoByDeviceId } from '../../apis/index'
import { homeBinding } from '../../store/index'

Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] }), pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    deviceInfo: { deviceId: '', deviceName: '', roomId: '' },
  },

  lifetimes: {
    ready() {
      this.getDeviceInfo()
    },
    detached() {},
  },

  pageLifetimes: {
    show() {},
    hide() {},
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async getDeviceInfo() {
      const pageParams = getCurrentPageParams()

      const res = await queryDeviceInfoByDeviceId(pageParams.deviceId)

      if (res.success) {
        this.setData({
          deviceInfo: {
            deviceId: pageParams.deviceId,
            deviceName: res.result.deviceName,
            roomId: res.result.roomId,
          },
        })
      }
    },

    toScan() {
      wx.navigateBack()
    },

    toSearchSubdevice() {
      const pageParams = getCurrentPageParams()

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/search-subdevice/index', {
          gatewayId: pageParams.gatewayId,
          gatewaySn: pageParams.dsn,
        }),
      })
    },

    changeDeviceInfo(event: WechatMiniprogram.CustomEvent) {
      console.log('changeDeviceInfo', event)

      this.setData({
        'deviceInfo.roomId': event.detail.roomId,
        'deviceInfo.deviceName': event.detail.deviceName,
      })
    },

    async requestBindDevice() {
      // const params = getCurrentPageParams()

      wx.switchTab({ url: '/pages/index/index' })
    },
  },
})
