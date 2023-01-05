import { behavior as computedBehavior } from 'miniprogram-computed'
import { mobxBehavior } from './behavior'

// package-room/index/index.ts
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
        isOnline: true,
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
  },

  computed: {
    title(data: { currentRoomIndex: number; roomList: { roomName: string }[] }) {
      return data.roomList[data.currentRoomIndex].roomName
    },
    sceneListInBar(data: { currentRoomIndex: number; roomList: { sceneList: object[] }[] }) {
      return data.roomList[data.currentRoomIndex].sceneList.slice(0, 4)
    },
  },

  back() {
    wx.navigateBack()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    console.log(this.data)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
})
