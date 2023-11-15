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
      value: false,
    },
    // 是否显示进入详情页的按钮
    isShowSetting: {
      type: Boolean,
      value: false,
    },
    // 是否显示确认按钮
    isShowConfirm: {
      type: Boolean,
      value: false,
    },
    deviceInfo: {
      type: Object,
      value: {} as Device.DeviceItem,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    power: 0,
    brightness: 1,
    colorTemperature: 0,
    largeBtnStyle: 'height: 112rpx; width: 280rpx; border-radius: 32rpx; background-color: #f7f8f9;',
    // 按钮组
    btnList: [
      {
        key: 'standby',
        text: '待机',
        icon: '../../assets/img/function/f00.png',
        iconActive: '../../assets/img/function/f01.png',
      },
      {
        key: 'warm-strong',
        text: '强暖',
        icon: '../../assets/img/function/f10.png',
        iconActive: '../../assets/img/function/f11.png',
      },
      {
        key: 'warm-soft',
        text: '弱暖',
        icon: '../../assets/img/function/f20.png',
        iconActive: '../../assets/img/function/f21.png',
      },
      {
        key: 'ventilate',
        text: '换气',
        icon: '../../assets/img/function/f30.png',
        iconActive: '../../assets/img/function/f31.png',
      },
      {
        key: 'wind',
        text: '吹风',
        icon: '../../assets/img/function/f40.png',
        iconActive: '../../assets/img/function/f41.png',
      },
    ],
    // 下方大按钮
    largeBtnList: [
      {
        key: 'lamp',
        text: '照明',
        icon: '../../assets/img/function/f50.png',
        iconActive: '../../assets/img/function/f51.png',
      },
      {
        key: 'night',
        text: '夜灯',
        icon: '../../assets/img/function/f60.png',
        iconActive: '../../assets/img/function/f61.png',
      },
    ],
  },

  computed: {},

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
              brightness: this.data.brightness,
              colorTemperature: this.data.colorTemperature,
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
              brightness: this.data.brightness,
              colorTemperature: this.data.colorTemperature,
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
        brightness: e.detail,
      })

      if (this.data.isControl) {
        this.controlSubDevice({ brightness: this.data.brightness })
      }
    },
    handleLevelChange(e: { detail: number }) {
      this.setData({
        brightness: e.detail,
      })

      if (this.data.isControl) {
        this.controlSubDevice({ brightness: this.data.brightness })
      }
    },
    handleColorTempChange(e: { detail: number }) {
      this.setData({
        colorTemperature: e.detail,
      })

      if (this.data.isControl) {
        this.controlSubDevice({ colorTemperature: this.data.colorTemperature })
      }
    },
    handleColorTempDrag(e: { detail: number }) {
      this.setData({
        colorTemperature: e.detail,
      })

      this.controlSubDevice({ colorTemperature: this.data.colorTemperature })
      this.handleChange()
    },
  },
})
