import { mobxBehavior } from './behavior'
import { behavior as computedBehavior } from 'miniprogram-computed'
import { storage } from '../../utils/storage'

Page({
  behaviors: [mobxBehavior, computedBehavior],
  data: {
    dropdownMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
    allOnBtnTap: false,
    allOffBtnTap: false,
    showAddNewDevice: false,
    showAddNewRoom: false,
  },
  computed: {
    allSum(data: { numA: number; numB: number; global: { numA: number; numB: number } }) {
      return data.numA + data.numB + data.global.numA + data.global.numB
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

  onLoad: function () {
    // 更新tabbar状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0,
      })
    }
    // 如果用户没登陆，或者登录状态过期，需要自动跳转到登录页
    if (!storage.get<string>('token')) {
      console.log('用户未登录')
      wx.redirectTo({
        url: '/pages/login/index',
      })
    }
    // this.toLogin()
  },
  onShow() {
    console.log(this.data)
  },
  showdata() {
    console.log(this.data)
  },
  toLogin() {
    wx.navigateTo({
      url: '/pages/login/index',
    })
  },
  handleTouchStart() {
    console.log('handleTouchStart', this.data.dropdownMenu)
    this.setData({
      'dropdownMenu.isShow': false,
    })
  },
  handleAllOn() {
    this.setData({
      allOnBtnTap: true,
    })
    setTimeout(() => {
      this.setData({
        allOnBtnTap: false,
      })
    }, 800)
  },
  handleAllOff() {
    this.setData({
      allOffBtnTap: true,
    })
    setTimeout(() => {
      this.setData({
        allOffBtnTap: false,
      })
    }, 800)
  },
  handleDropdown() {
    console.log('handleDropdown', this.data.dropdownMenu)
    if (this.data.dropdownMenu.isShow) {
      this.setData({
        'dropdownMenu.isShow': false,
      })
      return
    }
    wx.createSelectorQuery()
      .select('#addIcon')
      .boundingClientRect()
      .exec((res) => {
        this.setData({
          dropdownMenu: {
            x: '30rpx',
            y: res[0].bottom + 10 + 'px',
            isShow: true,
          },
        })
      })
  },
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
  handleAddDevice() {
    this.setData({
      showAddNewDevice: true,
    })
  },
  handleHideAddNewDevice() {
    this.setData({
      showAddNewDevice: false,
    })
  },
  handleHideAddNewRoom() {
    this.setData({
      showAddNewRoom: false,
    })
  },
})
