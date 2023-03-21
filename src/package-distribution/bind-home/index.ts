import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { getCurrentPageParams, strUtil } from '../../utils/index'
import { queryDeviceInfoByDeviceId, editDeviceInfo, batchUpdate } from '../../apis/index'
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
    deviceInfo: { deviceId: '', deviceName: '', roomId: '', sn: '', switchList: [] as IAnyObject[] },
  },

  lifetimes: {
    ready() {
      homeBinding.store.updateCurrentHomeDetail()

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

      console.log('getCurrentPageParams', pageParams)

      const res = await queryDeviceInfoByDeviceId({ deviceId: pageParams.deviceId })

      if (res.success) {
        this.setData({
          deviceInfo: {
            deviceId: pageParams.deviceId,
            deviceName: res.result.deviceName,
            sn: res.result.sn,
            roomId: res.result.roomId,
            switchList: res.result.switchInfoDTOList
              ? res.result.switchInfoDTOList.map((item) => ({
                  switchId: item.switchId,
                  switchName: item.switchName,
                }))
              : [],
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
        'deviceInfo.switchList': event.detail.switchList,
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

      if (this.data.deviceInfo.switchList.length > 1) {
        const deviceInfoUpdateVoList = this.data.deviceInfo.switchList.map((item) => {
          return {
            deviceId: deviceId,
            switchId: item.switchId,
            switchName: item.switchName,
            type: '3',
          }
        })

        await batchUpdate({ deviceInfoUpdateVoList })
      }

      if (res.success) {
        homeBinding.store.updateCurrentHomeDetail()

        wx.switchTab({ url: '/pages/index/index' })
      } else {
        wx.showToast({ title: '保存失败', icon: 'error' })
      }
    },
  },
})
