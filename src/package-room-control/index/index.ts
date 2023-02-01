import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { othersBinding, userBinding, roomBinding } from '../../store/index'

type DeviceInfo = Device.LightInfo | Device.SwitchInfo | Device.CurtainInfo

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [othersBinding, userBinding, roomBinding] })],
  /**
   * 页面的初始数据
   */
  data: {
    deviceList: [
      // TODO： mock数据，联调后删除
      {
        deviceId: '1',
        deviceName: '筒灯1',
        deviceType: 'light',
        isOnline: true,
        brightness: 50,
        colorTemperature: 50,
        power: true,
      },
      {
        deviceId: '2',
        deviceName: '筒灯2',
        deviceType: 'light',
        isOnline: true,
        brightness: 50,
        colorTemperature: 50,
        power: true,
      },
      {
        deviceId: '3',
        deviceName: '三路开关1',
        deviceType: 'switch',
        isOnline: false,
        linkDeviceId: '1',
      },
      {
        deviceId: '4',
        deviceName: '三路开关2',
        deviceType: 'switch',
        isOnline: true,
        linkDeviceId: '2',
      },
      {
        deviceId: '5',
        deviceName: '窗帘',
        deviceType: 'curtain',
        isOnline: true,
        openDeg: 50,
      },
    ] as Array<Device.LightInfo | Device.SwitchInfo | Device.CurtainInfo>,
    selectList: [] as string[],
    selectType: '',
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
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {},

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
    handleDeviceCardTap(e: { detail: { deviceId: string; deviceType: string } }) {
      if (this.data.selectList.includes(e.detail.deviceId)) {
        const index = this.data.selectList.findIndex((item) => item === e.detail.deviceId)
        this.data.selectList.splice(index, 1)
        this.setData({
          selectList: this.data.selectList,
        })
      } else if (this.data.selectType && this.data.selectType === e.detail.deviceType) {
        this.setData({
          selectList: [...this.data.selectList, e.detail.deviceId],
        })
      } else {
        this.setData({
          selectList: [e.detail.deviceId],
          selectType: e.detail.deviceType,
        })
      }
    },
    handleDevicePowerTap(e: { detail: { deviceId: string; deviceType: string } }) {
      const index = this.data.selectList.findIndex((item) => item === e.detail.deviceId)
      if (['light', 'switch'].includes(e.detail.deviceType)) {
        const power = !(this.data.deviceList[index] as Device.LightInfo | Device.SwitchInfo).power
        const data = {} as IAnyObject
        data[`deviceList[${index}].power`] = power
        this.setData(data)
      }
    },
  },
})
