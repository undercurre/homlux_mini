import { mobxBehavior } from './behavior'
import { behavior as computedBehavior } from 'miniprogram-computed'
import { storage } from '../../utils/storage'
import svgs from '../../assets/svg/svgs.js'

Page({
  behaviors: [mobxBehavior, computedBehavior],
  data: {
    isLoadedSvg: false,
  },
  computed: {
    allSum(data: { numA: number; numB: number; global: { numA: number; numB: number } }) {
      return data.numA + data.numB + data.global.numA + data.global.numB
    },
  },

  onLoad: function () {
    this.loadSvgData()
    // 如果用户没登陆，或者登录状态过期，需要自动跳转到登录页
    if (!storage.get<string>('token')) {
      console.log('用户未登录')
      wx.redirectTo({
        url: '/pages/login/index',
      })
    }
  },
  onShow() {
    console.log(this.data)
  },
  showdata() {
    console.log(this.data)
  },

  loadSvgData() {
    // 进入首页加载svg，可能因为使用import，onLoad这个回调会变成异步执行
    // 页面可能会已经渲染，导致在全局找不到svg数据，所以这里需要一个标志用于控制渲染svg
    if (!getApp().globalData.svgs) {
      getApp().globalData.svgs = svgs
      this.setData({
        isLoadedSvg: true,
      })
    } else {
      this.setData({
        isLoadedSvg: true,
      })
    }
  },
})
