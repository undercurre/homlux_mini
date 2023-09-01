import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../behaviors/pageBehaviors'
import { othersStore } from '../../store/index'
import { storage } from '../../utils/index'

ComponentWithComputed({
  behaviors: [pageBehavior],

  data: {
    checkImg: '/assets/img/base/check.png',
    uncheckImg: '/assets/img/base/uncheck.png',
    shots: {
      img0: '/assets/img/remoter/shot0.png',
      img1: '/assets/img/remoter/shot1.png',
    },
    defaultPage: '',
    prevPages: 0,
  },

  computed: {
    // 是否需要设置默认页
    needSettingPage() {
      const pages = getCurrentPages()
      return !othersStore.defaultPage || pages.length >= 2
    },
  },

  methods: {
    onLoad() {
      const pages = getCurrentPages()
      const { defaultPage } = othersStore

      this.setData({
        prevPages: pages.length,
        defaultPage,
      })

      // 若已设置过默认页，并且不是从设置页跳转过来，则直接跳转到目标页面
      if (!this.data.needSettingPage) {
        wx.switchTab({
          url: `/pages/${defaultPage}/index`,
        })
      }
    },
    handlePageTap(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        defaultPage: e.currentTarget.dataset.page,
      })
    },
    handleDefaultPage() {
      const { defaultPage } = this.data
      storage.set('defaultPage', defaultPage)
      othersStore.setDefaultPage(defaultPage)
      wx.switchTab({
        url: `/pages/${defaultPage}/index`,
      })
    },
  },
})
