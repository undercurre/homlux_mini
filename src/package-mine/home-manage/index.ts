import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { roomBinding, homeBinding } from '../../store/index'
import { saveOrUpdateUserHouseInfo, delUserHouse, quitUserHouse } from '../../apis/index'

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
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: async function () {},
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
        Toast('家庭名称不能为空')

        return
      }

      if (houseName.length > 15) {
        Toast('家庭名称不能超过15个字符')

        return
      }

      this.setData({
        isEditName: false,
      })

      const res = await saveOrUpdateUserHouseInfo({ ...this.data.homeInfoEdited, userLocationInfo: '' })

      if (res.success) {
        Toast(this.data.homeInfoEdited.houseId ? '修改成功' : '新增成功')

        homeBinding.store.updateHomeInfo()
      }
    },

    async delHome() {
      const res = await Dialog.confirm({
        message: '是否解散当前家庭',
      }).catch(() => 'cancel')

      console.log('delHome', res)

      if (res === 'cancel') return

      const delRes = await delUserHouse(homeBinding.store.currentHomeDetail.houseId)

      Toast(delRes.success ? '解散成功' : '解散失败')

      homeBinding.store.updateHomeInfo()
    },

    toTransferHome() {
      if (homeBinding.store.currentHomeDetail.userCount <= 1) {
        Toast('没有其他成员可供转让')

        return
      }

      this.setData({
        isTransferHome: true,
      })
    },

    async quitHome() {
      const res = await Dialog.confirm({
        message: '是否退出当前家庭',
      }).catch(() => 'cancel')

      console.log('delHome', res)

      if (res === 'cancel') return

      const delRes = await quitUserHouse(homeBinding.store.currentHomeDetail.houseId)

      Toast(delRes.success ? '退出成功' : '退出失败')

      homeBinding.store.updateHomeInfo()
    },

    clickRoomItem(event: WechatMiniprogram.CustomEvent) {
      const { icon } = event.currentTarget.dataset

      if (icon === 'more') {
        wx.navigateTo({
          url: '/package-mine/room-manage/index',
        })
      }
    },
  },
})
