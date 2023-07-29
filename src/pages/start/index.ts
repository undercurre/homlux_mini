import pageBehavior from '../../behaviors/pageBehaviors'
import { othersStore } from '../../store/index'

// pages/login/index.ts
Component({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {

  },

  methods: {
    onLoad() {
      const { defaultPage } = othersStore
      if (defaultPage) {
        wx.switchTab({
          url: `/pages/${defaultPage}/index`
        })
      }
    },

  },
})
