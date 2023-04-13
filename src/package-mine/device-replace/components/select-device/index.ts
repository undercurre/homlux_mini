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
    list: {
      type: Array,
    },
    popupTitle: {
      type: String,
      value: '选择被替换设备',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    allRoomDeviceList: Array<Device.DeviceItem>(),
    checkedDevice: {},
    roomSelect: '0',
  },

  computed: {
    /**
     * @description 所有待选设备列表
     * 如传入 deviceList，则使用指定列表；否则显示所有设备
     * ! 不按房间筛选
     */
    allDeviceList(data) {
      const list = data.list.length ? data.list : data.allRoomDeviceList
      return list.filter((d) => d.deviceType === 2)
    },

    /**
     * @description 显示待选设备列表
     * 如传入 deviceList，则使用指定列表；否则显示所有设备
     * isCurrentRoom 按房间筛选
     */
    showDeviceList(data) {
      const list = data.list.length ? data.list : data.allRoomDeviceList

      return list.filter((d) => {
        const isSubdevice = d.deviceType === 2
        const isCurrentRoom = data.roomSelect === '0' ? true : d.roomId === data.roomSelect
        return isSubdevice && isCurrentRoom
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
