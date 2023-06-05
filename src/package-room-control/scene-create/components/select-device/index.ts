import { ComponentWithComputed } from 'miniprogram-computed'
import { deviceStore } from '../../../../store/index'
import { findDevice } from '../../../../apis/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    allDeviceList: [] as Device.DeviceItem[], // 可选的设备列表
    showDeviceListPopup: false,
    _cacheDeviceStatusMap: {} as IAnyObject, // 缓存选中前的设备状态集合
    selectList: Array<string>(), // 已选择的设备列表
    cacheSelectList: Array<string>(), // 设备列表弹窗的已选的设备列表
  },

  computed: {
    showDeviceList(data) {
      return deviceStore.deviceFlattenList.filter((item) => data.selectList.includes(item.uniId))
    },
  },

  lifetimes: {
    ready() {
      // 排除已经关联了场景的开关设备
      this.setData({
        allDeviceList: deviceStore.deviceFlattenList.filter((item) => {
          const [, switchId] = item.uniId.split(':')

          return !switchId || (switchId && item.mzgdPropertyDTOList[switchId].ButtonMode !== 2)
        }),
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    addDevice() {
      this.setData({
        showDeviceListPopup: true,
        cacheSelectList: this.data.selectList.concat([]),
      })
    },

    closeDeviceListPopup() {
      this.setData({
        showDeviceListPopup: false,
      })
    },

    handleDeviceSelect(e: { detail: string }) {
      console.log('handleDeviceSelect', e)
      const deviceMap = deviceStore.deviceFlattenMap
      const selectId = e.detail

      // 取消选择逻辑
      if (this.data.cacheSelectList.includes(selectId)) {
        const index = this.data.cacheSelectList.findIndex((id) => id === selectId)
        this.data.cacheSelectList.splice(index, 1)
        this.setData({
          cacheSelectList: [...this.data.cacheSelectList],
        })
        return
      }

      const device = deviceMap[selectId]

      // 缓存原始状态，用于退出创建时还原设备状态
      if (this.data._cacheDeviceStatusMap[selectId]) {
        this.data._cacheDeviceStatusMap[selectId] = JSON.parse(JSON.stringify(device))
      }

      findDevice({ gatewayId: device.gatewayId, devId: device.deviceId })

      this.setData({
        cacheSelectList: [...this.data.cacheSelectList, selectId],
      })
    },

    // 全选
    clickTitleLeftBtn() {
      this.setData({
        cacheSelectList: this.data.allDeviceList.map((item) => item.uniId),
      })
    },

    handleLDeviceSelectConfirm() {
      this.setData({
        showDeviceListPopup: false,
        selectList: this.data.cacheSelectList,
      })
    },

    next() {
      this.triggerEvent('confirm', { selectList: this.data.selectList })
    },
  },
})
