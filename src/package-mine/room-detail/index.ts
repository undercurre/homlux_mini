import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { homeBinding, roomBinding } from '../../store/index'
import { getCurrentPageParams } from '../../utils/index'
import { delHouseRoom } from '../../apis/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'shared',
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isEdit: false,
    editType: '',
    roomInfo: {
      roomId: '',
      roomName: '',
      roomIcon: '',
    },
  },

  computed: {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    ready() {
      const pageParams = getCurrentPageParams()

      console.log('pageParams', pageParams)

      this.setData({
        roomInfo: {
          roomId: pageParams.roomId,
          roomName: pageParams.roomName,
          roomIcon: pageParams.roomIcon,
        },
      })
    },
    moved: function () {},
    detached: function () {},
  },

  methods: {
    editRoom(event: WechatMiniprogram.CustomEvent) {
      if (!homeBinding.store.isManager) {
        return
      }
      
      const { type } = event.currentTarget.dataset

      this.setData({
        isEdit: true,
        editType: type,
      })
    },
    onClose() {
      this.setData({
        isEdit: false,
      })
    },

    finishAddRoom(event: WechatMiniprogram.CustomEvent) {
      console.log('finishAddRoom', event)

      this.setData({
        isEdit: false,
        roomInfo: {
          roomId: event.detail.roomId,
          roomName: event.detail.roomName,
          roomIcon: event.detail.roomIcon,
        },
      })
    },

    async delRoom() {
      if (roomBinding.store.roomList.length === 1) {
        wx.showToast({
          title: '请至少保留一个房间',
          icon: 'none',
        })
        return
      }

      const dialogRes = await Dialog.confirm({
        message: '确定删除该房间？',
      }).catch(() => {
        return 'cancel'
      })

      console.log('dialogRes', dialogRes)

      if (dialogRes === 'cancel') {
        return
      }

      const res = await delHouseRoom(this.data.roomInfo.roomId)

      if (res.success) {
        roomBinding.store.updateRoomList()

        wx.navigateBack()
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'error',
        })
      }
    },
  },
})
