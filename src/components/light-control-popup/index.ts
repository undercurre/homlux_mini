import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { throttle } from '../../utils/index'
import { sendDevice } from '../../apis/index'
import { PRO_TYPE } from '../../config/index'

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
    // 是否下发控制命令
    isControl: {
      type: Boolean,
      value: true,
    },
    show: {
      type: Boolean,
      observer(value) {
        if (value) {
          if (this.data.lightInfo.power) {
            this.setData({
              power: this.data.lightInfo.power,
              brightness: this.data.lightInfo.brightness ?? 1,
              colorTemperature: this.data.lightInfo.colorTemperature ?? 0,
              _brightness: this.data.lightInfo.brightness ?? 1,
              _colorTemperature: this.data.lightInfo.colorTemperature ?? 0,
            })
          } else {
            this.setData({
              power: this.data.lightInfo.power,
              brightness: this.data.lightInfo.brightness ?? 1,
              colorTemperature: this.data.lightInfo.colorTemperature ?? 0,
              _brightness: this.data.lightInfo.brightness ?? 1,
              _colorTemperature: this.data.lightInfo.colorTemperature ?? 0,
            })
          }
        }
      },
    },
    /**
     * lightInfo数据结构
     * {
    deviceType: number
    deviceId: string
    gatewayId?: string
    modelName?: string
    property: IAnyObject
  }
     */
    lightInfo: {
      type: Object,
      value: {
        modelName: 'light',
        deviceType: 0,
        power: 0,
        brightness: 1,
        colorTemperature: 0,
        maxColorTemp: 6500,
        minColorTemp: 2700,
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    power: 0,
    brightness: 1,
    colorTemperature: 0,
    //由于mz-slider组件不能修改原传入值，否则造成跳动，所以只能多做一个备份值
    _brightness: 1,
    _colorTemperature: 0,
  },

  computed: {
    levelShow(data) {
      return data._brightness
    },
    colorTempShow(data) {
      const { maxColorTemp, minColorTemp } = data.lightInfo.colorTempRange || data.lightInfo

      return (data._colorTemperature / 100) * (maxColorTemp - minColorTemp) + minColorTemp
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    controlSubDevice: throttle(async function (this: IAnyObject, property: IAnyObject) {
      const lightInfo = this.data.lightInfo

      const res = await sendDevice({
        deviceId: lightInfo.deviceId,
        gatewayId: lightInfo.gatewayId,
        deviceType: lightInfo.deviceType,
        proType: PRO_TYPE.light,
        modelName: 'light',
        property,
      })

      if (!res.success) {
        Toast('控制失败')
        return
      }
    }, 1000),

    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent(
        'confirm',
        this.data.power
          ? {
              power: this.data.power,
              brightness: this.data._brightness,
              colorTemperature: this.data._colorTemperature,
            }
          : {
              power: this.data.power,
            },
      )
    },

    handleChange() {
      this.triggerEvent(
        'change',
        this.data.power
          ? {
              power: this.data.power,
              brightness: this.data._brightness,
              colorTemperature: this.data._colorTemperature,
            }
          : {
              power: this.data.power,
            },
      )
    },
    handleOnOffChange(e: WechatMiniprogram.CustomEvent) {
      const power = e.detail ? 1 : 0

      this.setData({
        power: power,
      })

      if (this.data.isControl) {
        this.controlSubDevice({ power: this.data.power })
      }
    },
    handleLevelDrag(e: { detail: number }) {
      this.setData({
        _brightness: e.detail,
      })

      if (this.data.isControl) {
        this.controlSubDevice({ brightness: this.data._brightness })
      }
    },
    handleLevelChange(e: { detail: number }) {
      this.setData({
        _brightness: e.detail,
      })

      if (this.data.isControl) {
        this.controlSubDevice({ brightness: this.data._brightness })
      }
    },
    handleColorTempChange(e: { detail: number }) {
      this.setData({
        _colorTemperature: e.detail,
      })

      if (this.data.isControl) {
        this.controlSubDevice({ colorTemperature: this.data._colorTemperature })
      }
    },
    handleColorTempDrag(e: { detail: number }) {
      this.setData({
        _colorTemperature: e.detail,
      })

      this.controlSubDevice({ colorTemperature: this.data._colorTemperature })
      this.handleChange()
    },
  },
})
