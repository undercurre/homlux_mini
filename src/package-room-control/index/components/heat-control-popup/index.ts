// src\package-room-control\index\components\heat-control-popup\index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '../../../../skyline-components/mz-toast/toast'
import { sendDevice } from '../../../../apis/index'
import { NO_SYNC_DEVICE_STATUS, proName } from '../../../../config/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
    },
    show: {
      type: Boolean,
      value: false,
    },
    // 是否显示进入详情页的按钮
    isShowSetting: {
      type: Boolean,
      value: false,
    },
    deviceInfo: {
      type: Object,
      value: {},
      observer(value) {
        if (value && this.data._canSyncCloudData) {
          this.setData({
            propView: value as Device.DeviceItem & Device.mzgdPropertyDTO,
          })
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    _canSyncCloudData: true, // 是否响应云端变更
    _controlTimer: null as null | number, // 控制后计时器
    propView: {} as IAnyObject, // 用于视图显示
    step: 1,
    minTemp: 5,
    maxTemp: 90,
  },

  computed: {
    temperature(data) {
      const { currentTemperature, targetTemperature } = data.propView
      return targetTemperature ?? currentTemperature
    },
    disabledMinus(data) {
      const { minTemp } = data
      const { targetTemperature, power } = data.propView
      return targetTemperature <= minTemp || power !== 1
    },
    disabledPlus(data) {
      const { maxTemp } = data
      const { targetTemperature, power } = data.propView
      return targetTemperature >= maxTemp || power !== 1
    },
    disabledSlider(data) {
      const { power } = data.propView
      return power !== 1
    },
    showIndoorTemp(data) {
      const { currentTemperature } = data.propView
      if (!currentTemperature || currentTemperature === 255) {
        return null
      }
      return currentTemperature
    },
  },

  lifetimes: {
    detached() {
      if (this.data._controlTimer) {
        clearTimeout(this.data._controlTimer)
        this.data._controlTimer = null
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async handleBtnTap(e: WechatMiniprogram.CustomEvent) {
      let key = e.currentTarget.dataset.key as string
      let setValue = e.detail as unknown as number | string
      const property = {} as IAnyObject

      // 温度加减逻辑处理，前端先计算实际温度值
      if (key === 'minus') {
        if (this.data.disabledMinus) {
          return
        }
        key = 'targetTemperature'
        setValue = this.data.temperature - this.data.step
      } else if (key === 'plus') {
        if (this.data.disabledPlus) {
          return
        }
        key = 'targetTemperature'
        setValue = this.data.temperature + this.data.step
      }

      property[key] = setValue
      this.setData({
        [`propView.${key}`]: setValue,
      })

      // 设置后N秒内屏蔽上报
      if (this.data._controlTimer) {
        clearTimeout(this.data._controlTimer)
        this.data._controlTimer = null
      }
      this.data._canSyncCloudData = false
      this.data._controlTimer = setTimeout(() => {
        this.data._canSyncCloudData = true
      }, NO_SYNC_DEVICE_STATUS)

      const res = await sendDevice({
        deviceId: this.data.deviceInfo.deviceId,
        deviceType: this.data.deviceInfo.deviceType,
        proType: this.data.deviceInfo.proType,
        modelName: proName[this.data.deviceInfo.proType],
        gatewayId: this.data.deviceInfo.gatewayId,
        property,
      })

      if (!res.success) {
        Toast({ message: '控制失败', zIndex: 9999 })
        return
      }
    },
    // 温度滑条拖动过程
    handleSlideChange(e: WechatMiniprogram.CustomEvent) {
      const { propView } = this.data
      this.setData({
        propView: {
          ...propView,
          targetTemperature: e.detail,
        },
      })
    },
    toDetail() {
      const { deviceId } = this.data.deviceInfo

      this.triggerEvent('close')
      wx.navigateTo({
        url: `/package-mine/device-manage/device-detail/index?deviceId=${deviceId}`,
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },
  },
})
