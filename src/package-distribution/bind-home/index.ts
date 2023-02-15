import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { getCurrentPageParams } from '../../utils/index'
import { bindDevice } from '../../apis/index'
import { homeBinding } from '../../store/index'

const deviceInfo = { deviceName: '', roomId: '' }

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
  data: {} as WechatMiniprogram.IAnyObject,

  lifetimes: {
    attached() {},
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
    changeDeviceInfo(event: WechatMiniprogram.CustomEvent) {
      console.log('changeDeviceInfo', event)

      deviceInfo.roomId = event.detail.roomId
      deviceInfo.deviceName = event.detail.deviceName
    },

    async requestBindDevice() {
      const params = getCurrentPageParams()

      const res = await bindDevice({
        deviceId: params.deviceId,
        houseId: homeBinding.store.currentHomeId,
        roomId: deviceInfo.roomId,
        sn: params.dsn,
        deviceName: deviceInfo.deviceName,
      })

      if (res.success && res.result.isBind) {
        wx.showToast({
          title: '绑定成功',
          icon: 'success',
          duration: 2000,
        })

        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' })
        }, 2000)
      }
    },
  },
})
