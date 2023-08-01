import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { roomBinding, homeBinding, userBinding, deviceBinding, homeStore } from '../../store/index'
import { saveOrUpdateUserHouseInfo, delUserHouse, quitUserHouse, updateDefaultHouse } from '../../apis/index'
import { strUtil, checkInputNameIllegal, emitter } from '../../utils/index'

ComponentWithComputed({
  options: {},
  behaviors: [
    BehaviorWithStore({ storeBindings: [roomBinding, homeBinding, userBinding, deviceBinding] }),
    pageBehaviors,
  ],

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
    settingActions(data) {
      const actions = []

      if (data.isEnabled) {
        actions.push({
          name: '重命名',
        })
      }

      // 用户家庭权限 1：创建者 2：管理员 3：游客
      if (data.currentHomeDetail?.houseUserAuth === 1) {
        actions.push(
          {
            name: '转让家庭',
          },
          {
            name: '解散家庭',
          },
        )
      } else {
        actions.push({
          name: '退出家庭',
        })
      }

      return actions
    },
    isEnabled(data) {
      const role = data.currentHomeDetail?.houseUserAuth
      return role === 1 || role === 2
    },
    namingPopupTitle(data) {
      return data.homeInfoEdited.houseId ? '重命名家庭' : '新建家庭'
    },
    houseName(data) {
      return data.currentHomeDetail?.houseName?.length > 6
        ? data.currentHomeDetail?.houseName.slice(0, 6) + '...'
        : data.currentHomeDetail?.houseName
    },
  },

  lifetimes: {
    ready: async function () {
      console.log('home manage ==== ready')
      homeStore.updateHomeInfo()
      homeBinding.store.updateHomeMemberList()

      emitter.on('homeInfoEdit', () => {
        homeStore.updateHomeInfo()
        homeBinding.store.updateHomeMemberList()
      })

      emitter.on('invite_user_house', () => {
        homeStore.updateHomeInfo()
      })
    },
    moved: function () {},
    detached: function () {
      emitter.off('homeInfoEdit')
      emitter.off('invite_user_house')
    },
  },

  methods: {
    /**
     * 用户点击展示/隐藏家庭选择
     */
    async handleShowHomeSelectMenu() {
      const query = wx.createSelectorQuery()
      query.select('#homeName').boundingClientRect((res) => {
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
      const name = e.detail.name

      if (name === '重命名') {
        this.editName()
        return
      }

      if (name === '解散家庭') {
        this.delHome()
        return
      }

      if (name === '转让家庭') {
        const list = homeBinding.store.homeList.filter((item) => item.houseCreatorFlag)

        if (list.length <= 1) {
          Toast('请至少保留一个创建的家庭')

          return
        }

        wx.navigateTo({
          url: '/package-mine/home-transfer/index',
        })
        return
      }

      if (name === '退出家庭') {
        this.quitHome()
        return
      }
    },

    /**
     * 创建家庭
     */
    createHome() {
      // const ownerHomeList = homeStore.homeList.filter((home) => home.houseCreatorFlag)
      if (homeStore.homeList.length >= 20) {
        Toast('每个账号最多可以存在20个家庭')
        return
      }
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

      if (checkInputNameIllegal(houseName)) {
        Toast('家庭名称不能用特殊符号或表情')
        return
      }

      if (houseName.length > 15) {
        Toast('家庭名称不能超过15个字符')

        return
      }

      this.setData({
        isEditName: false,
      })

      const res = await saveOrUpdateUserHouseInfo({
        ...this.data.homeInfoEdited,
        userLocationInfo: '',
      })

      if (!res.success) {
        Toast(this.data.homeInfoEdited.houseId ? '修改失败' : '新增失败')
        return
      }

      if (res.success) {
        Toast(this.data.homeInfoEdited.houseId ? '修改成功' : '新增成功')
      }

      if (!this.data.homeInfoEdited.houseId) {
        await updateDefaultHouse(res.result.houseId)
      }

      homeBinding.store.updateHomeInfo()
    },

    async delHome() {
      const allDeviceList = deviceBinding.store.allRoomDeviceList
      if (allDeviceList && allDeviceList.length > 0) {
        Toast('家庭存在设备，不允许解散')
        return
      }

      const homeList = homeBinding.store.homeList.filter((item) => item.houseCreatorFlag)
      if (homeList.length <= 1) {
        Toast('请至少保留一个创建的家庭')
        return
      }

      const res = await Dialog.confirm({
        title: '是否解散当前家庭',
      }).catch(() => 'cancel')

      console.log('delHome', res)

      if (res === 'cancel') return

      const delRes = await delUserHouse(homeBinding.store.currentHomeDetail.houseId)

      Toast(delRes.success ? '解散成功' : '解散失败')

      homeBinding.store.updateHomeInfo()
    },

    toTransferHome() {
      const list = homeBinding.store.homeList.filter((item) => item.houseCreatorFlag)

      if (list.length <= 1) {
        Toast('请至少保留一个创建的家庭')

        return
      }

      if (homeBinding.store.currentHomeDetail.userCount <= 1) {
        Toast('没有其他成员可供转让')

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
        title: '是否退出当前家庭',
      }).catch(() => 'cancel')

      console.log('delHome', res)

      if (res === 'cancel') return

      const delRes = await quitUserHouse(homeBinding.store.currentHomeDetail.houseId)

      Toast(delRes.success ? '退出成功' : '退出失败')

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
