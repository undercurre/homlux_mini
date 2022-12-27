import { mobxBehavior } from './behavior'
import { behavior as computedBehavior } from 'miniprogram-computed'
import { global } from '../../store/index'
import { storage } from '../../utils/storage'
import svgs from '../../assets/svg/svgs.js'

Page({
  behaviors: [mobxBehavior, computedBehavior],
  data: {
    dropdownMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
  },
  computed: {
    allSum(data: { numA: number; numB: number; global: { numA: number; numB: number } }) {
      return data.numA + data.numB + data.global.numA + data.global.numB
    },
  },

  onLoad: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0,
      })
    }
    this.loadSvgData()
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
    this.setData({
      'dropdownMenu.isShow': false,
    })
  },
  handleDropdown() {
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
        console.log(res)
      })
  },
  loadSvgData() {
    // 进入首页加载svg，可能因为使用import，onLoad这个回调会变成异步执行
    // 页面可能会已经渲染，导致在全局找不到svg数据，所以这里需要一个标志用于控制渲染svg
    if (!getApp().globalData.svgs) {
      getApp().globalData.svgs = svgs
    }
    console.log('svgs', svgs)
    global.setIsLoadSvg()
  },
})
