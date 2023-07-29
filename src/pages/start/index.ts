import pageBehavior from '../../behaviors/pageBehaviors'
import { othersStore } from '../../store/index'
import { storage } from '../../utils/index'

Component({
  behaviors: [pageBehavior],

  data: {
    checkImg: '/assets/img/base/check.png',
    uncheckImg: '/assets/img/base/uncheck.png',
    defaultPage: '',
    prevPages: 0
  },

  methods: {
    onLoad() {
      const pages = getCurrentPages()
      this.setData({
        prevPages: pages.length
      })
      // 若已设置过默认页，并且不是从设置页跳转过来，则直接跳转到目标页面
      const { defaultPage } = othersStore
      if (defaultPage && pages.length < 2) {
        wx.switchTab({
          url: `/pages/${defaultPage}/index`,
        })
      }

      this.setData({
        defaultPage
      })
    },
    onChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        defaultPage: e.target.dataset.page
      })
    },
    handleDefaultPage() {
      const { defaultPage } = this.data
      storage.set('defaultPage', defaultPage)
      othersStore.setDefaultPage(defaultPage)
      wx.switchTab({
        url: `/pages/${defaultPage}/index`,
      })
    }
  },
})
