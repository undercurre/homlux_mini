import { isNullOrUnDef } from '../../../../utils/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding } from '../../../../store/index'
import {
  maxColorTemp,
  minColorTemp,
  getModelName,
  PRO_TYPE,
  defaultImgDir,
  WIND_SPEED_MAP,
  NO_SYNC_DEVICE_STATUS,
} from '../../../../config/index'
import { sendDevice } from '../../../../apis/index'
import Toast from '../../../../skyline-components/mz-toast/toast'
import pageBehavior from '../../../../behaviors/pageBehaviors'

type BtnItem = {
  text: string
  icon: string
  iconActive: string
  on?: boolean // 按钮是否激活状态
  rebound?: boolean // 按钮是否自动回弹状态
}

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] }), pageBehavior],
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  properties: {
    /**
     * 选中设备的属性
     */
    deviceInfo: {
      type: Object,
      value: {} as Device.DeviceItem,
      observer(device) {
        if (!Object.keys(device).length) {
          return
        }
        const diffData = {} as IAnyObject
        const modelName = getModelName(device.proType, device.productId)
        const prop = device.mzgdPropertyDTOList[modelName]

        // 初始化可控变量
        if (!isNullOrUnDef(prop.brightness)) {
          diffData['lightInfoInner.brightness'] = prop.brightness
        }
        if (!isNullOrUnDef(prop.colorTemperature)) {
          diffData['lightInfoInner.colorTemperature'] = prop.colorTemperature
        }
        if (!isNullOrUnDef(prop.fan_speed)) {
          diffData['lightInfoInner.fan_speed'] = prop.fan_speed
          diffData['lightInfoInner.fan_level'] = WIND_SPEED_MAP[prop.fan_speed]
        }
        if (!isNullOrUnDef(prop.delay_fan_off)) {
          diffData['lightInfoInner.delay_fan_off'] = prop.delay_fan_off
        }
        if (!isNullOrUnDef(prop.arround_dir)) {
          diffData['lightInfoInner.arround_dir'] = prop.arround_dir
        }
        if (!isNullOrUnDef(prop.fan_scene)) {
          diffData['lightInfoInner.fan_scene'] = prop.fan_scene
        }

        // 初始化设备属性
        diffData.deviceProp = prop

        // 色温范围计算，风扇灯判断
        if (device.proType === PRO_TYPE.light) {
          const { minColorTemp, maxColorTemp } = device.mzgdPropertyDTOList['light'].colorTempRange!
          diffData.minColorTemp = minColorTemp
          diffData.maxColorTemp = maxColorTemp
        }
        this.setData(diffData)
      },
    },
    // 是否显示弹窗（简化逻辑，即原controlPopup参数）
    show: {
      type: Boolean,
      value: false,
      observer() {},
    },
    checkedList: {
      type: Array,
      value: [] as string[],
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    defaultImgDir,
    // 灯信息，用于组件传值同步
    lightInfoInner: {
      brightness: 10,
      colorTemperature: 20,
      fan_speed: 1,
      fan_level: 1,
      delay_fan_off: '0',
      arround_dir: '1',
      fan_scene: 'fanmanual',
    },
    isShowPicker: false,
    pickerTitle: '延时关风扇',
    pickerColumns: [
      {
        values: Array.from({ length: 13 }, (_, i) => String(i).padStart(2, '0')),
        defaultIndex: 0,
      },
      {
        values: Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')),
        defaultIndex: 0,
      },
    ],
    deviceProp: {} as Device.mzgdPropertyDTO,
    maxColorTemp,
    minColorTemp,
    tabIndex: 0, // 0-风扇,1-照明
    // 按钮组对象
    btnMap: {
      delay_fan_off: {
        text: '定时',
        icon: '../../assets/img/function/fb0.png',
        iconActive: '../../assets/img/function/fb1.png',
      },
      arround_dir: {
        text: '反转',
        icon: '../../assets/img/function/fc0.png',
        iconActive: '../../assets/img/function/fc1.png',
      },
      breathing_wind: {
        text: '自然风',
        icon: '../../assets/img/function/fd0.png',
        iconActive: '../../assets/img/function/fd1.png',
      },
    } as Record<string, BtnItem>,
    _canSyncCloudData: true, // 是否响应云端变更
    _controlTimer: null as null | number, // 控制后计时器
  },

  computed: {
    colorTempK(data) {
      if (!data.lightInfoInner?.colorTemperature) {
        return data.minColorTemp
      }
      return Math.round(
        (data.lightInfoInner.colorTemperature / 100) * (data.maxColorTemp - data.minColorTemp) + data.minColorTemp,
      )
    },
    selectedTime(data) {
      const { delay_fan_off = '0' } = data.lightInfoInner ?? {}
      if (delay_fan_off === '0') return ''

      const hour = Math.floor(Number(delay_fan_off) / 60)
      const minute = Number(delay_fan_off) % 60
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    },
    btnList(data) {
      const { btnMap, lightInfoInner, selectedTime } = data
      const res = Object.keys(btnMap).map((key: string) => {
        const item = btnMap[key]
        let on = false
        let { text } = item
        switch (key) {
          case 'delay_fan_off': {
            on = Number(lightInfoInner.delay_fan_off) > 0
            if (selectedTime) text = `剩余${selectedTime}`
            break
          }
          case 'arround_dir':
            on = lightInfoInner.arround_dir === '0'
            break
          case 'breathing_wind':
            on = lightInfoInner.fan_scene === 'breathing_wind'
            break
          default:
        }

        return {
          ...item,
          text,
          on,
          key,
        }
      })
      console.log('computed', res)
      return res
    },
    isFanOn(data) {
      return data.deviceProp.fan_power === 'on'
    },
    // 是否局域网可控
    isLanCtl(data) {
      return !data.deviceInfo.onLineStatus && data.deviceInfo.canLanCtrl
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    sliderTap() {
      if (!this.data.deviceProp.power) {
        Toast('请先开灯')
      }
    },
    sliderTapFan() {
      if (!this.data.isFanOn) {
        Toast('请先开风扇')
      }
    },

    handleClose() {
      this.triggerEvent('close')
    },

    // 亮度调整
    async handleLevelDrag(e: { detail: number }) {
      this.setData({
        'lightInfoInner.brightness': e.detail,
      })
    },
    async handleLevelChange(e: { detail: number }) {
      this.setData({
        'lightInfoInner.brightness': e.detail,
      })
      this.toSendDevice({ brightness: e.detail })

      this.triggerEvent('lightStatusChange') // 通知更新房间信息，下同
    },
    // 色温调整
    handleColorTempChange(e: { detail: number }) {
      console.log('handleColorTempChange', e)
      this.setData({
        'lightInfoInner.colorTemperature': e.detail,
      })
      this.toSendDevice({ colorTemperature: e.detail })

      this.triggerEvent('lightStatusChange')
    },
    handleColorTempDrag(e: { detail: number }) {
      this.setData({
        'lightInfoInner.colorTemperature': e.detail,
      })
    },
    // 风速调整
    async handleSpeedDrag(e: { detail: number }) {
      if (!this.data.isFanOn) return

      const speeds = Object.keys(WIND_SPEED_MAP)
      this.setData({
        'lightInfoInner.fan_speed': speeds[e.detail - 1],
        'lightInfoInner.fan_level': e.detail,
      })
    },
    async handleSpeedChange(e: { detail: number }) {
      if (!this.data.isFanOn) return

      const speeds = Object.keys(WIND_SPEED_MAP)
      this.setData({
        'lightInfoInner.fan_speed': speeds[e.detail - 1],
        'lightInfoInner.fan_level': e.detail,
      })
      this.toSendDevice({ fan_speed: speeds[e.detail - 1] })
    },
    async toSendDevice(property: IAnyObject) {
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
        proType: PRO_TYPE.light,
        modelName: 'light',
        property,
      })

      if (!res.success) {
        Toast({ message: '控制失败', zIndex: 9999 })
        return
      }
    },
    toDetail() {
      const deviceId = this.data.checkedList[0].split(':')[0]

      this.triggerEvent('close')
      wx.navigateTo({
        url: `/package-mine/device-manage/device-detail/index?deviceId=${deviceId}`,
      })
    },

    // 默认不允许滑动切换，但切换过程中能中断自动滑动并触发手动滑动，该方法为手动滑动切换时使用的方法
    onTabChanged(e: WechatMiniprogram.CustomEvent<{ current: number; source: string }>) {
      const { current, source = '' } = e.detail
      if (source === 'touch') {
        this.setData({
          tabIndex: current,
        })
      }
    },
    // 场景类型变更
    handleType(e: WechatMiniprogram.CustomEvent<{ checkedIndex: number }>) {
      this.setData({
        tabIndex: e.detail.checkedIndex,
      })
    },
    async handleFuncTap(e: WechatMiniprogram.CustomEvent<never, never, { key: string }>) {
      if (!this.data.isFanOn) return

      const key = e.currentTarget.dataset.key as string
      const { arround_dir, fan_scene } = this.data.lightInfoInner
      const property = {} as IAnyObject // 本次要发送的指令
      switch (key) {
        case 'delay_fan_off':
          this.setData({
            isShowPicker: !this.data.isShowPicker,
          })
          break
        case 'arround_dir':
          property.arround_dir = arround_dir === '0' ? '1' : '0'
          break
        case 'breathing_wind':
          property.fan_scene = fan_scene === 'breathing_wind' ? 'fanmanual' : 'breathing_wind'
          break
        default:
      }

      this.setData({
        lightInfoInner: {
          ...this.data.lightInfoInner,
          ...property,
        },
      })
      this.toSendDevice(property)
    },
    timeChange(e: { detail: { value: string[] } }) {
      const { delay_fan_off = '0' } = this.data.lightInfoInner ?? {}
      const oldHour = Math.floor(Number(delay_fan_off) / 60)
      const newHour = e.detail.value[0]
      const newMinute = e.detail.value[1]
      const selectedTime = e.detail.value.join(':')
      const diffData = { selectedTime } as IAnyObject
      diffData['lightInfoInner.delay_fan_off'] = String(Number(newHour) * 60 + Number(newMinute))

      // if (oldHour !== newHour && (newHour == '12' || oldHour === '12')) {
      //   diffData['pickerColumns[1].values'] =
      //     newHour === '12' ? '00' : Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
      // }

      this.setData(diffData)
      console.log('selectedTime', selectedTime, oldHour, newHour)
    },
    handlePickerClose() {
      this.setData({
        isShowPicker: false,
      })
    },
    handlePickerConfirm() {
      const [hour, minute] = this.data.selectedTime.split(':')
      const property = {} as IAnyObject // 本次要发送的指令
      property.delay_fan_off = String(Number(hour) * 60 + Number(minute))
      this.toSendDevice(property)

      this.setData({
        isShowPicker: false,
      })
    },
    handleBtnTap(e: WechatMiniprogram.TouchEvent<{ key: string }>) {
      const { key } = e.detail
      console.log('handleBtnTap', key)
      if (key === 'fan') {
        const fan_power = this.data.isFanOn ? 'off' : 'on'
        this.toSendDevice({
          fan_power,
        })
        this.setData({
          'deviceProp.fan_power': fan_power,
        })
      } else if (key === 'light') {
        const power = this.data.deviceProp.power ? 0 : 1
        this.toSendDevice({
          power,
        })
        this.setData({
          'deviceProp.power': power,
        })
      }
    },
  },
})
