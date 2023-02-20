import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, deviceBinding } from '../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../behaviors/pageBehaviors'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    roomSelect: '',
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
          { roomId: '0', roomName: '全屋' }, // 全屋查询未完成
          ...(data.roomList as Room.RoomInfo[]).map((room) => ({
            roomId: room.roomId,
            roomName: room.roomName,
          })),
        ]
      }
      return []
    },
    currentRoomName(data) {
      if (data.roomSelectMenuList) {
        return (data.roomSelectMenuList as { roomId: string; roomName: string }[]).find(
          (room) => room.roomId === data.roomSelect,
        )?.roomName
      }
      return ''
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
      if (roomBinding.store.roomList.length > 0) {
        this.setData({
          roomSelect: roomBinding.store.roomList[0].roomId,
        })
        deviceBinding.store.updateDeviceList(undefined, this.data.roomSelect)
      }
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
      if (e.detail === '0') {
        // 查全屋
        deviceBinding.store.updateAllRoomDeviceList()
      } else {
        // 查房间
        deviceBinding.store.updateDeviceList(undefined, this.data.roomSelect)
      }
    },

    handleCardClick(e: { currentTarget: { dataset: { index: number } } }) {
      const device = this.data.deviceList[e.currentTarget.dataset.index]
      console.log(device)
      wx.navigateTo({
        url: `/package-mine/device-manage/device-detail/index?deviceId=${device.deviceId}&roomId=${this.data.roomSelect}`,
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
