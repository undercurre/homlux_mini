import { ComponentWithComputed } from 'miniprogram-computed'
import { othersBinding, roomBinding, userBinding, homeBinding, deviceBinding, homeStore } from '../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { storage } from '../../utils/index'
import { proType } from '../../config/index'
ComponentWithComputed({
  behaviors: [
    BehaviorWithStore({ storeBindings: [othersBinding, roomBinding, userBinding, homeBinding, deviceBinding] }),
  ],
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
    showAddNewRoom: false,
    showHomeSelect: false,
    isRefresh: false,
  },
  computed: {
    currentHomeName(data) {
      if (data.currentHomeDetail) {
        return data.currentHomeDetail?.houseName ?? ''
      }
      return ''
    },
    // 家庭是否有设备
    hasDevice(data) {
      return data.allRoomDeviceList && data.allRoomDeviceList.length > 0
    },
    // 是否显示全局控制开关（需要有灯或者开关）
    isShowHomeControl(data) {
      let hasLightOrSwitch = false
      if (data.allRoomDeviceList) {
        data.allRoomDeviceList.some((device: Device.DeviceItem) => {
          if (([proType.light, proType.switch] as string[]).includes(device.proType)) {
            hasLightOrSwitch = true
            return true
          }
          return false
        })
      }
      return hasLightOrSwitch
    },
  },
  watch: {
    hasDevice(value) {
      if (value) {
        this.updateContentHeight()
      } else {
        this.setData({
          contentHeight: 0,
        })
      }
    },
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
      this.updateContentHeight()
    },
    onHide() {
      // 隐藏之前展示的下拉菜单
      this.hideMenu()
    },
    async onPullDownRefresh() {
      try {
        await homeStore.updateHomeInfo()
      } finally {
        this.setData({
          isRefresh: false,
        })
      }
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
    handleAddDevice() {
      wx.navigateTo({ url: '/package-distribution/scan/index' })
    },
    /**
     * 用户点击下拉菜单项
     * @param e
     */
    handleMenuSelect(e: { detail: 'addDevice' | 'addRoom' | 'inviteFamily' }) {
      if (e.detail === 'addDevice') {
        this.handleAddDevice()
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
          y:
            (storage.get<number>('statusBarHeight') as number) +
            (storage.get<number>('navigationBarHeight') as number) +
            8 +
            'px',
          isShow: !this.data.selectHomeMenu.isShow,
        },
        'dropdownMenu.isShow': false,
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
    updateContentHeight() {
      setTimeout(() => {
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
      }, 100)
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
