import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import {
  userBinding,
  roomBinding,
  deviceBinding,
  deviceStore,
  sceneBinding,
  sceneStore,
  roomStore,
} from '../../store/index'
import { runInAction } from 'mobx-miniprogram'
import pageBehavior from '../../behaviors/pageBehaviors'
import { controlDevice } from '../../apis/index'
import { proName, proType } from '../../config/device'
import { emitter, WSEventType } from '../../utils/eventBus'

ComponentWithComputed({
  behaviors: [
    BehaviorWithStore({ storeBindings: [userBinding, roomBinding, deviceBinding, sceneBinding] }),
    pageBehavior,
  ],
  /**
   * 页面的初始数据
   */
  data: {
    controlPopupUp: true,
    showAddScenePopup: false,
    contentHeight: 0,
    lightList: [] as Device.DeviceItem[],
    switchList: [] as Device.DeviceItem[],
    curtainList: [] as Device.DeviceItem[],
    lightInfo: {
      Level: 0,
      ColorTemp: 0,
    },

    // 拖动排序
    touchLocation: {
      x: 0,
      y: 0,
    },
    isLongPress: false,
    longPressType: '',
    longPressDevice: {} as Device.DeviceItem,
  },

  computed: {
    title(data) {
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return data.roomList[data.currentRoomIndex]?.roomName
      }
      return ''
    },
    sceneListInBar(data) {
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return data.roomList[data.currentRoomIndex]?.sceneList.slice(0, 4)
      }
      return []
    },
    deviceIdTypeMap(data): Record<string, string> {
      if (data.deviceList) {
        return Object.fromEntries(
          data.deviceList.map((device: Device.DeviceItem) => [device.deviceId, proName[device.proType]]),
        )
      }
      return {}
    },
  },

  watch: {
    deviceList(value: Device.DeviceItem[]) {
      const lightList = [] as Device.DeviceItem[]
      const switchList = [] as Device.DeviceItem[]
      // const curtainList = [] as Device.DeviceItem[]
      value.forEach((device) => {
        if (device.proType === proType.light) {
          lightList.push(device)
        } else if (device.proType === proType.switch) {
          device.switchInfoDTOList.forEach((switchItem) => {
            switchList.push({
              ...device,
              mzgdPropertyDTOList: {
                [switchItem.switchId]: device.mzgdPropertyDTOList[switchItem.switchId],
              },
              switchInfoDTOList: [switchItem],
              isSceneSwitch: false, // todo: 需要根据场景判断
              uniId: `${device.deviceId}:${switchItem.switchId}`,
            })
          })
        }
        // todo: 添加窗帘的
      })
      this.setData({
        lightList,
        switchList,
      })
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      deviceStore.updateSubDeviceList().finally(() => {
        setTimeout(() => {
          wx.createSelectorQuery()
            .select('#content')
            .boundingClientRect()
            .exec((res) => {
              if (res[0] && res[0].height) {
                this.setData({
                  contentHeight: res[0].height,
                })
              }
            })
        }, 100)
      })
      sceneStore.updateSceneList()
      emitter.on('wsReceive', (e) => {
        // 设备相关的消息推送根据条件判断是否刷新
        if (
          typeof e.result.eventData === 'object' &&
          [WSEventType.device_del, WSEventType.device_online_status, WSEventType.device_property].includes(
            e.result.eventType,
          ) &&
          e.result.eventData.roomId &&
          e.result.eventData.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId
        ) {
          deviceStore.updateSubDeviceList()
        } else if (
          typeof e.result.eventData === 'object' &&
          e.result.eventType === 'room_del' &&
          e.result.eventData.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId
        ) {
          // 房间被删除，退出到首页
          wx.showToast({
            title: '该房间已被删除',
          })
          wx.redirectTo({
            url: '/pages/index/index',
          })
        }
      })
    },

    onUnload() {
      // 退出页面前清理一下选中的列表
      runInAction(() => {
        deviceStore.selectList = []
        deviceStore.selectType = []
      })
      // 解除监听
      emitter.off('wsReceive')
    },

    handleTouchMove(e: { changedTouches: { pageX: number; pageY: number }[] }) {
      console.log(e)
      this.setData({
        touchLocation: {
          x: e.changedTouches[0].pageX,
          y: e.changedTouches[0].pageY,
        },
      })
    },
    handleTouchEnd() {
      this.setData({
        isLongPress: false,
      })
    },
    handleDeviceLongPress(e: {
      currentTarget: { type: string; info: Device.DeviceItem }
      changedTouches: { pageX: number; pageY: number }[]
    }) {
      console.log(e)
      this.setData({
        isLongPress: true,
        touchLocation: {
          x: e.changedTouches[0].pageX,
          y: e.changedTouches[0].pageY,
        },
        longPressType: e.currentTarget.type,
        longPressDevice: e.currentTarget.info,
      })
    },
    handleSceneTap() {
      wx.navigateTo({
        url: '/package-room-control/scene-list/index',
      })
    },
    handleCollect() {
      this.setData({
        showAddScenePopup: true,
      })
    },
    handleDeviceCardTap(e: { detail: Device.DeviceItem }) {
      if (e.detail.uniId) {
        // 开关选择逻辑
        if (deviceStore.selectList.includes(e.detail.uniId)) {
          const index = deviceStore.selectList.findIndex((item: string) => item === e.detail.uniId)
          deviceStore.selectList.splice(index, 1)
          runInAction(() => {
            deviceStore.selectList = [...deviceStore.selectList]
          })
        } else {
          runInAction(() => {
            deviceStore.selectList = [...deviceStore.selectList, e.detail.uniId]
          })
        }
      } else {
        // 灯、窗帘选择逻辑
        if (deviceStore.selectList.includes(e.detail.deviceId)) {
          const index = deviceStore.selectList.findIndex((item: string) => item === e.detail.deviceId)
          deviceStore.selectList.splice(index, 1)
          runInAction(() => {
            deviceStore.selectList = [...deviceStore.selectList]
          })
        } else {
          runInAction(() => {
            deviceStore.selectList = [...deviceStore.selectList, e.detail.deviceId]
            if (e.detail.proType === proType.light) {
              deviceStore.lightInfo = {
                Level: e.detail.mzgdPropertyDTOList['1'].Level,
                ColorTemp: e.detail.mzgdPropertyDTOList['1'].ColorTemp,
              }
            }
          })
        }
      }
      this.updateSelectType()
    },
    async handleDevicePowerTap(e: { detail: Device.DeviceItem }) {
      console.log(e)
    },
    async handleLightPowerToggle(e: { detail: Device.DeviceItem }) {
      await controlDevice(
        {
          topic: '/subdevice/control',
          deviceId: e.detail.gatewayId,
          method: 'lightControl',
          inputData: [
            {
              devId: e.detail.deviceId,
              ep: 1,
              OnOff: e.detail.mzgdPropertyDTOList['1'].OnOff === 1 ? 0 : 1,
            },
          ],
        },
        { loading: true },
      )
    },
    async handleSwitchPowerToggle(e: { detail: Device.DeviceItem }) {
      const ep = e.detail.switchInfoDTOList[0].switchId
      await controlDevice(
        {
          topic: '/subdevice/control',
          deviceId: e.detail.gatewayId,
          method: 'lightControl',
          inputData: [
            {
              devId: e.detail.deviceId,
              ep,
              OnOff: e.detail.mzgdPropertyDTOList[ep].OnOff === 1 ? 0 : 1,
            },
          ],
        },
        { loading: true },
      )
    },
    handlePopMove() {
      this.setData({
        controlPopupUp: !this.data.controlPopupUp,
      })
    },
    handleAddScenePopupClose() {
      this.setData({
        showAddScenePopup: !this.data.showAddScenePopup,
      })
    },
    updateSelectType() {
      const typeList = new Set()
      deviceStore.selectList.forEach((deviceId: string) => {
        if (deviceId.includes(':')) {
          typeList.add('switch')
          return
        }
        typeList.add(this.data.deviceIdTypeMap[deviceId])
      })
      runInAction(() => {
        deviceStore.selectType = Array.from(typeList) as string[]
      })
    },
  },
})
