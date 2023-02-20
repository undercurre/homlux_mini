import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { userBinding, roomBinding, deviceBinding, deviceStore, sceneBinding, sceneStore } from '../../store/index'
import { runInAction } from 'mobx-miniprogram'
import pageBehavior from '../../behaviors/pageBehaviors'

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
        console.log(data.roomList, data.currentRoomIndex, data.roomList[data.currentRoomIndex])
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
          data.deviceList.map((device: { deviceId: string; deviceType: string }) => [
            device.deviceId,
            device.deviceType,
          ]),
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
        if (['0x13'].includes(device.proType)) {
          // 0x13是灯
          lightList.push(device)
        } else if (['0x21'].includes(device.proType)) {
          // 0x21是开关，需要拆开开关展示
          // const switch
          switchList.push(device)
        }
        // todo: 添加窗帘的
      })
      this.setData({
        lightList,
        switchList,
      })
      console.log(this.data)
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
    },

    onUnload() {
      // 退出页面前清理一下选中的列表
      runInAction(() => {
        deviceStore.selectList = []
        deviceStore.selectType = []
      })
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
    handleDeviceCardTap(e: { detail: { deviceId: string; deviceType: string } }) {
      if (deviceStore.selectList.includes(e.detail.deviceId)) {
        const index = deviceStore.selectList.findIndex((item: string) => item === e.detail.deviceId)
        deviceStore.selectList.splice(index, 1)
        runInAction(() => {
          deviceStore.selectList = [...deviceStore.selectList]
        })
        if (e.detail.deviceType === 'switch') {
          const index = deviceStore.selectSwitchList.findIndex((item: string) => item === e.detail.deviceId)
          deviceStore.selectSwitchList.splice(index, 1)
          runInAction(() => {
            deviceStore.selectSwitchList = [...deviceStore.selectSwitchList]
          })
        }
      } else {
        runInAction(() => {
          deviceStore.selectList = [...deviceStore.selectList, e.detail.deviceId]
        })
        if (e.detail.deviceType === 'switch') {
          runInAction(() => {
            deviceStore.selectSwitchList = [...deviceStore.selectSwitchList, e.detail.deviceId]
          })
        }
      }
      this.updateSelectType()
    },
    handleDevicePowerTap(e: { detail: { deviceId: string; deviceType: string } }) {
      const index = deviceStore.selectList.findIndex((item: string) => item === e.detail.deviceId)
      if (['light', 'switch'].includes(e.detail.deviceType)) {
        const power = !(this.data.deviceList[index] as { power: boolean }).power
        const data = {} as IAnyObject
        data[`deviceList[${index}].power`] = power
        this.setData(data)
      }
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
        typeList.add(this.data.deviceIdTypeMap[deviceId])
      })
      runInAction(() => {
        deviceStore.selectType = Array.from(typeList) as string[]
      })
    },
  },
})
