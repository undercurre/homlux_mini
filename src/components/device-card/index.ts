// package-room/index/components/device-card/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    select: {
      type: Boolean,
      value: false,
    },
    deviceInfo: {
      type: Object,
    },
    showControl: {
      type: Boolean,
      value: false,
    },
    deviceType: {
      type: String,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {
    style(data) {
      return `border: ${data.select ? '3rpx solid #488FFF' : '3rpx solid rgba(0,0,0,0)'};background: ${
        data.select ? '#fff' : 'linear-gradient(178deg, #f2f5fc 10%, #ffffff 74%)'
      };`
    },
    picUrl(data) {
      return data.deviceInfo.pic ? data.deviceInfo.pic : `/assets/img/device/${data.deviceType}.png`
    },
    controlBtnPic(data) {
      if (!data.showControl || !data.deviceInfo.onLineStatus) {
        return ''
      }
      if (data.deviceType === 'light') {
        return data.deviceInfo.mzgdPropertyDTOList['1'].OnOff
          ? '/assets/img/base/power-on.png'
          : '/assets/img/base/power-off.png'
      } else if (data.deviceType === 'switch') {
        if (data.deviceInfo.isSceneSwitch) {
          return '/assets/img/base/scene-switch-btn.png'
        }
        const switchId = data.deviceInfo.switchInfoDTOList[0].switchId
        if (!data.deviceInfo?.mzgdPropertyDTOList[switchId]) {
          return ''
        }
        return data.deviceInfo.mzgdPropertyDTOList[switchId].OnOff
          ? '/assets/img/base/power-on.png'
          : '/assets/img/base/power-off.png'
      }
      return ''
    },
    switchName(data) {
      if (data.deviceType === 'switch') {
        if (data.deviceInfo.switchInfoDTOList[0].switchName) {
          return data.deviceInfo.switchInfoDTOList[0].switchName
        } else {
          return data.deviceInfo.switchInfoDTOList[0].switchId + '路'
        }
      }
      return ''
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap() {
      this.triggerEvent('cardTap', this.data.deviceInfo)
      // if (this.data.deviceInfo.onLineStatus) {
      //   this.triggerEvent('cardTap', this.data.deviceInfo)
      // } else {
      //   wx.showToast({
      //     icon: 'none',
      //     title: '设备已离线',
      //   })
      // }
    },
    handlePowerTap() {
      if (this.data.deviceInfo.onLineStatus) {
        this.triggerEvent('powerTap', this.data.deviceInfo)
      } else {
        wx.showToast({
          icon: 'none',
          title: '设备已离线',
        })
      }
    },
  },
})
