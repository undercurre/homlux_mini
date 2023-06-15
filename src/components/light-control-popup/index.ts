import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { throttle } from '../../utils/index'
import { sendDevice } from '../../apis/index'
import { PRO_TYPE } from '../../config/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
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
          if (this.data.lightInfo.OnOff) {
            this.setData({
              OnOff: this.data.lightInfo.OnOff,
              Level: this.data.lightInfo.Level ?? 1,
              ColorTemp: this.data.lightInfo.ColorTemp ?? 0,
              left: 0,
            })
          } else {
            this.setData({
              OnOff: this.data.lightInfo.OnOff,
              left: 350,
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
    ep?: number
    property: IAnyObject
  }
     */
    lightInfo: {
      type: Object,
      value: {
        ep: 1,
        deviceType: 0,
        OnOff: 0,
        Level: 1,
        ColorTemp: 0,
        maxColorTemp: 6500,
        minColorTemp: 2700,
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    OnOff: 0,
    Level: 1,
    ColorTemp: 0,
    left: 0,
  },

  computed: {
    levelShow(data) {
      return data.Level
    },
    colorTempShow(data) {
      const { maxColorTemp, minColorTemp } = data.lightInfo

      return (data.ColorTemp / 100) * (maxColorTemp - minColorTemp) + minColorTemp
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    controlSubDevice: throttle(async function (this: IAnyObject) {
      const lightInfo = this.data.lightInfo
      const property = this.data.OnOff
        ? {
            OnOff: this.data.OnOff,
            Level: this.data.Level,
            ColorTemp: this.data.ColorTemp,
          }
        : {
            OnOff: this.data.OnOff,
          }

      const res = await sendDevice({
        deviceId: lightInfo.deviceId,
        gatewayId: lightInfo.gatewayId,
        deviceType: lightInfo.deviceType,
        proType: PRO_TYPE.light,
        ep: 1,
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
      if (this.data.isControl) {
        this.controlSubDevice()
      }

      this.triggerEvent(
        'confirm',
        this.data.OnOff
          ? {
              OnOff: this.data.OnOff,
              Level: this.data.Level,
              ColorTemp: this.data.ColorTemp,
            }
          : {
              OnOff: this.data.OnOff,
            },
      )
    },

    handleChange() {
      if (this.data.isControl) {
        this.controlSubDevice()
      }

      this.triggerEvent(
        'change',
        this.data.OnOff
          ? {
              OnOff: this.data.OnOff,
              Level: this.data.Level,
              ColorTemp: this.data.ColorTemp,
            }
          : {
              OnOff: this.data.OnOff,
            },
      )
    },
    handleOnOffChange(e: WechatMiniprogram.TouchEvent) {
      if (e.currentTarget.dataset.value === this.data.OnOff) {
        return
      }
      this.setData({
        OnOff: e.currentTarget.dataset.value,
      })

      this.handleConfirm()
      this.animate(
        '#slider',
        [
          {
            left: this.data.OnOff ? '350rpx' : '0',
          },
          {
            left: this.data.OnOff ? '0' : '350rpx',
          },
        ],
        100,
      )
    },
    handleLevelDrag(e: { detail: { value: number } }) {
      this.setData({
        Level: e.detail.value,
      })

      this.handleChange()
    },
    handleLevelChange(e: { detail: number }) {
      this.setData({
        Level: e.detail,
      })

      this.handleConfirm()
    },
    handleColorTempChange(e: { detail: number }) {
      this.setData({
        ColorTemp: e.detail,
      })

      this.handleConfirm()
    },
    handleColorTempDrag(e: { detail: { value: number } }) {
      this.setData({
        ColorTemp: e.detail.value,
      })
      this.handleChange()
    },
  },
})
