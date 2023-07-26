import { ComponentWithComputed } from 'miniprogram-computed'
import { proName, PRO_TYPE } from '../../config/index'
import { throttle } from '../../utils/index'

const CONTROL_INTERVAL = 3000 // 开关操作间隔时间

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
    isProcessing: false,
    _clientRect: {} as IAnyObject,
  },
  lifetimes: {
    ready() {
      this.createSelectorQuery()
        .select('#card')
        .boundingClientRect()
        .exec((res) => (this.data._clientRect = res[0]))
    },
    detached() {},
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
        const pos = data.deviceInfo.mzgdPropertyDTOList['1'].curtain_position
        const isClosed = pos === '0'
        if (data.isProcessing) {
          return isClosed ? '/assets/img/base/curtain-opening.png' : '/assets/img/base/curtain-closing.png'
        }
        return isClosed ? '/assets/img/base/curtain-open.png' : '/assets/img/base/curtain-close.png'
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
      return name.length > 5 ? name.slice(0, 2) + '...' + name.slice(-2) : name
    },
    bottomDesc(data) {
      return data.deviceInfo.deviceName.length > 5
        ? data.deviceInfo.deviceName.slice(0, 2) + '...' + data.deviceInfo.deviceName.slice(-2)
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
      if (this.data.editMode) {
        this.triggerEvent('cardTap', {
          ...this.data.deviceInfo,
          clientRect: this.data._clientRect,
        })
      } else {
        if (this.data.deviceInfo.onLineStatus) {
          this.triggerEvent('cardTap', {
            ...this.data.deviceInfo,
            clientRect: this.data._clientRect,
          })
        } else {
          this.triggerEvent('offlineTap', {
            ...this.data.deviceInfo,
            clientRect: this.data._clientRect,
          })
        }
      }
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
    // 节流执行
    controlThrottle: throttle(
      function (this: IAnyObject) {
        this.setData({
          isProcessing: true,
          ripple: true,
        })

        // 回滚状态及动画
        setTimeout(() => {
          this.setData({
            isProcessing: false,
            ripple: false,
          })
        }, CONTROL_INTERVAL)
      },
      CONTROL_INTERVAL,
      true,
      false,
    ),
    handlePowerTap() {
      // 如果设备离线，刚转为点击卡片
      if (!this.data.deviceInfo.onLineStatus) {
        this.handleCardTap()
        return
      }

      // 振动反馈
      if (wx.vibrateShort) wx.vibrateShort({ type: 'light' })

      // emit 事件，发送指令等
      this.triggerEvent('controlTap', { ...this.data.deviceInfo, clientRect: this.data._clientRect })

      // 状态反转
      let onOff = false
      if (this.data.deviceInfo.proType === PRO_TYPE.light) {
        onOff = !this.data.deviceInfo.mzgdPropertyDTOList['1'].OnOff
      } else if (this.data.deviceInfo.proType === PRO_TYPE.switch) {
        const { switchId } = this.data.deviceInfo.switchInfoDTOList[0]
        onOff = !this.data.deviceInfo.mzgdPropertyDTOList[switchId]?.OnOff

        // 未确定用途，暂时注释
        // if (this.data.deviceInfo.mzgdPropertyDTOList[switchId].ButtonMode === 2) {
        //   return
        // }
      }

      this.setData({
        onOff,
      })

      // 节流执行的部分
      this.controlThrottle()
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
