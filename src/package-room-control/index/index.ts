import { behavior as computedBehavior } from 'miniprogram-computed'
import { mobxBehavior } from './behavior'

Page({
  behaviors: [mobxBehavior, computedBehavior],
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
    title(data: { currentRoomIndex: number; roomList: { roomName: string }[] }) {
      return data.roomList[data.currentRoomIndex].roomName
    },
    sceneListInBar(data: { currentRoomIndex: number; roomList: { sceneList: object[] }[] }) {
      return data.roomList[data.currentRoomIndex].sceneList.slice(0, 4)
    },
    deviceList(data: { currentRoomIndex: number; roomList: { deviceList: object[] }[] }) {
      return data.roomList[data.currentRoomIndex].deviceList
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {},

  handleSceneTap() {
    wx.navigateTo({
      url: '/package-room/scene/index',
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
})
