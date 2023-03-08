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
      if (data.deviceType && data.deviceType === 'switch') {
        return data.deviceInfo?.switchInfoDTOList[0]?.pic ?? `/assets/img/device/${data.deviceType}.png`
      } else if (data.deviceType) {
        return data.deviceInfo?.pic ?? `/assets/img/device/${data.deviceType}.png`
      }
      return ''
    },
    controlBtnPic(data) {
      if (!data.deviceInfo.onLineStatus) {
        return '/assets/img/base/offline.png'
      }
      if (data.deviceType === 'light') {
        return data.deviceInfo.mzgdPropertyDTOList['1'].OnOff
          ? '/assets/img/base/power-on.png'
          : '/assets/img/base/power-off.png'
      } else if (data.deviceType === 'switch') {
        const switchId = data.deviceInfo.switchInfoDTOList[0].switchId
        if (!data.deviceInfo.mzgdPropertyDTOList[switchId]) {
          // 设备没有开关属性，不显示
          return ''
        }
        if (data.deviceInfo.mzgdPropertyDTOList[switchId].ButtonMode === 2) {
          return '/assets/img/base/scene-switch-btn.png'
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
    deviceName(data) {
      if (new RegExp('[\\u4E00-\\u9FFF]+', 'g').test(data.deviceInfo.deviceName)) {
        // 存在中文字符，只能显示5个字符
        return data.deviceInfo.deviceName?.slice(0, 5)
      } else {
        // 不存在中文字符，只能显示8个字符
        return data.deviceInfo.deviceName?.slice(0, 8)
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap() {
      if (this.data.deviceInfo.onLineStatus) {
        this.triggerEvent('cardTap', this.data.deviceInfo)
      } else {
        wx.showToast({
          icon: 'none',
          title: '设备已离线',
        })
      }
    },
    handlePowerTap() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      if (this.data.deviceInfo.onLineStatus) {
        this.triggerEvent('controlTap', this.data.deviceInfo)
      } else {
        wx.showToast({
          icon: 'none',
          title: '设备已离线',
        })
      }
    },
  },
})
