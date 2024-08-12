import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { sendDevice } from '../../../../../apis/index'

ComponentWithComputed({
  /**
   * 组件的属性列表
   */
  properties: {
    deviceInfo: {
      type: Object,
      observer(device) {
        const modelName = 'doorLock'
        this.setData({ electronicLockSetVal: !!device?.mzgdPropertyDTOList[modelName]?.electronicLock })
      },
    },
    isManager: {
      type: Boolean,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    electronicLockSetVal: false, // 电子返锁设置值
  },

  computed: {
    powerSaving() {
      return true
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toPage(e: WechatMiniprogram.TouchEvent<never, never, { url: string }>) {
      console.log('toPage', e.currentTarget.dataset.url)
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      })
    },
    async changeElectronicLock() {
      const { proType, deviceType, deviceId } = this.data.deviceInfo
      const res = await sendDevice({
        proType,
        deviceType,
        deviceId,
        customJson: {
          msgId: 2,
          cmdType: 10,
          data: {
            electronicLock: this.data.electronicLockSetVal ? 0 : 1, //1-打开电子反锁 0-取消电子反锁
          },
        },
      })

      if (!res.success) {
        Toast('控制失败')
      } else {
        this.setData({ electronicLockSetVal: !this.data.electronicLockSetVal })
      }
    },
  },
})
