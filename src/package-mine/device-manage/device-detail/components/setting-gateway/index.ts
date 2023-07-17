import { ComponentWithComputed } from 'miniprogram-computed'
import { checkWifiSwitch } from '../../../../../utils/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    deviceInfo: {
      type: Object,
    },
    isManager: {
      type: Boolean,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {
    channelText(data) {
      return `${data.deviceInfo.channel}(${data.deviceInfo.panId})`
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toChangeWifi() {
      // 预校验wifi开关是否打开
      if (!checkWifiSwitch()) {
        return
      }

      wx.navigateTo({
        url: `/package-distribution/wifi-connect/index?type=changeWifi&sn=${this.data.deviceInfo.sn}`,
      })
    },
  },
})
