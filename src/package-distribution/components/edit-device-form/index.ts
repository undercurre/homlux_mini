import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import { homeBinding, roomBinding, roomStore } from '../../../store/index'
import { checkInputNameIllegal } from '../../../utils/index'

Component({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    switchList: {
      type: Array,
      value: [],
    },
    customStyle: {
      type: String,
      value: '',
    },
    deviceName: {
      type: String,
      value: '',
    },
    roomId: {
      type: String,
      value: '',
    },
    roomName: {
      type: String,
      value: '',
    },
  },

  observers: {
    'deviceName, roomId, roomName, switchList': function (deviceName, roomId, roomName, switchList) {
      this.setData({
        isAddRoom: false,
        isShowEditSwitch: false,
        deviceInfo: {
          roomId: roomId,
          roomName: roomName,
          deviceName: deviceName,
          switchList: switchList,
        },
      })
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isAddRoom: false,
    isShowEditSwitch: false,
    deviceInfo: {
      roomId: '',
      roomName: '',
      deviceName: '',
      switchList: [] as Device.ISwitch[],
    },
    switchInfo: {
      switchId: '',
      switchName: '',
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    selectRoom(event: WechatMiniprogram.CustomEvent) {
      const roomInfo = roomStore.roomList[event.currentTarget.dataset.index]

      this.setData({
        'deviceInfo.roomId': roomInfo.roomId,
        'deviceInfo.roomName': roomInfo.roomName,
      })

      this.triggerEvent('change', Object.assign({}, this.data.deviceInfo))
    },

    addRoom() {
      if (roomBinding.store.roomList.length >= 50) {
        Toast('一个家庭中最多创建50个房间')
        return
      }

      this.setData({
        isAddRoom: true,
      })
    },

    editSwitchName(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset

      const item = this.data.switchList[index]

      this.setData({
        isShowEditSwitch: true,
        switchInfo: Object.assign({}, item),
      })
    },

    changeSwitchName(event: WechatMiniprogram.CustomEvent) {
      console.log('changeSwitchName', event)

      this.setData({
        'switchInfo.switchName': event.detail.value || '',
      })
    },

    handleClose() {
      this.setData({
        isShowEditSwitch: false,
      })
    },
    async handleConfirm() {
      if (!this.data.switchInfo.switchName) {
        Toast('按键名称不能为空')
        return
      }

      // 校验名字合法性
      if (checkInputNameIllegal(this.data.switchInfo.switchName)) {
        Toast('按键名称不能用特殊符号或表情')
        return
      }

      if (this.data.switchInfo.switchName.length > 5) {
        Toast('按键名称不能超过5个字符')
        return
      }

      const switchItem = this.data.deviceInfo.switchList.find(
        (item) => item.switchId === this.data.switchInfo.switchId,
      ) as Device.ISwitch

      switchItem.switchName = this.data.switchInfo.switchName

      this.setData({
        deviceInfo: this.data.deviceInfo,
      })

      this.triggerEvent('change', Object.assign({}, this.data.deviceInfo))
      this.handleClose()
    },

    changeDeviceName(event: WechatMiniprogram.CustomEvent) {
      console.log('changeDeviceName', event)

      this.setData({
        'deviceInfo.deviceName': event.detail.value || '',
      })

      this.triggerEvent('change', Object.assign({}, this.data.deviceInfo))
    },
    closeAddRoom() {
      this.setData({
        isAddRoom: false,
      })
    },
  },
})
