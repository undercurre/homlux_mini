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
      value: {},
      observer(value) {
        if (value) {
          this.setData({
            prop: value as Device.DeviceItem & Device.mzgdPropertyDTO,
          })
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 组件私有属性，用于设值显示
    prop: {} as Device.DeviceItem & Device.mzgdPropertyDTO,
    largeBtnStyle: 'height: 112rpx; width: 280rpx; border-radius: 32rpx; background-color: #f7f8f9;',
    // 按钮组
    btnMap: {
      up: {
        text: '上升',
        icon: '../../assets/img/function/f70.png',
        iconActive: '../../assets/img/function/f71.png',
      },
      pause: {
        text: '暂停',
        icon: '../../assets/img/function/f80.png',
        iconActive: '../../assets/img/function/f81.png',
      },
      down: {
        text: '下降',
        icon: '../../assets/img/function/f90.png',
        iconActive: '../../assets/img/function/f91.png',
      },
    } as Record<string, BtnItem>,
    // 下方大按钮
    largeBtnMap: {
      light: {
        text: '照明',
        icon: '../../assets/img/function/f50.png',
        iconActive: '../../assets/img/function/f51.png',
        textWidth: '50rpx',
      },
      laundry: {
        text: '一键晾衣',
        icon: '../../assets/img/function/fa0.png',
        iconActive: '../../assets/img/function/fa1.png',
        textWidth: '96rpx',
      },
    },
  },

  computed: {
    // 按钮组，转为数组格式
    btnList(data) {
      const { btnMap, prop } = data
      const { updown = 'pause' } = prop
      const res = Object.keys(btnMap).map((key: string) => {
        const on = updown === key

        return {
          ...btnMap[key],
          on,
          key,
        }
      })
      return res
    },
    // 下方大按钮，转为数组格式
    largeBtnList(data) {
      const { largeBtnMap, prop } = data
      const res = Object.keys(largeBtnMap).map((key) => {
        const on = prop[key as 'laundry' | 'light'] === 'on'
        return {
          ...largeBtnMap[key as 'laundry' | 'light'],
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
      const property = {} as IAnyObject

      switch (key) {
        case 'up':
        case 'down':
        case 'pause':
          property.updown = key
          this.setData({
            'prop.updown': key,
          })
          break

        case 'light': {
          const setValue = prop.light === 'on' ? 'off' : 'on'
          property.light = setValue
          this.setData({
            'prop.light': setValue,
          })

          break
        }

        case 'laundry': {
          console.log('custom_height', prop.custom_height)
          if (prop.custom_height) {
            property.laundry = 'on'
            this.setData({
              'prop.laundry': 'on',
            })
          } else {
            Toast({ message: '请先设置好一键晾衣高度', zIndex: 9999 })
            return
          }
          break
        }

        default:
      }

      const res = await sendDevice({
        deviceId: this.data.deviceInfo.deviceId,
        deviceType: this.data.deviceInfo.deviceType,
        proType: PRO_TYPE.clothesDryingRack,
        modelName: 'clothesDryingRack',
        property,
      })

      if (!res.success) {
        Toast({ message: '控制失败', zIndex: 9999 })
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
      this.triggerEvent('confirm', {
        ...this.data.deviceInfo,
        ...this.data.prop,
      })
    },
  },
})
