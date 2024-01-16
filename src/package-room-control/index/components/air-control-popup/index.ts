import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { sendDevice } from '../../../../apis/index'
import { PRO_TYPE, AC_MODE } from '../../../../config/index'
import { transferWindSpeedProperty } from '../../../../utils/index'

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
    pickerList: {
      mode: {
        title: '模式',
        columns: Object.keys(AC_MODE).map((key) => ({ text: AC_MODE[key], key })),
      },
      wind_speed: {
        title: '风速',
        columns: [
          {
            text: '1档',
            key: 40,
          },
          {
            text: '2档',
            key: 60,
          },
          {
            text: '3档',
            key: 100,
          },
          {
            text: '自动风',
            key: 102,
          },
        ],
      },
    } as Record<string, { title: string; columns: IAnyObject[] }>,
  },

  computed: {
    minTemp(data) {
      const { proType } = data.propView
      return proType === PRO_TYPE.centralAirConditioning ? 16 : 17
    },
    step(data) {
      const { proType } = data.propView
      return proType === PRO_TYPE.centralAirConditioning ? 1 : 0.5
    },
    temperature(data) {
      const { proType, temperature, currentTemperature, small_temperature } = data.propView
      if (proType === PRO_TYPE.centralAirConditioning) {
        return currentTemperature
      }
      return temperature + small_temperature
    },
    disabledMinus(data) {
      const { minTemp, temperature } = data
      const { power, mode } = data.propView
      return temperature <= minTemp || power !== 1 || mode === 'fan'
    },
    disabledPlus(data) {
      const { temperature, power, mode } = data.propView
      return temperature >= 30 || power !== 1 || mode === 'fan'
    },
    disabledSlider(data) {
      const { power, mode } = data.propView
      return power !== 1 || mode === 'fan'
    },
    disabledMode(data) {
      const { power } = data.propView
      return power !== 1
    },
    disabledWindSpeed(data) {
      const { power, mode } = data.propView
      return power !== 1 || mode === 'dry'
    },
    showIndoorTemp(data) {
      const { indoor_temperature } = data.propView
      if (!indoor_temperature || indoor_temperature === 255) {
        return null
      }
      return indoor_temperature
    },
    pickerTitle(data) {
      const { pickerList, pickerType } = data
      if (!pickerType) {
        return ''
      }
      return pickerList[pickerType].title
    },
    pickerColumns(data) {
      const { pickerList, pickerType } = data
      if (!pickerType) {
        return []
      }
      return pickerList[pickerType].columns
    },
    currentMode(data) {
      const { mode = '' } = data.propView
      return AC_MODE[mode] ?? ''
    },
    currentWindLevel(data) {
      const { wind_speed = 1 } = data.propView
      return transferWindSpeedProperty(wind_speed)
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
        key = 'temperature'
        setValue = this.data.temperature - this.data.step
      } else if (key === 'plus') {
        if (this.data.disabledPlus) {
          return
        }
        key = 'temperature'
        setValue = this.data.temperature + this.data.step
      }

      // 包括温度加减
      if (key === 'temperature') {
        const intTemp = Math.floor(setValue as number)
        const floatTemp = (setValue as number) - intTemp
        property[key] = intTemp
        property['small_temperature'] = floatTemp
        this.setData({
          'propView.temperature': intTemp,
          'propView.small_temperature': floatTemp,
        })
      } else {
        property[key] = setValue
        this.setData({
          [`propView.${key}`]: setValue,
        })
      }

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
        proType: PRO_TYPE.airConditioner,
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
          temperature: e.detail,
        },
      })
    },
    toDetail() {
      const { deviceId } = this.data.deviceInfo

      wx.navigateTo({
        url: `/package-mine/device-manage/device-detail/index?deviceId=${deviceId}`,
      })
    },

    showPicker(e: WechatMiniprogram.CustomEvent) {
      const key = e.currentTarget.dataset.key as string
      if (key === 'wind_speed' && this.data.disabledWindSpeed) {
        return
      }
      this.setData({
        isShowPicker: true,
        pickerType: key,
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },
    onPickerChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        pickerIndex: e.detail.index,
        pickerValue: e.detail.value.key,
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
