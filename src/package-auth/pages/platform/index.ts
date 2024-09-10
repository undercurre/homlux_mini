import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'

ComponentWithComputed({
  behaviors: [pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    urls: {},
    authStatusText: '去授权 >',
  },

  computed: {},

  pageLifetimes: {
    async show() {},
  },

  methods: {
    toAuth() {
      wx.navigateTo({
        url: '/package-auth/pages/confirm-mi/index',
      })
    },
  },
})
