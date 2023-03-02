import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, deviceBinding, deviceStore, roomStore } from '../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../behaviors/pageBehaviors'
import { emitter, WSEventType } from '../../utils/eventBus'
import { queryDeviceInfoByDeviceId } from '../../apis/index'
import { runInAction } from 'mobx-miniprogram'

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
      // 防止boundingClientRect获取错误数据
      setTimeout(() => {
        wx.createSelectorQuery()
          .select('#content')
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
      }, 500)
      // 刷新一次房间列表
      roomStore.updateRoomList().then(() => {
        if (roomStore.roomList.length > 0 && !this.data.roomSelect) {
          this.setData({
            roomSelect: roomBinding.store.roomList[0].roomId,
          })
          deviceBinding.store.updateDeviceList(undefined, this.data.roomSelect)
        }
      })
      if (roomBinding.store.roomList.length > 0) {
        this.setData({
          roomSelect: roomBinding.store.roomList[0].roomId,
        })
      }
      // 状态更新推送
      emitter.on('wsReceive', async (e) => {
        // 设备相关的消息推送根据条件判断是否刷新
        if (
          typeof e.result.eventData === 'object' &&
          WSEventType.device_online_status === e.result.eventType &&
          e.result.eventData.roomId &&
          (e.result.eventData.roomId === this.data.roomSelect || this.data.roomSelect === '0')
        ) {
          // 如果是当前房间的设备状态发生变化，更新设备状态
          const index = deviceStore.deviceList.findIndex((device) => device.deviceId === e.result.eventData.deviceId)
          if (index !== -1) {
            const res = await queryDeviceInfoByDeviceId(
              deviceStore.deviceList[index].deviceId,
              deviceStore.deviceList[index].roomId,
            )
            if (res.success) {
              runInAction(() => {
                deviceStore.deviceList[index] = res.result
                deviceStore.deviceList = [...deviceStore.deviceList]
              })
            }
          } else {
            // 可能是新绑的设备，直接更新房间
            deviceBinding.store.updateDeviceList(undefined, this.data.roomSelect)
          }
        } else if (
          typeof e.result.eventData === 'object' &&
          WSEventType.device_del === e.result.eventType &&
          e.result.eventData.roomId &&
          (e.result.eventData.roomId === this.data.roomSelect || this.data.roomSelect === '0')
        ) {
          // 设备被删除，查房间
          if (this.data.roomSelect === '0') {
            deviceBinding.store.updateAllRoomDeviceList()
          } else {
            deviceBinding.store.updateDeviceList(undefined, this.data.roomSelect)
          }
        } else if (typeof e.result.eventData === 'object' && e.result.eventType === WSEventType.room_del) {
          await roomStore.updateRoomList()
          if (this.data.roomSelect === '0') {
            deviceBinding.store.updateAllRoomDeviceList()
          } else if (e.result.eventData.roomId === this.data.roomSelect) {
            // 房间被删了，切到其他房间
            if (roomStore.roomList.length > 0) {
              this.setData({
                roomSelect: roomBinding.store.roomList[0].roomId,
              })
              deviceBinding.store.updateDeviceList(undefined, this.data.roomSelect)
            } else {
              this.setData({
                roomSelect: '',
              })
              runInAction(() => {
                deviceStore.deviceList = []
              })
            }
          }
        }
      })
    },

    // 修改完设备返回该页面也需要更新一次
    onShow() {
      if (this.data.roomSelect === '0') {
        deviceBinding.store.updateAllRoomDeviceList()
        return
      } else if (this.data.roomSelect) {
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
      const device = deviceStore.deviceList[e.currentTarget.dataset.index]
      console.log(device)
      wx.navigateTo({
        url: `/package-mine/device-manage/device-detail/index?deviceId=${device.deviceId}`,
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
