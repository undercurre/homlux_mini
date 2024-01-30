// src\package-room-control\index\components\fresh-control-popup\index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { sendDevice } from '../../../../apis/index'
import { CAC_FA_WINDSPEED, proName } from '../../../../config/index'

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
  },

  computed: {
    disabledMinus(data) {
      const { windSpeed, power } = data.propView
      return windSpeed >= 4 || power !== 1
    },
    disabledPlus(data) {
      const { windSpeed, power } = data.propView
      return windSpeed <= 1 || power !== 1
    },
    disabledSlider(data) {
      const { power } = data.propView
      return power !== 1
    },
    currentWindLevel(data) {
      const { windSpeed = 1 } = data.propView
      const windText = CAC_FA_WINDSPEED[`windSpeed_${windSpeed}`] ?? ''
      return windText.slice(0, 1) || '--'
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
    async handleBtnTap(e: { currentTarget: { dataset: { key: string } }; detail: number }) {
      let key = e.currentTarget.dataset.key as string
      let setValue = e.detail
      const { windSpeed } = this.data.propView
      const property = {} as IAnyObject

      // 温度加减逻辑处理，前端先计算实际温度值
      if (key === 'minus') {
        if (this.data.disabledMinus) {
          return
        }
        key = 'windSpeed'
        setValue = windSpeed * 2
      } else if (key === 'plus') {
        if (this.data.disabledPlus) {
          return
        }
        key = 'windSpeed'
        setValue = Math.round(windSpeed / 2)
      } else if (key === 'windSpeedSlider') {
        key = 'windSpeed'
        setValue = Math.pow(2, 3 - setValue)
      }
      // TODO 风档转换

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
      }, 2000)

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
    handleSlideChange(e: { detail: number }) {
      const { propView } = this.data
      this.setData({
        propView: {
          ...propView,
          windSpeed: Math.pow(2, 3 - e.detail),
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
