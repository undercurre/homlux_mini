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
    sDeviceList: {
      type: Array,
      value: [],
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
    popupTitle(data) {
      const { filterDevice } = data
      const choosingNew = filterDevice && filterDevice.productId
      return choosingNew ? '选择新设备' : '选择被替换设备'
    },

    /**
     * @description 待选设备列表
     * 如传入 deviceList，则使用指定列表；否则显示所有设备
     * isCurrentRoom 按房间筛选
     */
    computedToDeviceList(data) {
      const list = data.sDeviceList?.length ? data.sDeviceList : data.allRoomDeviceList
      return list.filter((d) => {
        const isCurrentRoom = data.roomSelect === '' ? true : d.roomId === data.roomSelect
        return isCurrentRoom
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
