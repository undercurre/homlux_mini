import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { getCurrentPageParams, strUtil } from '../../utils/index'
import { queryDeviceInfoByDeviceId, editDeviceInfo } from '../../apis/index'
import { homeBinding, roomBinding } from '../../store/index'

Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding] }), pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    deviceInfo: { deviceId: '', deviceName: '', roomId: '', sn: '' },
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
            sn: res.result.sn,
            roomId: res.result.roomId,
          },
        })
      }
    },

    toScan() {
      wx.navigateBack()
    },

    toSearchSubdevice() {
      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/search-subdevice/index', {
          gatewayId: this.data.deviceInfo.deviceId,
          gatewaySn: this.data.deviceInfo.sn,
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

    async finish() {
      const { deviceId, deviceName, roomId } = this.data.deviceInfo

      const res = await editDeviceInfo({
        deviceId,
        deviceName,
        roomId,
        houseId: homeBinding.store.currentHomeId,
        type: '2',
      })

      if (res.success) {
        roomBinding.store.updateRoomList()

        wx.switchTab({ url: '/pages/index/index' })
      }
    },
  },
})
