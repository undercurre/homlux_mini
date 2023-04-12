import { ComponentWithComputed } from 'miniprogram-computed'
import { deviceBinding, deviceStore, sceneBinding, sceneStore } from '../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { proName, proType } from '../../config/index'
let throttleTimer = 0
ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding, sceneBinding] })],
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
    // 是否显示控制图标（如电源开关）
    showControl: {
      type: Boolean,
      value: false,
    },
    // 是否带投影
    showShadow: {
      type: Boolean,
      value: false,
    },
    // 是否带渐变背景
    showGradientBg: {
      type: Boolean,
      value: false,
    },
    editMode: {
      type: Boolean,
      value: false,
    },
    editSelect: {
      type: Boolean,
      value: false,
    },
    // 是否显示开关按键名称及图标
    showBtnDetail: {
      type: Boolean,
      value: true,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    ripple: false,
    onOff: false, // true: on false: off
    showDeviceOffline: false,
  },

  computed: {
    picUrl(data) {
      if (data.deviceInfo.proType === proType.switch && data.showBtnDetail) {
        return data.deviceInfo?.switchInfoDTOList[0]?.pic
      } else if (data.deviceInfo?.pic) {
        return data.deviceInfo.pic
      }
      return ''
    },
    isLinkScene(data) {
      if (!data.deviceInfo || !data.deviceInfo.switchInfoDTOList || !data.deviceInfo.switchInfoDTOList[0]) {
        return false
      }
      const switchId = data.deviceInfo.switchInfoDTOList[0].switchId
      return (
        data.deviceInfo.proType === proType.switch && data.deviceInfo.mzgdPropertyDTOList[switchId].ButtonMode === 2
      )
    },
    controlBtnPic(data) {
      if (data.deviceInfo.proType === proType.light) {
        return data.deviceInfo.mzgdPropertyDTOList['1'].OnOff
          ? '/assets/img/base/power-on.png'
          : '/assets/img/base/power-off.png'
      } else if (data.deviceInfo.proType === proType.switch) {
        const switchId = data.deviceInfo.switchInfoDTOList[0].switchId
        if (!data.deviceInfo.mzgdPropertyDTOList[switchId]) {
          // 万一设备没有开关属性，不显示
          return ''
        }
        return data.deviceInfo.mzgdPropertyDTOList[switchId].OnOff
          ? '/assets/img/base/power-on.png'
          : '/assets/img/base/power-off.png'
      }
      return ''
    },
    linkSceneName(data) {
      if (!data.deviceInfo || !data.deviceInfo.switchInfoDTOList || !data.deviceInfo.switchInfoDTOList[0]) {
        return ''
      }
      const switchId = data.deviceInfo.switchInfoDTOList[0].switchId
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      const sceneIdMp = sceneStore.sceneIdMp
      if (
        switchSceneConditionMap[`${data.deviceInfo.deviceId}:${switchId}`] &&
        sceneIdMp[switchSceneConditionMap[`${data.deviceInfo.deviceId}:${switchId}`]] &&
        sceneIdMp[switchSceneConditionMap[`${data.deviceInfo.deviceId}:${switchId}`]].sceneName
      ) {
        return sceneIdMp[switchSceneConditionMap[`${data.deviceInfo.deviceId}:${switchId}`]].sceneName.slice(0, 4)
      }
      return ''
    },
    topTitle(data) {
      // 如果是开关，deviceName显示开关名称
      let name
      if (data.deviceInfo.proType === proType.switch && data.showBtnDetail) {
        const switchInfo = data.deviceInfo.switchInfoDTOList[0]
        name = switchInfo.switchName ?? '按键' + switchInfo.switchId
      } else {
        name = data.deviceInfo.deviceName
      }
      return name.length > 5 ? name.slice(0, 5) + '...' : name
    },
    bottomDesc(data) {
      return data.deviceInfo.deviceName.length > 5
        ? data.deviceInfo.deviceName.slice(0, 5) + '...'
        : data.deviceInfo.deviceName
    },
    deviceType(data) {
      return proName[data.deviceInfo.proType]
    },
    /** 开关面板名称 */
    switchDeviceName(data) {
      return data.deviceInfo.deviceName.slice(0, 5)
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap() {
      this.createSelectorQuery()
        .select('#card')
        .boundingClientRect()
        .exec((res) => {
          if (this.data.editMode) {
            this.triggerEvent('cardTap', {
              ...this.data.deviceInfo,
              clientRect: res[0],
            })
          } else {
            if (this.data.deviceInfo.onLineStatus) {
              this.triggerEvent('cardTap', {
                ...this.data.deviceInfo,
                clientRect: res[0],
              })
            } else {
              this.triggerEvent('offlineTap', {
                ...this.data.deviceInfo,
                clientRect: res[0],
              })
            }
          }
        })
    },
    handlePowerTap() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      this.createSelectorQuery()
        .select('#card')
        .boundingClientRect()
        .exec((res) => {
          if (this.data.deviceInfo.onLineStatus) {
            this.triggerEvent('controlTap', { ...this.data.deviceInfo, clientRect: res[0] })
            // 执行动画
            if (throttleTimer) {
              return
            }
            let onOff = false
            if (this.data.deviceInfo.proType === proType.light) {
              onOff = !this.data.deviceInfo.mzgdPropertyDTOList['1'].OnOff
            } else if (this.data.deviceInfo.proType === proType.switch) {
              const switchId = this.data.deviceInfo.switchInfoDTOList[0].switchId
              if (this.data.deviceInfo.mzgdPropertyDTOList[switchId]) {
                onOff = !this.data.deviceInfo.mzgdPropertyDTOList[switchId].OnOff
              }
              if (this.data.deviceInfo.mzgdPropertyDTOList[switchId].ButtonMode === 2) {
                throttleTimer = setTimeout(() => {
                  throttleTimer = 0
                }, 550)
                return
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
            }, 550)
          } else {
            this.triggerEvent('offlineTap', {
              ...this.data.deviceInfo,
              clientRect: res[0],
            })
          }
        })
    },
  },
})
