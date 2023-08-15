import pageBehavior from '../../../behaviors/pageBehaviors'
import { helpList } from '../help-doc'

Component({
  behaviors: [pageBehavior],
  /**
   * 组件的初始数据
   */
  data: {
    list: helpList,
  },

  lifetimes: {
    ready() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    handleTap(e: WechatMiniprogram.TouchEvent) {
      const helpPage = '/package-mine/help/show/index'
      wx.navigateTo({
        url: `${helpPage}?page=${e.currentTarget.dataset.value}`,
      })
    },
  },
})
