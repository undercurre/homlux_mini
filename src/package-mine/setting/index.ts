import pageBehavior from '../../behaviors/pageBehaviors'
import storage from '../../utils/storage'

Component({
  behaviors: [pageBehavior],
  /**
   * 组件的初始数据
   */
  data: {
    list: [
      {
        icon: 'upgrade.png',
        title: '固件升级',
        url: '/package-mine/ota/index',
        auth: true,
      },
      {
        icon: 'homepage.png',
        title: '默认主页',
        url: '/pages/start/index',
        auth: false,
      },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleTap(e: WechatMiniprogram.TouchEvent) {
      const { url, auth } = e.currentTarget.dataset.value
      if (auth && !storage.get<string>('token')) {
        wx.navigateTo({
          url: '/pages/login/index',
        })
        return
      }
      wx.navigateTo({
        url,
      })
    },
  },
})
