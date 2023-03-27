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
    showControl: {
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
      if (data.deviceInfo.proType === proType.switch) {
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
      const switchSceneMap = deviceStore.switchSceneMap
      const sceneIdMp = sceneStore.sceneIdMp
      if (
        switchSceneMap[`${data.deviceInfo.deviceId}:${switchId}`] &&
        sceneIdMp[switchSceneMap[`${data.deviceInfo.deviceId}:${switchId}`]] &&
        sceneIdMp[switchSceneMap[`${data.deviceInfo.deviceId}:${switchId}`]].sceneName
      ) {
        const sceneName = sceneIdMp[switchSceneMap[`${data.deviceInfo.deviceId}:${switchId}`]].sceneName
        if (new RegExp('[\\u4E00-\\u9FFF]+', 'g').test(sceneName)) {
          // 名字有中文，只能显示三个字符
          return sceneName.slice(0, 3)
        } else {
          // 全英文，显示4个
          return sceneName.slice(0, 4)
        }
      }
      return ''
    },
    deviceName(data) {
      let name = ''
      // 如果是开关，deviceName显示开关名称
      if (data.deviceInfo.proType === proType.switch) {
        name = data.deviceInfo.switchInfoDTOList[0].switchName ?? '按键' + data.deviceInfo.switchInfoDTOList[0].switchId
        if (new RegExp('[\\u4E00-\\u9FFF]+', 'g').test(name)) {
          return name.slice(0, 5)
        }
        return name
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
    deviceType(data) {
      return proName[data.deviceInfo.proType]
    },
    /** 开关面板名称 */
    switchDeviceName(data) {
      const name = data.deviceInfo.deviceName
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
