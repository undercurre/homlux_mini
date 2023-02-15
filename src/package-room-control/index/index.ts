import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { userBinding, roomBinding, deviceBinding, deviceStore } from '../../store/index'
import { runInAction } from 'mobx-miniprogram'
import pageBehavior from '../../behaviors/pageBehaviors'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [userBinding, roomBinding, deviceBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    controlPopupUp: true,
    showAddScenePopup: false,
    contentHeight: 0,
  },

  computed: {
    title(data) {
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return (data.roomList as { roomName: string }[])[data.currentRoomIndex as number].roomName
      }
      return ''
    },
    sceneListInBar(data) {
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return (data.roomList as { sceneList: object[] }[])[data.currentRoomIndex as number].sceneList.slice(0, 4)
      }
      return []
    },
    /**
     * 灯具设备列表
     */
    lightList(data) {
      if (data.deviceList) {
        return data.deviceList.filter((device: { deviceType: string }) => device.deviceType === 'light')
      }
      return []
    },
    /**
     * 灯具设备列表
     */
    switchList(data) {
      if (data.deviceList) {
        return data.deviceList.filter((device: { deviceType: string }) => device.deviceType === 'switch')
      }
      return []
    },
    /**
     * 窗帘列表
     */
    curtainList(data) {
      if (data.deviceList) {
        return data.deviceList.filter((device: { deviceType: string }) => device.deviceType === 'curtain')
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

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
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
      deviceStore.updateDeviceList()
    },

    onUnload() {
      // 退出页面前清理一下选中的列表
      runInAction(() => {
        deviceStore.selectList = []
        deviceStore.selectType = []
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
        const power = !(this.data.deviceList[index] as {power: boolean}).power
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
