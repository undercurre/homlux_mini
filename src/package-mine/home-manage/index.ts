import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { roomBinding, homeBinding } from '../../store/index'
import { saveOrUpdateUserHouseInfo, delUserHouse, quitUserHouse, updateDefaultHouse } from '../../apis/index'
import { strUtil } from '../../utils/index'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, homeBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    selectHomeMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
    // 正在编辑的家庭信息
    homeInfoEdited: {
      houseId: '',
      houseName: '',
    },
    isFocus: false,
    isEditName: false,
    isShowSetting: false,
    isTransferHome: false,
  },

  computed: {
    settingActions() {
      const actions = [
        {
          name: '重命名',
        },
        {
          name: '解散家庭',
        },
      ]

      return actions
    },

    showRoomList(data) {
      let list = (data.roomList || []) as Room.RoomInfo[]

      list = list.slice(0, 8)

      if (list.length === 8) {
        list[7] = {
          deviceLightOnNum: 0,
          roomIcon: 'more',
          roomId: '',
          roomName: '全部',
          sceneList: [],
        }
      }

      return list
    },
  },

  lifetimes: {
    ready: async function () {
      homeBinding.store.updateHomeMemberList()
    },
    moved: function () {},
    detached: function () {},
  },

  methods: {
    /**
     * 用户点击展示/隐藏家庭选择
     */
    async handleShowHomeSelectMenu() {
      const query = wx.createSelectorQuery()
      query.select('#homeName').boundingClientRect((res) => {
        this.doHomeSelectArrowAnimation(!this.data.selectHomeMenu.isShow, this.data.selectHomeMenu.isShow)
        this.setData({
          selectHomeMenu: {
            x: `${res.left + 10}px`,
            y: `${res.bottom + 10}px`,
            isShow: !this.data.selectHomeMenu.isShow,
          },
          'dropdownMenu.isShow': false,
        })
      })
      query.exec()
    },

    doHomeSelectArrowAnimation(newValue: boolean, oldValue: boolean) {
      if (newValue === oldValue) {
        return
      }
      if (newValue) {
        this.animate(
          '#homeSelectArrow',
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
          '#homeSelectArrow',
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

    hideMenu() {
      this.setData({
        'selectHomeMenu.isShow': false,
      })
    },

    toSetting() {
      this.setData({
        isShowSetting: true,
      })
    },

    onCloseSetting() {
      this.setData({
        isShowSetting: false,
      })
    },
    onSelectSetting(e: WechatMiniprogram.CustomEvent) {
      console.log('onSelectSetting', e.detail)
      const name = e.detail.name

      if (name === '重命名') {
        this.editName()
      }
      if (name === '解散家庭') {
        this.delHome()
      }
    },

    /**
     * 创建家庭
     */
    createHome() {
      this.setData({
        isEditName: true,
        homeInfoEdited: {
          houseId: '',
          houseName: '',
        },
      })
    },

    editName() {
      this.setData({
        isEditName: true,
        homeInfoEdited: {
          houseId: homeBinding.store.currentHomeDetail.houseId,
          houseName: homeBinding.store.currentHomeDetail.houseName,
        },
      })

      setTimeout(() => {
        this.setData({
          isFocus: true,
        })
      }, 500)
    },
    onCloseEditName() {
      this.setData({
        isEditName: false,
      })
    },

    changeHouseName(e: WechatMiniprogram.CustomEvent) {
      console.log('changeHouseName', e)
      this.setData({
        'homeInfoEdited.houseName': e.detail,
      })
    },
    /**
     * 确认家庭信息
     */
    async confirmHomeInfo() {
      const { houseName } = this.data.homeInfoEdited

      if (!houseName) {
        wx.showToast({ title: '家庭名称不能为空', icon: 'none' })

        return
      }

      if (houseName.length > 15) {
        wx.showToast({ title: '家庭名称不能超过15个字符', icon: 'none' })

        return
      }

      this.setData({
        isEditName: false,
      })

      const res = await saveOrUpdateUserHouseInfo({ ...this.data.homeInfoEdited, userLocationInfo: '无' })

      if (!res.success) {
        wx.showToast({
          title: this.data.homeInfoEdited.houseId ? '修改失败' : '新增失败',
          icon: 'none',
        })
        return
      }

      if (res.success) {
        wx.showToast({
          title: this.data.homeInfoEdited.houseId ? '修改成功' : '新增成功',
          icon: 'none',
        })
      }

      if (!this.data.homeInfoEdited.houseId) {
        await updateDefaultHouse(res.result.houseId)
      }

      homeBinding.store.updateHomeInfo()
    },

    async delHome() {
      const list = homeBinding.store.homeList.filter((item) => item.houseCreatorFlag)

      if (list.length <= 1) {
        wx.showToast({ title: '请至少保留一个创建的家庭', icon: 'none' })

        return
      }

      const res = await Dialog.confirm({
        message: '是否解散当前家庭',
      }).catch(() => 'cancel')

      console.log('delHome', res)

      if (res === 'cancel') return

      const delRes = await delUserHouse(homeBinding.store.currentHomeDetail.houseId)

      wx.showToast({ title: delRes.success ? '解散成功' : '解散失败', icon: 'none' })

      homeBinding.store.updateHomeInfo()
    },

    toTransferHome() {
      const list = homeBinding.store.homeList.filter((item) => item.houseCreatorFlag)

      if (list.length <= 1) {
        wx.showToast({ title: '请至少保留一个创建的家庭', icon: 'none' })

        return
      }

      if (homeBinding.store.currentHomeDetail.userCount <= 1) {
        wx.showToast({ title: '没有其他成员可供转让', icon: 'none' })

        return
      }

      this.setData({
        isTransferHome: true,
      })
    },

    closeTransferHome() {
      this.setData({
        isTransferHome: false,
      })
    },

    async quitHome() {
      const res = await Dialog.confirm({
        message: '是否退出当前家庭',
      }).catch(() => 'cancel')

      console.log('delHome', res)

      if (res === 'cancel') return

      const delRes = await quitUserHouse(homeBinding.store.currentHomeDetail.houseId)

      wx.showToast({ title: delRes.success ? '退出成功' : '退出失败', icon: 'none' })

      homeBinding.store.updateHomeInfo()
    },

    clickRoomItem(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset

      const item = this.data.showRoomList[index]

      if (item.roomIcon === 'more') {
        wx.navigateTo({
          url: '/package-mine/room-manage/index',
        })
      } else {
        wx.navigateTo({
          url: strUtil.getUrlWithParams('/package-mine/room-detail/index', {
            roomId: item.roomId,
            roomName: item.roomName,
            roomIcon: item.roomIcon,
          }),
        })
      }
    },
  },
})
