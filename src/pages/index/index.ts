import { ComponentWithComputed } from 'miniprogram-computed'
import { room, home, othersBinding, roomBinding, userBinding, homeBinding } from '../../store/index'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [othersBinding, roomBinding, userBinding, homeBinding] })],
  data: {
    dropdownMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
    selectHomeMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
    contentHeight: 0,
    allOnBtnTap: false,
    allOffBtnTap: false,
    showAddNewDevice: false,
    showAddNewRoom: false,
    showHomeSelect: false,
  },
  computed: {
    currentHomeName(data) {
      if (data.currentHomeInfo) {
        return data.currentHomeInfo?.houseName ?? ''
      }
      return ''
    },
    // 家庭是否有设备
    hasDevice() {
      return true
    },
    // 是否显示全局控制开关（需要有灯）
    isShowHomeControl() {
      return true
    },
  },
  watch: {
    hasDevice(value) {
      if (value) {
        this.updateContentHeight()
      } else {
        this.setData({
          contentHeight: 0
        })
      }
    }
  },

  methods: {
    // 生命周期或者其他钩子
    onLoad: function () {
      // 更新tabbar状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 0,
        })
      }
      home.updateHomeList()
      this.updateContentHeight()
    },
    onHide() {
      // 隐藏之前展示的下拉菜单
      this.hideMenu()
    },
    onPullDownRefresh() {
      console.log('下拉刷新')
      setTimeout(() => {
        wx.stopPullDownRefresh()
      }, 500)
    },

    // 收起所有菜单
    hideMenu(e?: { detail: { x: number; y: number } }) {
      this.doHomeSelectArrowAnimation(false, this.data.selectHomeMenu.isShow)
      if (e && e.detail && e.detail.x) {
        wx.createSelectorQuery()
          .select('#addIcon')
          .boundingClientRect()
          .exec((res) => {
            // 点中加按钮以外的地方都要隐藏下拉菜单
            if (
              e.detail.x > res[0].right ||
              e.detail.x < res[0].left ||
              e.detail.y > res[0].bottom ||
              e.detail.y < res[0].top
            ) {
              this.setData({
                'dropdownMenu.isShow': false,
                'selectHomeMenu.isShow': false,
              })
            }
          })
      } else {
        this.setData({
          'dropdownMenu.isShow': false,
          'selectHomeMenu.isShow': false,
        })
      }
    },
    /**
     * 跳转到登录页
     */
    toLogin() {
      wx.navigateTo({
        url: '/pages/login/index',
      })
    },
    /**
     * 点击全屋开按钮
     */
    handleAllOn() {
      this.hideMenu()
      this.setData({
        allOnBtnTap: true,
      })
      setTimeout(() => {
        this.setData({
          allOnBtnTap: false,
        })
      }, 800)
    },
    /**
     * 点击全屋关按钮
     */
    handleAllOff() {
      this.hideMenu()
      this.setData({
        allOffBtnTap: true,
      })
      setTimeout(() => {
        this.setData({
          allOffBtnTap: false,
        })
      }, 800)
    },
    /**
     * 点击加号按钮下拉
     */
    handleDropdown() {
      wx.createSelectorQuery()
        .select('#addIcon')
        .boundingClientRect()
        .exec((res) => {
          this.setData({
            dropdownMenu: {
              x: '20rpx',
              y: res[0].bottom + 10 + 'px',
              isShow: !this.data.dropdownMenu.isShow,
            },
            'selectHomeMenu.isShow': false,
          })
        })
    },
    /**
     * 用户点击下拉菜单项
     * @param e
     */
    handleMenuSelect(e: { detail: 'addDevice' | 'addRoom' | 'inviteFamily' }) {
      if (e.detail === 'addDevice') {
        this.setData({
          showAddNewDevice: true,
        })
      } else if (e.detail === 'addRoom') {
        this.setData({
          showAddNewRoom: true,
        })
      } else if (e.detail === 'inviteFamily') {
        console.log(3)
      }
      this.setData({
        'dropdownMenu.isShow': false,
      })
    },
    /**
     * 用户切换家庭
     */
    handleHomeSelect() {
      this.doHomeSelectArrowAnimation(false, this.data.selectHomeMenu.isShow)
      this.setData({
        'selectHomeMenu.isShow': false,
      })
    },
    /**
     * 用户点击展示/隐藏家庭选择
     */
    handleShowHomeSelectMenu() {
      this.doHomeSelectArrowAnimation(!this.data.selectHomeMenu.isShow, this.data.selectHomeMenu.isShow)
      this.setData({
        selectHomeMenu: {
          x: '28rpx',
          y: wx.getStorageSync('statusBarHeight') + wx.getStorageSync('navigationBarHeight') + 8 + 'px',
          isShow: !this.data.selectHomeMenu.isShow,
        },
        'dropdownMenu.isShow': false,
      })
    },
    /**
     * 用户点击添加设备按钮，弹出popup
     */
    handleAddDevice() {
      this.setData({
        showAddNewDevice: true,
      })
    },
    /**
     * 隐藏添加设备popup
     */
    handleHideAddNewDevice() {
      this.setData({
        showAddNewDevice: false,
      })
    },
    /**
     * 隐藏添加房间popup
     */
    handleHideAddNewRoom() {
      this.setData({
        showAddNewRoom: false,
      })
    },
    /**
     * 用户点击选择场景
     */
    handleSceneSelect(e: { currentTarget: { dataset: { room: string } }; detail: string }) {
      console.log(e)
      // runInAction(() => {
      //   room.roomList = room.roomList.map((item) => {
      //     return {
      //       ...item,
      //       sceneSelect: e.currentTarget.dataset.room === item.roomId ? e.detail : item.sceneSelect,
      //     }
      //   })
      // })
    },
    handleToRoom(e: { currentTarget: { dataset: { room: string } } }) {
      runInAction(() => {
        room.currentRoomIndex = room.roomList.findIndex((item) => item.roomId === e.currentTarget.dataset.room)
      })
      wx.navigateTo({
        url: '/package-room-control/index/index',
      })
    },
    updateContentHeight() {
      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
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
  },
})
