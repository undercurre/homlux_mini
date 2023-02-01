import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding } from '../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'

type DeviceList = { deviceId: string; deviceName: string; roomName: string; roomId: string }[]

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding] })],
  /**
   * 页面的初始数据
   */
  data: {
    roomSelect: '0', // 默认选择全屋
    listHeight: 0,
    roomSelectMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
  },

  computed: {
    roomSelectMenuList(data) {
      if (data.roomList) {
        return [
          { roomId: '0', roomName: '全屋' },
          ...(data.roomList as Home.RoomInState[]).map((room) => ({ roomId: room.roomId, roomName: room.roomName })),
        ]
      }
      return []
    },
    deviceList(data): DeviceList {
      const roomList = data.roomList as Home.RoomInState[]
      if (roomList) {
        const list: DeviceList = []
        if (data.roomSelect === '0') {
          roomList.forEach((room) => {
            room.deviceList.forEach((device) =>
              list.push({
                deviceId: device.deviceId,
                deviceName: device.deviceName,
                roomName: room.roomName,
                roomId: room.roomId,
              }),
            )
          })
          return list
        }
        const room = roomList.find((room) => room.roomId === data.roomSelect)
        room?.deviceList.forEach((device) =>
          list.push({
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            roomName: room.roomName,
            roomId: room.roomId,
          }),
        )
        return list
      }
      return []
    },
    currentRoomName(data) {
      return (data.roomSelectMenuList as { roomId: string; roomName: string }[]).find(
        (room) => room.roomId === data.roomSelect,
      )?.roomName
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      wx.createSelectorQuery()
        .select('#listWrapper')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              listHeight: res[0].height,
            })
          }
        })
      wx.createSelectorQuery()
        .select('#selectRoomBtn')
        .boundingClientRect()
        .exec((res) => {
          if (res[0]) {
            this.setData({
              roomSelectMenu: {
                x: '20rpx',
                y: res[0].bottom + 20 + 'px',
                isShow: false,
              },
            })
          }
        })
    },

    back() {
      wx.navigateBack()
    },

    handleFullPageTap(e?: { detail: { x: number; y: number } }) {
      if (e && e.detail && e.detail.x) {
        wx.createSelectorQuery()
          .select('#selectRoomBtn')
          .boundingClientRect()
          .exec((res) => {
            // 点中加按钮以外的地方都要隐藏下拉菜单
            if (
              e.detail.x > res[0].right ||
              e.detail.x < res[0].left ||
              e.detail.y > res[0].bottom ||
              e.detail.y < res[0].top
            ) {
              this.hideSelectRoomMenu()
            }
          })
      }
    },

    handleRoomSelect(e: { detail: string }) {
      this.setData({
        roomSelect: e.detail,
      })
      this.hideSelectRoomMenu()
    },

    handleCardClick(e: { currentTarget: { dataset: { index: number } } }) {
      const device = this.data.deviceList[e.currentTarget.dataset.index]
      console.log(device)
      wx.navigateTo({
        url: `/package-mine/device-manage/device-detail/index?deviceId=${device.deviceId}&roomId=${device.roomId}`,
      })
    },

    showSelectRoomMenu() {
      if (this.data.roomSelectMenu.isShow) {
        return this.hideSelectRoomMenu()
      }
      this.doSelectRoomArrowAnimation(true, this.data.roomSelectMenu.isShow)
      this.setData({
        'roomSelectMenu.isShow': true,
      })
    },

    hideSelectRoomMenu() {
      this.doSelectRoomArrowAnimation(false, this.data.roomSelectMenu.isShow)
      this.setData({
        'roomSelectMenu.isShow': false,
      })
    },

    doSelectRoomArrowAnimation(newValue: boolean, oldValue: boolean) {
      if (newValue === oldValue) {
        return
      }
      if (newValue) {
        this.animate(
          '#selectRoomArrow',
          [
            {
              rotateZ: 0,
            },
            {
              rotateZ: 180,
            },
          ],
          200,
        )
      } else {
        this.animate(
          '#selectRoomArrow',
          [
            {
              rotateZ: 180,
            },
            {
              rotateZ: 0,
            },
          ],
          200,
        )
      }
    },
  },
})
