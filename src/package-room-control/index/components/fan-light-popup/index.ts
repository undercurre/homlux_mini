import { isNullOrUnDef } from '../../../../utils/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, deviceStore } from '../../../../store/index'
import {
  maxColorTemp,
  minColorTemp,
  getModelName,
  PRO_TYPE,
  defaultImgDir,
  WIND_SPEED_MAP,
} from '../../../../config/index'
import { sendDevice } from '../../../../apis/index'
import Toast from '../../../../skyline-components/mz-toast/toast'
import pageBehavior from '../../../../behaviors/pageBehaviors'
import { runInAction } from 'mobx-miniprogram'

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
    show: false,
    // 灯信息，用于组件传值同步
    lightInfoInner: {
      brightness: 10,
      colorTemperature: 20,
      fan_speed: 1,
      fan_level: 1,
      delay_fan_off: 0,
      arround_dir: 1,
      fan_scene: 'fanmanual',
    },
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
    btnList(data) {
      const { btnMap, lightInfoInner } = data
      const res = Object.keys(btnMap).map((key: string) => {
        let on = false
        switch (key) {
          case 'delay_fan_off':
            on = !!lightInfoInner.delay_fan_off
            break
          case 'arround_dir':
            on = lightInfoInner.arround_dir === 0
            break
          case 'breathing_wind':
            on = lightInfoInner.fan_scene === 'breathing_wind'
            break
          default:
        }

        return {
          ...btnMap[key],
          on,
          key,
        }
      })
      console.log('computed', res)
      return res
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

    handleClose() {
      this.triggerEvent('close')
    },

    async lightSendDeviceControl(type: 'colorTemperature' | 'brightness' | 'fan_speed') {
      const deviceId = this.data.checkedList[0]
      const { proType, deviceType } = this.data.deviceInfo
      const device = deviceStore.deviceMap[deviceId]
      if (proType !== PRO_TYPE.light) {
        return
      }

      const oldValue = this.data.deviceInfo[type]

      // 即时改变devicePageList，以便场景引用
      runInAction(() => {
        deviceStore.deviceMap[deviceId].mzgdPropertyDTOList['light'][type] = this.data.lightInfoInner[type]
      })
      device.mzgdPropertyDTOList['light'][type] = this.data.lightInfoInner[type]
      this.triggerEvent('updateDevice', device)

      const res = await sendDevice({
        proType,
        deviceType,
        deviceId,
        modelName: 'light',
        property: {
          [type]: this.data.lightInfoInner[type],
        },
      })

      if (!res.success) {
        device.mzgdPropertyDTOList['light'][type] = oldValue
        this.triggerEvent('updateDevice', device)
        Toast('控制失败')
      }
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
      this.lightSendDeviceControl('brightness')
      this.triggerEvent('lightStatusChange')
    },
    // 色温调整
    handleColorTempChange(e: { detail: number }) {
      console.log('handleColorTempChange', e.detail)
      this.setData({
        'lightInfoInner.colorTemperature': e.detail,
      })
      this.lightSendDeviceControl('colorTemperature')
      this.triggerEvent('lightStatusChange')
    },
    handleColorTempDrag(e: { detail: number }) {
      this.setData({
        'lightInfoInner.colorTemperature': e.detail,
      })
    },
    // 风速调整
    async handleSpeedDrag(e: { detail: number }) {
      const speeds = Object.keys(WIND_SPEED_MAP)
      this.setData({
        'lightInfoInner.fan_speed': speeds[e.detail - 1],
        'lightInfoInner.fan_level': e.detail,
      })
    },
    async handleSpeedChange(e: { detail: number }) {
      const speeds = Object.keys(WIND_SPEED_MAP)
      this.setData({
        'lightInfoInner.fan_speed': speeds[e.detail - 1],
        'lightInfoInner.fan_level': e.detail,
      })
      this.lightSendDeviceControl('fan_speed')
    },

    toDetail() {
      const deviceId = this.data.checkedList[0].split(':')[0]

      this.triggerEvent('close')
      wx.navigateTo({
        url: `/package-mine/device-manage/device-detail/index?deviceId=${deviceId}`,
      })
    },

    // 默认不允许滑动切换，但切换过程中能中断自动滑动并触发手动滑动，该方法为手动滑动切换时使用的方法
    onTabChanged(e: { detail: { current: number; source: string } }) {
      const { current, source = '' } = e.detail
      if (source === 'touch') {
        this.setData({
          tabIndex: current,
        })
      }
    },
    // 场景类型变更
    handleType(e: { detail: { checkedIndex: number } }) {
      this.setData({
        tabIndex: e.detail.checkedIndex,
      })
    },
    async handleModeTap() {
      // const key = e.currentTarget.dataset.key as string
      // const { prop } = this.data
      // const { mode = '', heating_temperature } = prop
      // const property = {} as IAnyObject // 本次要发送的指令
      // switch (key) {
      //   default: {
      //     if (mode?.indexOf(key) > -1) {
      //       delete prop.mode
      //       property.mode = 'close_all'
      //     } else {
      //       property.mode = key
      //     }
      //   }
      // }
      // 即时使用设置值渲染
      // console.log('handleModeTap', {
      //   ...prop,
      //   ...property,
      // })
      // this.setData({
      //   prop: {
      //     ...prop,
      //     ...property,
      //   },
      // })
      // this.toSendDevice(property)
    },
  },
})
