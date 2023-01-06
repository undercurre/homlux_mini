import { mobxBehavior } from './behavior'
import { behavior as computedBehavior } from 'miniprogram-computed'
import { storage } from '../../utils/storage'
import { global, room } from '../../store/index'
import { runInAction } from 'mobx-miniprogram'

Page({
  behaviors: [mobxBehavior, computedBehavior],
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
    pageScroll: 0, // 用于让navigation-bar变色
    allOnBtnTap: false,
    allOffBtnTap: false,
    showAddNewDevice: false,
    showAddNewRoom: false,
    showHomeSelect: false,
    test: 'a' as 'a' | 'b',
  },
  computed: {
    selectHomeList(data: {
      homeList: Home.HomeInfo[]
      currentHomeId: string
      userInfo: User.UserInfo
    }): Home.DropdownItem[] {
      return data.homeList.map((item) => ({
        value: item.home_id,
        name: item.home_name,
        isSelect: data.currentHomeId === item.home_id,
        isCreator: data.userInfo.id === item.master_uid,
      }))
    },
    currentHomeName(data: { homeList: Home.HomeInfo[]; currentHomeId: string }) {
      return data.homeList.find((item) => item.home_id === data.currentHomeId)?.home_name
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

  // 生命周期或者其他钩子
  onLoad: function () {
    // 更新tabbar状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0,
      })
    }
    // 如果用户没登陆，或者登录状态过期，需要自动跳转到登录页
    if (!storage.get<string>('token')) {
      wx.redirectTo({
        url: '/pages/login/index',
      })
    }
    // this.toLogin()
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
  onPageScroll(e: { scrollTop: number }) {
    this.setData({
      pageScroll: e.scrollTop,
    })
  },

  // 方法
  hideMenu(e?: { detail: { x: number; y: number } }) {
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
            x: '30rpx',
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
   * @param e
   */
  handleHomeSelect(e: { detail: string }) {
    this.setData({
      'selectHomeMenu.isShow': false,
    })
    runInAction(() => {
      global.currentHomeId = e.detail
    })
  },
  /**
   * 用户点击展示/隐藏家庭选择
   */
  handleShowHomeSelectMenu() {
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
   * 确认添加房间
   */
  handleAddRoomConfirm(e: { detail: { roomName: string; roomIcon: string } }) {
    console.log(e)
    this.setData({
      showAddNewRoom: false,
    })
  },
  /**
   * 用户点击选择场景
   */
  handleSceneSelect(e: { currentTarget: { dataset: { room: string } }; detail: string }) {
    runInAction(() => {
      room.roomList = room.roomList.map((item) => {
        return {
          ...item,
          sceneSelect: e.currentTarget.dataset.room === item.roomId ? e.detail : item.sceneSelect,
        }
      })
    })
  },
  handleToRoom(e: { currentTarget: { dataset: { room: string } } }) {
    runInAction(() => {
      room.currentRoomIndex = room.roomList.findIndex((item) => item.roomId === e.currentTarget.dataset.room)
    })
    wx.navigateTo({
      url: `/package-room/index/index`,
    })
  },
})
