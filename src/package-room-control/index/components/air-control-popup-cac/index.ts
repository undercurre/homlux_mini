// package-room-control\index\components\air-control-popup-cac\index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '../../../../skyline-components/mz-toast/toast'
import { sendDevice } from '../../../../apis/index'
import {
  CAC_MODE,
  CAC_FA_WINDSPEED,
  MODE_ICON_MAP,
  WIND_ICON_MAP,
  proName,
  NO_SYNC_DEVICE_STATUS,
} from '../../../../config/index'

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
    isShowPicker: false,
    pickerIndex: 0,
    pickerValue: '',
    pickerType: '',
    pickerTitleMap: {
      mode: '模式',
      windSpeed: '风速',
    } as Record<string, string>,
    cacPickerList: {
      mode: Object.keys(CAC_MODE).map((key) => ({ text: CAC_MODE[key], value: parseInt(key.split('_')[1]) })),
      windSpeed: [
        {
          text: '1档',
          value: 4,
        },
        {
          text: '2档',
          value: 2,
        },
        {
          text: '3档',
          value: 1,
        },
      ],
    } as Record<string, IAnyObject[]>,
    step: 1,
    minTemp: 16,
    maxTemp: 30,
  },

  computed: {
    temperature(data) {
      const { currentTemperature, targetTemperature } = data.propView
      return targetTemperature ?? currentTemperature
    },
    disabledMinus(data) {
      const { minTemp } = data
      const { targetTemperature, power, mode } = data.propView
      return targetTemperature <= minTemp || power !== 1 || parseInt(mode) === 4
    },
    disabledPlus(data) {
      const { maxTemp } = data
      const { targetTemperature, power, mode } = data.propView
      return targetTemperature >= maxTemp || power !== 1 || parseInt(mode) === 4
    },
    disabledSlider(data) {
      const { power, mode } = data.propView
      return power !== 1 || parseInt(mode) === 4
    },
    disabledMode(data) {
      const { power } = data.propView
      return power !== 1
    },
    disabledWindSpeed(data) {
      const { power, mode } = data.propView
      return power !== 1 || parseInt(mode) === 2
    },
    showIndoorTemp(data) {
      const { currentTemperature } = data.propView
      if (!currentTemperature || currentTemperature === 255) {
        return null
      }
      return currentTemperature
    },
    pickerTitle(data) {
      const { pickerTitleMap, pickerType } = data
      if (!pickerType) {
        return ''
      }
      return pickerTitleMap[pickerType]
    },
    pickerColumns(data) {
      const { cacPickerList, pickerType } = data
      if (!pickerType) {
        return []
      }
      return cacPickerList[pickerType]
    },
    currentMode(data) {
      const { mode = '' } = data.propView
      return CAC_MODE[`mode_${mode}`] ?? ''
    },
    currentWindLevel(data) {
      const { windSpeed = 1 } = data.propView
      return CAC_FA_WINDSPEED[`windSpeed_${windSpeed}`] ?? ''
    },
    modeIcon(data) {
      const { mode = 1 } = data.propView
      return `/package-room-control/assets/img/mode_${MODE_ICON_MAP[mode]}.png`
    },
    windIcon(data) {
      const { windSpeed = 1 } = data.propView
      return `/package-room-control/assets/img/${WIND_ICON_MAP[windSpeed]}.png`
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

    showPicker(e: WechatMiniprogram.CustomEvent) {
      const key = e.currentTarget.dataset.key as string
      if (key === 'windSpeed' && this.data.disabledWindSpeed) {
        return
      }
      if (key === 'mode' && this.data.disabledMode) {
        return
      }
      const currentValue = this.data.propView[key]
      const pickerIndex = this.data.cacPickerList[key].findIndex((item) => item.value === currentValue)
      this.setData({
        isShowPicker: true,
        pickerType: key,
        pickerIndex: pickerIndex > -1 ? pickerIndex : this.data.pickerIndex,
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },
    onPickerChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        pickerIndex: e.detail.index,
        pickerValue: e.detail.value.value,
      })
    },
    handlePickerClose() {
      this.setData({
        isShowPicker: false,
      })
    },
    handlePickerConfirm() {
      this.setData({
        isShowPicker: false,
      })
      // 构造相同的数据结构，调用发送指令方法
      this.handleBtnTap({
        currentTarget: {
          dataset: {
            key: this.data.pickerType,
          },
        },
        detail: this.data.pickerValue,
      } as unknown as WechatMiniprogram.TouchEvent)
    },
  },
})
