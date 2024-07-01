import { ComponentWithComputed } from 'miniprogram-computed'
import { proName, PRO_TYPE, getModelName } from '../../config/index'
import { throttle } from '../../utils/index'

const CONTROL_INTERVAL = 3000 // 开关操作间隔时间

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/,
  },
  /**
   * 组件的属性列表
   */
  properties: {
    /**
     * 样式相关的统一配置，不频繁地更新
     * @param showShadow 是否带投影
     * @param showGradientBg 是否带渐变背景
     * @param showSpecialBg 是否启用特殊背景（如灯组）
     * @param showBtnDetail 是否显示开关按键名称及图标
     * @param showControl 是否显示控制图标（如电源开关）
     */
    config: {
      type: Object,
      value: {
        showShadow: false,
        showGradientBg: false,
        showSpecialBg: true,
        showControl: false,
        showBtnDetail: true,
      },
    },
    /**
     * 业务相关属性，可能动态地更新
     * @param deleted 是否已被删除
     */
    cardInfo: {
      type: Object,
      value: {
        deleted: false,
      },
      observer() {},
    },
    //  是否显示选中样式，包括单选和多选
    select: {
      type: Boolean,
      value: false,
    },
    editMode: Boolean,
  },

  /**
   * 组件的初始数据
   */
  data: {
    ripple: false,
    power: false, // true: on false: off
    showDeviceOffline: false,
    isProcessing: false,
    isLoadImgError: false,
    _clientRect: {} as IAnyObject,
    _border_opacity: { value: 0 },
    _bg_opacity: { value: 1 },
  },
  lifetimes: {
    ready() {
      this.createSelectorQuery()
        .select('#card')
        .boundingClientRect()
        .exec((res) => (this.data._clientRect = res[0]))
    },
  },

  // TODO PERF 使用observers改写
  computed: {
    borderStyle(data) {
      const { select } = data
      return select ? 'opacity-100' : 'opacity-0'
    },
    bgStyle(data) {
      const { isGroup, showSpecialBg, showGradientBg, select } = data
      const opacity = select ? 'opacity-0' : 'opacity-100'
      let style = opacity
      if (isGroup && showSpecialBg) {
        style += ' show-group-bg white-border'
      } else if (showGradientBg) {
        style += ' show-control-bg white-border'
      } else {
        style += ' bg-hex-f9fbfe'
      }
      return style
    },
    showControl(data) {
      return data.config?.showControl ?? false
    },
    showShadow(data) {
      return data.config?.showShadow ?? false
    },
    showSpecialBg(data) {
      return data.config?.showSpecialBg ?? true // 默认值为true
    },
    showGradientBg(data) {
      return data.config?.showGradientBg ?? false
    },
    showBtnDetail(data) {
      return data.config?.showBtnDetail ?? true // 默认值为true
    },
    picUrl(data) {
      if (data.isLoadImgError) {
        return `/assets/img/offline/default-device.png`
      }
      if (data.cardInfo.proType === PRO_TYPE.switch && data.showBtnDetail) {
        return data.cardInfo?.switchInfoDTOList[0]?.pic
      } else if (data.cardInfo?.pic) {
        return data.cardInfo.pic
      }
      return ''
    },
    controlBtnPic(data) {
      if (data.cardInfo.proType === PRO_TYPE.gateway) {
        return ''
      }
      // 窗帘，位置大于0即为开启
      else if (data.cardInfo.proType === PRO_TYPE.curtain) {
        const pos = data.cardInfo.mzgdPropertyDTOList['curtain'].curtain_position
        const isClosed = pos === '0'
        if (data.isProcessing) {
          return isClosed ? '/assets/img/base/curtain-opening.png' : '/assets/img/base/curtain-closing.png'
        }
        return isClosed ? '/assets/img/base/curtain-open.png' : '/assets/img/base/curtain-close.png'
      }
      // 面板
      else if (data.cardInfo.proType === PRO_TYPE.switch) {
        // ! 确保带有switchInfoDTOList
        const switchId = data.cardInfo.switchInfoDTOList[0]?.switchId
        if (!switchId || !data.cardInfo.mzgdPropertyDTOList[switchId]) {
          // 万一设备没有开关属性，不显示
          return ''
        }
        return data.cardInfo.mzgdPropertyDTOList[switchId].power
          ? '/assets/img/base/power-on.png'
          : '/assets/img/base/power-off.png'
      }
      // PRO_TYPE中已定义的，包括灯及灯组、空调等
      else if (Object.keys(proName).includes(data.cardInfo.proType)) {
        const modeName = getModelName(data.cardInfo.proType, data.cardInfo.productId)
        return data.cardInfo.mzgdPropertyDTOList[modeName].power
          ? '/assets/img/base/power-on.png'
          : '/assets/img/base/power-off.png'
      }
      return ''
    },
    topTitle(data) {
      // 如果是开关，deviceName显示开关名称
      let name
      if (data.cardInfo.proType === PRO_TYPE.switch && data.showBtnDetail) {
        const switchInfo = data.cardInfo.switchInfoDTOList[0]
        name = switchInfo.switchName ?? '按键' + switchInfo.switchId
      } else {
        name = data.cardInfo.deviceName
      }
      return name?.length > 5 ? name.slice(0, 2) + '...' + name.slice(-2) : name
    },
    bottomDesc(data) {
      return data.cardInfo.deviceName?.length > 5
        ? data.cardInfo.deviceName.slice(0, 2) + '...' + data.cardInfo.deviceName.slice(-2)
        : data.cardInfo.deviceName
    },
    deviceType(data) {
      return proName[data.cardInfo.proType]
    },
    /** 开关面板名称 */
    switchDeviceName(data) {
      return data.cardInfo.deviceName?.slice(0, 5)
    },

    // 设备是否可控
    // !! 需要使用双否定将undefined null值转换为boolean，以免视图显示中判断异常
    canCtrl(data) {
      return !!(data.cardInfo.onLineStatus || data.cardInfo.canLanCtrl)
    },

    // 设备是灯组
    isGroup(data) {
      return data.cardInfo.deviceType === 4
    },
    // 设备是传感器，显示电量状态
    lowBattery(data) {
      if (data.cardInfo.proType === PRO_TYPE.sensor) {
        const modelName = getModelName(PRO_TYPE.sensor, data.cardInfo.productId)
        const prop = data.cardInfo.mzgdPropertyDTOList[modelName]
        return !!prop?.batteryAlarmState
      }
      return false
    },
    // 特定设备，显示工作状态
    isRunning(data) {
      const modelName = getModelName(data.cardInfo.proType, data.cardInfo.productId)
      const prop = data.cardInfo.mzgdPropertyDTOList[modelName]
      if (data.cardInfo.proType === PRO_TYPE.bathHeat) {
        return (
          prop?.mode === 'heating' ||
          prop?.mode === 'blowing' ||
          prop?.mode === 'ventilation' ||
          prop?.light_mode !== 'close_all'
        )
      } else if (data.cardInfo.proType === PRO_TYPE.clothesDryingRack) {
        return prop?.location_status !== 'upper_limit' || prop?.light === 'on'
      }
      return false
    },
    // 在卡片上有控制按钮的
    hasControl(data) {
      return (
        data.cardInfo.proType !== PRO_TYPE.gateway &&
        data.cardInfo.proType !== PRO_TYPE.sensor &&
        data.cardInfo.proType !== PRO_TYPE.bathHeat &&
        data.cardInfo.proType !== PRO_TYPE.clothesDryingRack
      )
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap() {
      const { cardInfo, _clientRect, canCtrl } = this.data
      if (canCtrl) {
        this.triggerEvent('cardTap', {
          ...cardInfo,
          clientRect: _clientRect,
          type: 'card',
        })
      } else {
        this.triggerEvent('cardTap', {
          ...cardInfo,
          clientRect: _clientRect,
          type: 'offline',
        })
      }
    },
    /**
     * 处理中部位置点击时的事件，优化交互手感
     */
    handleMiddleTap() {
      if (this.data.showControl && this.data.canCtrl) {
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
      // 如果设备离线，则转为点击卡片
      if (!this.data.canCtrl) {
        this.handleCardTap()
        return
      }

      // 如果控制图片不存在，则不可能点击控制按钮
      if (!this.data.controlBtnPic) return

      // 振动反馈
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })

      // emit 事件，发送指令等
      this.triggerEvent('cardTap', {
        ...this.data.cardInfo,
        clientRect: this.data._clientRect,
        type: 'control',
      })

      // 状态反转
      let power = false
      if (this.data.cardInfo.proType === PRO_TYPE.light) {
        const modelName = this.data.cardInfo.proType === PRO_TYPE.light ? 'light' : 'wallSwitch1'
        power = !this.data.cardInfo.mzgdPropertyDTOList[modelName].power
      } else if (this.data.cardInfo.proType === PRO_TYPE.switch) {
        const { switchId } = this.data.cardInfo.switchInfoDTOList[0]
        power = !this.data.cardInfo.mzgdPropertyDTOList[switchId]?.power

        // 未确定用途，暂时注释
        // if (this.data.cardInfo.mzgdPropertyDTOList[switchId].ButtonMode === 2) {
        //   return
        // }
      }

      this.setData({
        power,
      })

      // 节流执行的部分
      this.controlThrottle()
    },

    loadImgError() {
      this.setData({
        isLoadImgError: true,
      })
    },
  },
})
