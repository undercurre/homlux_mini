import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, homeStore } from '../../../../store/index'
import { getModelName, PRO_TYPE, SCREEN_PID, defaultImgDir } from '../../../../config/index'
import { getSensorLogs } from '../../../../apis/index'
import pageBehavior from '../../../../behaviors/pageBehaviors'

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
          this.updateSensorLogs()
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
    logList: [] as Device.Log[], // 设备（传感器）日志列表
    /** 提供给关联选择的列表 */
    list: [] as (Device.DeviceItem | Scene.SceneItem)[],
  },

  computed: {
    // 是否局域网可控
    isLanCtl(data) {
      return !data.deviceInfo.onLineStatus && data.deviceInfo.canLanCtrl
    },
    logListView(data) {
      return data.logList.map((log) => {
        const { reportAt } = log
        const [date, time] = reportAt.split(' ')
        return {
          content: log.content,
          date,
          time,
        }
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async updateSensorLogs() {
      const { deviceId, proType } = this.data.deviceInfo
      if (proType !== PRO_TYPE.sensor) {
        return
      }
      const res = await getSensorLogs({ deviceId, houseId: homeStore.currentHomeId })
      console.log(res)
      this.setData({
        logList: res.result,
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
    handleCardTap() {},
  },
})
