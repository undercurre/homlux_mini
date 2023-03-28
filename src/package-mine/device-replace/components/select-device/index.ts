import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, deviceBinding } from '../../../../store/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] })],

  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    filterDevice: {
      type: Object,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    allRoomDeviceList: Array<Device.DeviceItem>(),
    checkedDevice: {},
    roomSelect: '',
  },

  computed: {
    /**
     * @description 待选设备列表
     * isSubdevice 过滤网关设备；
     * isCurrentRoom 按房间筛选
     * isFilterDevice 如传入checkedDevice，则列表只显示相同productId的项，并排除已选择项
     */
    wifiDeviceList(data) {
      const { filterDevice } = data
      const hasOldDevice = filterDevice && filterDevice.productId
      return data.allRoomDeviceList.filter((item) => {
        const isSubdevice = item.deviceType === 2
        const isCurrentRoom = data.roomSelect === '' ? true : item.roomId === data.roomSelect
        const isFilterDevice = hasOldDevice
          ? item.productId === filterDevice.productId && item.deviceId !== filterDevice.deviceId
          : true

        return isSubdevice && isCurrentRoom && isFilterDevice
      })
    },
  },

  lifetimes: {
    async ready() {
      await roomBinding.store.updateRoomList()

      deviceBinding.store.updateAllRoomDeviceList()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap(event: WechatMiniprogram.CustomEvent) {
      console.log('handleCardTap', event.detail)
      this.setData({ checkedDevice: event.detail })
    },

    handleRoomSelect(event: { detail: string }) {
      this.setData({ roomSelect: event.detail })
    },

    handleClose() {
      this.triggerEvent('close')
    },

    handleConfirm() {
      this.triggerEvent('confirm', this.data.checkedDevice)
    },
  },
})
