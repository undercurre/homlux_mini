import { ComponentWithComputed } from 'miniprogram-computed'
import { proName, PRO_TYPE } from '../../config/index'
let throttleTimer = 0
ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    // 单选
    select: {
      type: Boolean,
      value: false,
    },
    editMode: {
      type: Boolean,
      value: false,
    },
    // 编辑模式选择，可多选
    editSelect: {
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
      if (data.deviceInfo.proType === PRO_TYPE.switch && data.showBtnDetail) {
        return data.deviceInfo?.switchInfoDTOList[0]?.pic
      } else if (data.deviceInfo?.pic) {
        return data.deviceInfo.pic
      }
      return ''
    },
    controlBtnPic(data) {
      // 窗帘，位置大于0即为开启
      if (data.deviceInfo.proType === PRO_TYPE.curtain) {
        return data.deviceInfo.mzgdPropertyDTOList['1'].curtain_position === '0'
          ? '/assets/img/base/curtain-close.png'
          : '/assets/img/base/curtain-open.png'
      }
      // 灯及灯组
      else if (data.deviceInfo.proType === PRO_TYPE.light) {
        return data.deviceInfo.mzgdPropertyDTOList['1'].OnOff
          ? '/assets/img/base/power-on.png'
          : '/assets/img/base/power-off.png'
      }
      // 面板
      else if (data.deviceInfo.proType === PRO_TYPE.switch && data.deviceInfo.switchInfoDTOList[0]) {
        // ! 确保带有switchInfoDTOList
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
    topTitle(data) {
      // 如果是开关，deviceName显示开关名称
      let name
      if (data.deviceInfo.proType === PRO_TYPE.switch && data.showBtnDetail) {
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
    /**
     * 处理中部位置点击时的事件，优化交互手感
     */
    handleMiddleTap() {
      if (this.data.showControl && this.data.deviceInfo.onLineStatus) {
        this.handlePowerTap()
      } else {
        this.handleCardTap()
      }
    },
    handlePowerTap() {
      // 如果关联了面板，或者设备离线，刚转为点击卡片
      if (this.data.deviceInfo.linkSceneName || !this.data.deviceInfo.onLineStatus) {
        this.handleCardTap()
        return
      }
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
            if (this.data.deviceInfo.proType === PRO_TYPE.light) {
              onOff = !this.data.deviceInfo.mzgdPropertyDTOList['1'].OnOff
            } else if (this.data.deviceInfo.proType === PRO_TYPE.switch) {
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
    handleLongPress() {
      this.createSelectorQuery()
        .select('#card')
        .boundingClientRect()
        .exec((res) => {
          this.triggerEvent('longPress', {
            ...this.data.deviceInfo,
            clientRect: res[0],
          })
        })
    },
  },
})
