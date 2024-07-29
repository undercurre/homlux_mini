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
  PRODUCT_ID,
  FAN_PID,
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
      observer() {},
    },
    // 是否显示弹窗（简化逻辑，即原controlPopup参数）
    show: {
      type: Boolean,
      value: false,
    },
    checkedList: {
      type: Array,
      value: [] as string[],
    },
  },

  observers: {
    deviceInfo(device) {
      if (!Object.keys(device).length || !FAN_PID.includes(device.productId)) {
        return
      }
      const diffData = {} as IAnyObject
      const modelName = getModelName(device.proType, device.productId)
      const prop = device.mzgdPropertyDTOList[modelName]

      if (!isNullOrUnDef(prop.fan_speed)) {
        diffData['fanLevel'] = WIND_SPEED_MAP[prop.fan_speed]
      }

      // 初始化设备属性
      diffData.deviceProp = prop

      // 色温范围计算，风扇灯判断
      if (device.productId !== PRODUCT_ID.fan_basic) {
        const { minColorTemp, maxColorTemp } = prop.colorTempRange ?? {}
        diffData.minColorTemp = minColorTemp
        diffData.maxColorTemp = maxColorTemp
      }
      if (!isNullOrUnDef(prop.fan_time_onoff_1) && Number(prop.fan_time_onoff_1) < 10000) {
        const timeStr = String(prop.fan_time_onoff_1)
        const hour = timeStr.slice(0, 2)
        const minute = timeStr.slice(2)
        diffData['pickerColumns[0].defaultIndex'] = hour
        diffData['pickerColumns[1].defaultIndex'] = minute
      }

      console.log('deviceInfo', diffData)
      this.setData(diffData)
    },
    isShowPicker(isShowPicker) {
      // 初始化设置值，在当次弹窗期间有效
      if (isShowPicker) {
        this.setData({
          'timerSetVal.fan_time_onoff_1': this.data.deviceProp.fan_time_onoff_1,
          'timerSetVal.fan_enable_timeing_1': this.data.deviceProp.fan_enable_timeing_1,
        })
      }
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    defaultImgDir,
    fanLevel: 1,
    isShowPicker: false,
    pickerTitle: '定时关风扇',
    pickerColumns: [
      {
        values: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
        defaultIndex: 0,
      },
      {
        values: Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')),
        defaultIndex: 0,
      },
    ],
    // 定时器设置值的临时保存，仅当次弹窗期间有效
    timerSetVal: {
      fan_time_onoff_1: '',
      fan_enable_timeing_1: '0',
    },
    deviceProp: {} as Device.mzgdPropertyDTO,
    maxColorTemp,
    minColorTemp,
    tabIndex: 0, // 0-风扇,1-照明
    // 按钮组对象
    btnMap: {
      fan_time_onoff_1: {
        text: '定时',
        icon: '/package-room-control/assets/function/fb0.png',
        iconActive: '/package-room-control/assets/function/fb1.png',
      },
      arround_dir: {
        text: '反转',
        icon: '/package-room-control/assets/function/fc0.png',
        iconActive: '/package-room-control/assets/function/fc1.png',
      },
      breathing_wind: {
        text: '自然风',
        icon: '/package-room-control/assets/function/fd0.png',
        iconActive: '/package-room-control/assets/function/fd1.png',
      },
    } as Record<string, BtnItem>,
    _canSyncCloudData: true, // 是否响应云端变更
    _controlTimer: null as null | number, // 控制后计时器
  },

  computed: {
    colorTempK(data) {
      if (!data.deviceProp?.colorTemperature) {
        return data.minColorTemp
      }
      return Math.round(
        (data.deviceProp.colorTemperature / 100) * (data.maxColorTemp - data.minColorTemp) + data.minColorTemp,
      )
    },
    // 时间选择弹窗中的switch
    isTimerEnabled(data) {
      return data.timerSetVal.fan_enable_timeing_1 === '1'
    },
    btnList(data) {
      const { btnMap, deviceProp } = data
      const res = Object.keys(btnMap).map((key: string) => {
        const item = btnMap[key]
        let on = false
        switch (key) {
          case 'fan_time_onoff_1': {
            const time = Number(deviceProp.fan_time_onoff_1)
            on = time > 0 && time < 10000 && deviceProp.fan_enable_timeing_1 === '1'
            break
          }
          case 'arround_dir':
            on = deviceProp.arround_dir === '0'
            break
          case 'breathing_wind':
            on = deviceProp.fan_scene === 'breathing_wind'
            break
          default:
        }

        return {
          ...item,
          on,
          key,
        }
      })
      return res
    },
    isFanOn(data) {
      return data.deviceProp.fan_power === 'on'
    },
    // 基础款风扇灯
    isBaseFan(data) {
      return data.deviceInfo.productId === PRODUCT_ID.fan_basic
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
        'deviceProp.brightness': e.detail,
      })
    },
    async handleLevelChange(e: { detail: number }) {
      this.setData({
        'deviceProp.brightness': e.detail,
      })
      this.toSendDevice({ brightness: e.detail })

      this.triggerEvent('lightStatusChange') // 通知更新房间信息，下同
    },
    // 色温调整
    handleColorTempChange(e: { detail: number }) {
      console.log('handleColorTempChange', e)
      this.setData({
        'deviceProp.colorTemperature': e.detail,
      })
      this.toSendDevice({ colorTemperature: e.detail })

      this.triggerEvent('lightStatusChange')
    },
    handleColorTempDrag(e: { detail: number }) {
      this.setData({
        'deviceProp.colorTemperature': e.detail,
      })
    },
    // 风速调整
    async handleSpeedDrag(e: { detail: number }) {
      if (!this.data.isFanOn) return

      const speeds = Object.keys(WIND_SPEED_MAP)
      this.setData({
        'deviceProp.fan_speed': speeds[e.detail - 1],
        fanLevel: e.detail,
      })
    },
    async handleSpeedChange(e: { detail: number }) {
      if (!this.data.isFanOn) return

      const speeds = Object.keys(WIND_SPEED_MAP)
      this.setData({
        'deviceProp.fan_speed': speeds[e.detail - 1],
        fanLevel: e.detail,
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
      const { arround_dir, fan_scene } = this.data.deviceProp
      const property = {} as IAnyObject // 本次要发送的指令
      switch (key) {
        case 'fan_time_onoff_1':
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
        deviceProp: {
          ...this.data.deviceProp,
          ...property,
        },
      })
      this.toSendDevice(property)
    },
    timeChange(e: { detail: { value: string[] } }) {
      const setTime = e.detail.value.join('')
      const diffData = {} as IAnyObject
      diffData['timerSetVal.fan_time_onoff_1'] = setTime
      diffData['timerSetVal.fan_enable_timeing_1'] = '1'
      this.setData(diffData)
    },
    timerEnable(e: { detail: boolean }) {
      this.setData({
        'timerSetVal.fan_enable_timeing_1': e.detail ? '1' : '0',
      })
    },
    handlePickerConfirm() {
      const property = {} as IAnyObject // 本次要发送的指令
      property.fan_time_onoff_1 = this.data.timerSetVal.fan_time_onoff_1
      property.fan_enable_timeing_1 = this.data.timerSetVal.fan_enable_timeing_1
      property.fan_ctrl_onoff_1 = '0' // 定时【关闭】操作
      property.fan_monday_endis_1 = '1' // 周一定时允许
      property.fan_tuesday_endis_1 = '1'
      property.fan_wednesday_endis_1 = '1'
      property.fan_thursday_endis_1 = '1'
      property.fan_friday_endis_1 = '1'
      property.fan_saturday_endis_1 = '1'
      property.fan_sunday_endis_1 = '1'
      this.toSendDevice(property)

      this.setData({
        'deviceProp.fan_time_onoff_1': property.fan_time_onoff_1,
        'deviceProp.fan_enable_timeing_1': property.fan_enable_timeing_1,
        isShowPicker: false,
      })
    },
    handlePickerClose() {
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
    blank() {
      console.log('blank')
    },
  },
})
