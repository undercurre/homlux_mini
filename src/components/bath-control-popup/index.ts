import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { sendDevice } from '../../apis/index'
import { PRO_TYPE } from '../../config/index'

type BtnItem = {
  text: string
  icon: string
  iconActive: string
  on?: boolean // 按钮是否激活状态
  rebound?: boolean // 按钮是否自动回弹状态
}

// 互斥的属性列表
const MUTEX_PROP = ['blowing', 'heating', 'close_all']

// 不需要替换的属性
const SHOULD_NOT_REPLACE = ['heating']
/**
 * @name 属性切换
 * @param mode 原有的属性字符串，用逗号分隔
 * @param key 要比较的属性
 */
const toggleProp = (mode: string, key: string): string => {
  const arr = mode.split(',')
  console.log('[toggleProp trigger]', arr, key)
  // key已存在，则移除
  if (arr.includes(key)) {
    if (!SHOULD_NOT_REPLACE.includes(key)) {
      arr.splice(arr.indexOf(key), 1)
    }
  }
  // 如果key是互斥属性，则先移除列表中可能存在的互斥属性
  else {
    if (MUTEX_PROP.includes(key)) {
      MUTEX_PROP.forEach((item) => {
        const index = arr.indexOf(item)
        if (index !== -1) {
          arr.splice(arr.indexOf(item), 1)
        }
      })
    }

    arr.push(key)
  }

  console.log('[toggleProp result]', arr)
  return arr.join(',')
}

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
      observer(value) {
        if (value?.mzgdPropertyDTOList?.bathHeat) {
          this.setData({
            prop: value.mzgdPropertyDTOList.bathHeat,
          })
        }
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
    prop: {} as Device.mzgdPropertyDTO,
    largeBtnStyle: 'height: 112rpx; width: 280rpx; border-radius: 32rpx; background-color: #f7f8f9;',
    // 按钮组对象
    btnListMap: {
      close_all: {
        text: '待机',
        icon: '../../assets/img/function/f00.png',
        iconActive: '../../assets/img/function/f01.png',
        rebound: true,
      },
      heating_strong: {
        text: '强暖',
        icon: '../../assets/img/function/f10.png',
        iconActive: '../../assets/img/function/f11.png',
      },
      heating_soft: {
        text: '弱暖',
        icon: '../../assets/img/function/f20.png',
        iconActive: '../../assets/img/function/f21.png',
      },
      ventilation: {
        text: '换气',
        icon: '../../assets/img/function/f30.png',
        iconActive: '../../assets/img/function/f31.png',
      },
      blowing: {
        text: '吹风',
        icon: '../../assets/img/function/f40.png',
        iconActive: '../../assets/img/function/f41.png',
      },
    } as Record<string, BtnItem>,
    // 下方大按钮对象
    largeBtnMap: {
      main_light: {
        text: '照明',
        icon: '../../assets/img/function/f50.png',
        iconActive: '../../assets/img/function/f51.png',
      },
      night_light: {
        text: '夜灯',
        icon: '../../assets/img/function/f60.png',
        iconActive: '../../assets/img/function/f61.png',
      },
    } as Record<string, BtnItem>,
  },

  computed: {
    // 按钮组，转为数组格式
    btnList(data) {
      const { btnListMap, prop } = data
      const { mode = '' } = prop
      const res = Object.keys(btnListMap).map((key: string) => {
        let on = false
        switch (key) {
          case 'heating_strong':
            on = mode.indexOf('heating') > -1 && Number(prop.heating_temperature) >= 43
            break
          case 'heating_soft':
            on = mode.indexOf('heating') > -1 && Number(prop.heating_temperature) <= 42
            break
          case 'main_light':
          case 'night_light':
            on = prop.light_mode === key
            break
          // 全关状态不显示
          case 'close_all':
            break
          default:
            on = mode.indexOf(key) > -1
            break
        }
        return {
          ...btnListMap[key],
          on,
          key,
        }
      })
      return res
    },
    // 下方大按钮，转为数组格式
    largeBtnList(data) {
      const { largeBtnMap, prop } = data
      const res = Object.keys(largeBtnMap).map((key: string) => {
        const on = (prop.light_mode ?? '').indexOf(key) > -1
        return {
          ...largeBtnMap[key],
          on,
          key,
        }
      })
      return res
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async handleBtnTap(e: WechatMiniprogram.CustomEvent) {
      const key = e.currentTarget.dataset.key as string
      const { prop } = this.data
      const { mode = '' } = prop
      const property = {} as IAnyObject

      switch (key) {
        case 'heating_strong':
          if (mode.indexOf('heating') > -1 && Number(prop.heating_temperature) >= 43) {
            property.mode_close = 'heating'
            this.setData({
              'prop.mode': 'close_all',
            })
          } else {
            property.mode_enable = 'heating'
            property.heating_temperature = '45'
            this.setData({
              'prop.mode': toggleProp(mode, 'heating'),
              'prop.heating_temperature': '45',
            })
          }
          break
        case 'heating_soft':
          if (mode.indexOf('heating') > -1 && Number(prop.heating_temperature) <= 42) {
            property.mode_close = 'heating'
            this.setData({
              'prop.mode': 'close_all',
            })
          } else {
            property.mode_enable = 'heating'
            property.heating_temperature = '30'
            this.setData({
              'prop.mode': toggleProp(mode, 'heating'),
              'prop.heating_temperature': '30',
            })
          }
          break
        case 'main_light':
        case 'night_light': {
          const light_mode = prop.light_mode === key ? 'close_all' : key
          property.light_mode = light_mode
          this.setData({
            'prop.light_mode': light_mode,
          })
          break
        }
        // ! 待机指令注意为 mode_close
        case 'close_all':
          property.mode_close = key
          this.setData({
            'prop.mode': key,
          })
          break

        default: {
          const newMode = toggleProp(mode, key)
          // console.log('toggleProp newMode', newMode)
          this.setData({
            'prop.mode': newMode,
          })

          if (newMode === 'close_all' || mode.indexOf(key) > -1) {
            property.mode_close = key
          } else {
            property.mode_enable = key
          }
        }
      }

      const res = await sendDevice({
        deviceId: this.data.deviceInfo.deviceId,
        deviceType: this.data.deviceInfo.deviceType,
        proType: PRO_TYPE.bathHeat,
        modelName: 'bathHeat',
        property,
      })

      if (!res.success) {
        Toast('控制失败')
        return
      }
    },
    toDetail() {
      const { deviceId } = this.data.deviceInfo

      wx.navigateTo({
        url: `/package-mine/device-manage/device-detail/index?deviceId=${deviceId}`,
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm')
    },
  },
})
