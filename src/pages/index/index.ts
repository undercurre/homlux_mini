import { mobxBehavior } from './behavior'
import { behavior as computedBehavior } from 'miniprogram-computed'
import { storage } from '../../utils/storage'

Page({
  behaviors: [mobxBehavior, computedBehavior],
  data: {
    someData: 'string1',
  },
  computed: {
    allSum(data: { numA: number; numB: number; global: { numA: number; numB: number } }) {
      return data.numA + data.numB + data.global.numA + data.global.numB
    },
  },

  toLog() {
    wx.navigateTo({
      url: '/packages/logs/logs',
    })
  },

  onLoad: function () {
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
})
