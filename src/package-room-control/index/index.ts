import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { userBinding, roomBinding, deviceBinding, device } from '../../store/index'
import { runInAction } from 'mobx-miniprogram'

type DeviceInfo = Device.LightInfo | Device.SwitchInfo | Device.CurtainInfo

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [userBinding, roomBinding, deviceBinding] })],
  /**
   * 页面的初始数据
   */
  data: {
    showPopup: false,
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
     * 所有设备列表
     */
    deviceList(data) {
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return (data.roomList as { deviceList: DeviceInfo[] }[])[data.currentRoomIndex as number].deviceList
      }
      return []
    },
    /**
     * 灯具设备列表
     */
    lightList(data) {
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return (data.roomList as { deviceList: DeviceInfo[] }[])[data.currentRoomIndex as number].deviceList.filter(
          (device) => device.deviceType === 'light',
        )
      }
      return []
    },
    /**
     * 灯具设备列表
     */
    switchList(data) {
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return (data.roomList as { deviceList: DeviceInfo[] }[])[data.currentRoomIndex as number].deviceList.filter(
          (device) => device.deviceType === 'switch',
        )
      }
      return []
    },
    /**
     * 窗帘列表
     */
    curtainList(data) {
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return (data.roomList as { deviceList: DeviceInfo[] }[])[data.currentRoomIndex as number].deviceList.filter(
          (device) => device.deviceType === 'curtain',
        )
      }
      return []
    },
    deviceIdTypeMap(data): Record<string, string> {
      return Object.fromEntries(data.deviceList.map((device: DeviceInfo) => [device.deviceId, device.deviceType]))
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {},

    onUnload() {
      // 退出页面前清理一下选中的列表
      runInAction(() => {
        device.selectList = []
        device.selectType = []
      })
    },

    handleSceneTap() {
      wx.navigateTo({
        url: '/package-room-control/scene-list/index',
      })
    },
    back() {
      wx.navigateBack()
    },
    handleCollect() {
      console.log('收藏')
    },
    handleDeviceCardTap(e: { detail: { deviceId: string } }) {
      if (device.selectList.includes(e.detail.deviceId)) {
        const index = device.selectList.findIndex((item: string) => item === e.detail.deviceId)
        device.selectList.splice(index, 1)
        runInAction(() => {
          device.selectList = [...device.selectList]
        })
      } else {
        runInAction(() => {
          device.selectList = [...device.selectList, e.detail.deviceId]
        })
      }
      this.updateSelectType()
    },
    handleDevicePowerTap(e: { detail: { deviceId: string; deviceType: string } }) {
      const index = device.selectList.findIndex((item: string) => item === e.detail.deviceId)
      if (['light', 'switch'].includes(e.detail.deviceType)) {
        const power = !(this.data.deviceList[index] as Device.LightInfo | Device.SwitchInfo).power
        const data = {} as IAnyObject
        data[`deviceList[${index}].power`] = power
        this.setData(data)
      }
    },
    updateSelectType() {
      const typeList = new Set()
      device.selectList.forEach((deviceId: string) => {
        typeList.add(this.data.deviceIdTypeMap[deviceId])
      })
      runInAction(() => {
        device.selectType = Array.from(typeList) as string[]
      })
    },
  },
})
