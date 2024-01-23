import pageBehavior from '../../../behaviors/pageBehaviors'
import { deviceBinding, deviceStore, roomBinding, roomStore } from '../../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { getModelName, PRO_TYPE } from '../../../config/index'
import { sendDevice } from '../../../apis/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] }), pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    selectDevice: [] as string[],
    selectRoomId: '',
    logList: [] as string[],
  },

  computed: {
    showRoomList(data: IAnyObject) {
      const list = data.roomList || ([] as Room.RoomInfo[])

      return list.map((item: IAnyObject) => ({
        text: `${item.roomName}(${item.deviceNum})`,
        value: item.roomId,
      }))
    },
    showDeviceList(data: IAnyObject) {
      const list = data.deviceList || ([] as Device.DeviceItem[])

      return list.filter((item: Device.DeviceItem) => 1 || item.canLanCtrl)
    },
  },

  lifetimes: {
    ready() {
      // this.readLogNative()
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    onChangeDevice(event: WechatMiniprogram.CustomEvent) {
      this.setData({
        selectDevice: event.detail as string[],
      })
    },
    changeRoom(value: { detail: string }) {
      const index = roomStore.roomList.findIndex((item) => item.roomId === value.detail)

      runInAction(() => {
        roomStore.currentRoomIndex = index
      })
    },
    async togglePower(event: WechatMiniprogram.BaseEvent) {
      const power = parseInt(event.currentTarget.dataset.power)

      for (const deviceId of this.data.selectDevice) {
        console.log('deviceId', deviceId)
        const device = deviceStore.deviceList.find((item) => item.deviceId === deviceId) as Device.DeviceItem

        if (device.proType === PRO_TYPE.light) {
          console.log('device', device)
          const modelName = device.switchInfoDTOList
            ? device.switchInfoDTOList[0].switchId
            : getModelName(device.proType, device.productId)

          sendDevice({
            proType: device.proType,
            deviceType: device.deviceType,
            deviceId: device.deviceId,
            modelName,
            gatewayId: device.gatewayId,
            property: { power: power, time: 500 }, // time 500为灯光渐变时间，灯专用
          })
        }
      }
    },
  },
})
