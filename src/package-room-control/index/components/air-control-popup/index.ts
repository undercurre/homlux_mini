import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { sendDevice } from '../../../../apis/index'
import { PRO_TYPE } from '../../../../config/index'

type BtnItem = {
  text: string
  icon: string
  iconActive: string
  on?: boolean // 按钮是否激活状态
  rebound?: boolean // 按钮是否自动回弹状态
  textWidth?: string // 按钮文字宽度
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
    _canSyncCloudData: true, // 是否响应云端变更
    _controlTimer: null as null | number, // 控制后计时器
    prop: {} as IAnyObject, // 用于视图显示
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
      on: {
        text: '照明',
        icon: '../../assets/img/function/f50.png',
        iconActive: '../../assets/img/function/f51.png',
      },
      laundry: {
        text: '一键晾衣',
        icon: '../../assets/img/function/fa0.png',
        iconActive: '../../assets/img/function/fa1.png',
        textWidth: '96rpx',
        disabled: false,
      },
    } as Record<string, BtnItem>,
  },

  computed: {
    // 按钮组，转为数组格式
    btnList(data) {
      const { btnMap, prop } = data
      const { updown, location_status } = prop
      const res = Object.keys(btnMap).map((key: string) => {
        const on = updown === key
        const disabled =
          (key === 'up' && updown === 'up') ||
          (key === 'pause' && updown === 'pause') ||
          (key === 'down' && updown === 'down') ||
          (key === 'up' && location_status === 'upper_limit') ||
          (key === 'down' && location_status === 'lower_limit')

        return {
          ...btnMap[key],
          on,
          disabled,
          key,
        }
      })
      return res
    },
    // 下方大按钮，转为数组格式
    largeBtnList(data) {
      const { largeBtnMap, prop } = data
      const res = Object.keys(largeBtnMap).map((key) => {
        // 照明关闭，则【关灯】按钮点亮
        const on = key === 'laundry' ? prop['laundry'] === 'on' : prop['light'] === key
        // 未设置晾衣高度，则一键晾衣按钮禁用
        const disabled = key === 'laundry' && !data.custom_height

        return {
          ...largeBtnMap[key],
          on,
          disabled,
          key,
        }
      })
      return res
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
    async handleBtnTap() {
      // const key = e.currentTarget.dataset.key as string
      // const { prop } = this.data
      const property = {} as IAnyObject

      // 即时使用设置值渲染
      // this.setData({
      //   prop: {
      //     ...prop,
      //     ...property,
      //   },
      // })

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
        proType: PRO_TYPE.clothesDryingRack,
        modelName: 'clothesDryingRack',
        property,
      })

      if (!res.success) {
        Toast({ message: '控制失败', zIndex: 9999 })
        return
      }
    },
    handleSlideEnd(e: WechatMiniprogram.CustomEvent) {
      console.log('handleSlideEnd', e)
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
  },
})
