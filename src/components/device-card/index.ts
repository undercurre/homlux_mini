import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { deviceStore, sceneStore } from '../../store/index'
let throttleTimer = 0
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
  data: {
    ripple: false,
    onOff: false, // true: on false: off
  },

  computed: {
    picUrl(data) {
      if (data.deviceType && data.deviceType === 'switch') {
        return data.deviceInfo?.switchInfoDTOList[0]?.pic
      } else if (data.deviceType) {
        return data.deviceInfo?.pic
      }
      return ''
    },
    controlBtnPic(data) {
      if (data.deviceType === 'light') {
        return data.deviceInfo.mzgdPropertyDTOList['1'].OnOff
          ? '/assets/img/device-control/power-on.png'
          : '/assets/img/device-control/power-off.png'
      } else if (data.deviceType === 'switch') {
        const switchId = data.deviceInfo.switchInfoDTOList[0].switchId
        if (!data.deviceInfo.mzgdPropertyDTOList[switchId]) {
          // 设备没有开关属性，不显示
          return ''
        }
        if (data.deviceInfo.mzgdPropertyDTOList[switchId].ButtonMode === 2) {
          return '/assets/img/device-control/power-on.png'
        }
        return data.deviceInfo.mzgdPropertyDTOList[switchId].OnOff
          ? '/assets/img/device-control/power-on.png'
          : '/assets/img/device-control/power-off.png'
      }
      return ''
    },
    // switchName(data) {
    //   if (data.deviceType === 'switch') {
    //     if (data.deviceInfo.switchInfoDTOList[0].switchName) {
    //       return data.deviceInfo.switchInfoDTOList[0].switchName
    //     } else {
    //       return data.deviceInfo.switchInfoDTOList[0].switchId + '路'
    //     }
    //   }
    //   return ''
    // },
    deviceName(data) {
      let name = ''
      if (data.deviceType === 'switch') {
        const switchId = data.deviceInfo.switchInfoDTOList[0].switchId
        if (data.deviceInfo.mzgdPropertyDTOList[switchId].ButtonMode === 2) {
          const switchSceneMap = deviceStore.switchSceneMap
          const sceneIdMp = sceneStore.sceneIdMp
          if (
            switchSceneMap[`${data.deviceInfo.deviceId}:${switchId}`] &&
            sceneIdMp[switchSceneMap[`${data.deviceInfo.deviceId}:${switchId}`]] &&
            sceneIdMp[switchSceneMap[`${data.deviceInfo.deviceId}:${switchId}`]].sceneName
          ) {
            name = sceneIdMp[switchSceneMap[`${data.deviceInfo.deviceId}:${switchId}`]].sceneName
          } else {
            name = data.deviceInfo.switchInfoDTOList[0].switchName
          }
        } else {
          name = data.deviceInfo.switchInfoDTOList[0].switchName
        }
      } else {
        name = data.deviceInfo.deviceName
      }
      if (new RegExp('[\\u4E00-\\u9FFF]+', 'g').test(name)) {
        // 存在中文字符，只能显示5个字符
        return name.slice(0, 5)
      } else {
        // 不存在中文字符，只能显示8个字符
        return name.slice(0, 8)
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap() {
      // this.triggerEvent('cardTap', this.data.deviceInfo)
      this.createSelectorQuery()
        .select('#card')
        .boundingClientRect()
        .exec((res) => {
          if (this.data.deviceInfo.onLineStatus) {
            this.triggerEvent('cardTap', {
              ...this.data.deviceInfo,
              clientRect: res[0],
            })
          } else {
            // this.triggerEvent('offlineTap')
            Toast('设备已离线')
          }
        })
    },
    handlePowerTap() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      if (this.data.deviceInfo.onLineStatus) {
        if (throttleTimer) {
          return
        }
        let onOff = false
        if (this.data.deviceType === 'light') {
          onOff = !this.data.deviceInfo.mzgdPropertyDTOList['1'].OnOff
        } else if (this.data.deviceType === 'switch') {
          const switchId = this.data.deviceInfo.switchInfoDTOList[0].switchId
          if (this.data.deviceInfo.mzgdPropertyDTOList[switchId]) {
            onOff = !this.data.deviceInfo.mzgdPropertyDTOList[switchId].OnOff
          }
          if (this.data.deviceInfo.mzgdPropertyDTOList[switchId].ButtonMode === 2) {
            onOff = true
          }
        }
        this.setData({
          ripple: true,
          onOff,
        })
        throttleTimer = setTimeout(() => {
          throttleTimer = 0
          this.setData({
            ripple: false,
          })
        }, 550) as unknown as number
        this.triggerEvent('controlTap', this.data.deviceInfo)
      } else {
        // this.triggerEvent('offlineTap')
        Toast('设备已离线')
      }
    },
  },
})
