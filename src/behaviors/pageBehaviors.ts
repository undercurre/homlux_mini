import { BehaviorWithComputed } from 'miniprogram-computed'
import { userRole } from '../config/home'
import { othersStore } from '../store/index'

export default BehaviorWithComputed({
  methods: {
    /**
     * 返回方法
     */
    goBack: function () {
      const pages = getCurrentPages()

      if (pages.length <= 1) {
        wx.switchTab({
          url: '/pages/index/index',
        })
      } else {
        wx.navigateBack()
      }
    },
    /**
     * 返回首页
     */
    goBackHome: function () {
      const { defaultPage } = othersStore
      wx.switchTab({
        url: `/pages/${defaultPage}/index`,
      })
    },
    /**
     * 跳转到
     */
    goTo(e: WechatMiniprogram.TouchEvent) {
      wx.navigateTo({ url: e.currentTarget.dataset.url })
    },
    /**
     * 全局分享小程序
     */
    onShareAppMessage() {
      return {
        title: '欢迎使用美的照明Homlux',
        path: '/pages/index/index',
        imageUrl: 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/welcome.png',
      }
    },
    // onShareTimeline() {
    //   return {
    //     title: '欢迎使用美的照明Homlux',
    //     path: '/pages/index/index',
    //   }
    // },
  },
  computed: {
    isCreator(data) {
      if (data.currentHomeDetail) {
        return data.currentHomeDetail.houseUserAuth === userRole.creator
      }
      return false
    },
    isAdmin(data) {
      if (data.currentHomeDetail) {
        return data.currentHomeDetail.houseUserAuth === userRole.admin
      }
      return false
    },
    isVisitor(data) {
      if (data.currentHomeDetail) {
        return data.currentHomeDetail.houseUserAuth === userRole.visitor
      }
      return true
    },
  },
})
