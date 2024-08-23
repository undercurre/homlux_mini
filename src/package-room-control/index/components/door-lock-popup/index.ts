import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding } from '../../../../store/index'
import { getModelName, PRO_TYPE, SCREEN_PID, defaultImgDir, doorStatusConfig } from '../../../../config/index'
import { deviceTransmit } from '../../../../apis/index'
import pageBehavior from '../../../../behaviors/pageBehaviors'
import dayjs from 'dayjs'

const WEEKDAY_ARRAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

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
        if (!Object.keys(device).length || device.proType !== PRO_TYPE.doorLock) {
          return
        }
        const diffData = {} as IAnyObject
        const modelName = getModelName(device.proType, device.productId)
        const prop = device.mzgdPropertyDTOList[modelName]

        // 初始化设备属性
        diffData.deviceProp = prop

        this.setData(diffData)
      },
    },
    // 是否显示弹窗（简化逻辑，即原controlPopup参数）
    show: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          this.updateLogs()
        }
      },
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
    deviceProp: {} as Device.mzgdPropertyDTO,
    logList: [] as IAnyObject[], // 日志列表
    list: [] as (Device.DeviceItem | Scene.SceneItem)[],
    todayStr: dayjs().format('YYYY年M月D日'),
    weekday: WEEKDAY_ARRAY[Number(dayjs().format('d'))],
    isLoaded: false,
  },

  computed: {
    // 是否局域网可控
    isLanCtl(data) {
      return !data.deviceInfo.onLineStatus && data.deviceInfo.canLanCtrl
    },
    batteryView(data) {
      return `${data.deviceInfo?.property?.batteryPower ?? 0}%`
    },
    batteryIcon(data) {
      return data.deviceInfo?.property?.batteryPower <= 1 ? 'battery2.png' : 'battery.png'
    },
    batteryTextColor(data) {
      return data.deviceInfo?.property?.batteryPower <= 1 ? 'text-hex-ff3849' : 'text-hex-666'
    },
    logListView(data) {
      return data.logList.map((log) => {
        const { createTime } = log
        const [date, time] = createTime.split(' ')
        return {
          content: log.content,
          textColor: log.isAlarm === '2' ? 'text-hex-ff3849' : 'text-hex-000',
          date,
          time,
        }
      })
    },
    /**
     * 门锁状态显示，与美居保持一致
     *
     */
    doorLockStateText(data) {
      const { doorLockState = 0, electronicLock } = data.deviceInfo
      let status = doorLockState % 128
      // ! 只有在关闭状态，才能反锁
      if (status === 0 && electronicLock === 1) {
        status = 5
      }
      return doorStatusConfig[status].statusText
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async updateLogs() {
      const { deviceId, proType } = this.data.deviceInfo
      if (proType !== PRO_TYPE.doorLock) {
        return
      }
      const startTime = dayjs().format('YYYY-MM-DD 00:00:00')
      const endTime = dayjs().format('YYYY-MM-DD 23:59:59')
      const res = (await deviceTransmit('GET_DOOR_LOCK_DYNAMIC', {
        deviceId,
        startTime,
        endTime,
        pageNo: 1,
        pageSize: 100,
      })) as IAnyObject
      this.setData({
        // logList: [...res.result.list, ...res.result.list, ...res.result.list, ...res.result.list, ...res.result.list],
        logList: res.result.list,
        isLoaded: true,
      })
    },
    handleClose() {
      this.triggerEvent('close')
    },

    toDetail() {
      const deviceId = this.data.checkedList[0].split(':')[0]
      const { deviceType, productId, gatewayId } = this.data.deviceInfo
      const pageName = deviceType === 4 ? 'group-detail' : 'device-detail'
      const _deviceId = SCREEN_PID.includes(productId) ? gatewayId : deviceId

      this.triggerEvent('close')
      wx.navigateTo({
        url: `/package-mine/device-manage/${pageName}/index?deviceId=${_deviceId}`,
      })
    },
    toPage(e: WechatMiniprogram.TouchEvent<never, never, { url: string }>) {
      const deviceId = this.data.checkedList[0].split(':')[0]
      console.log('toPage', e.currentTarget.dataset.url)
      wx.navigateTo({
        url: `${e.currentTarget.dataset.url}?deviceId=${deviceId}`,
      })
    },
  },
})
