// import { homeStore, othersStore, userStore } from '../../store/index'
import { storage } from '../../utils/storage'
// import Toast from '@vant/weapp/toast/toast'
import pageBehavior from '../../behaviors/pageBehaviors'

// pages/login/index.ts
Component({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    hasAutoScene: true,
    autoSceneList: [
      { name: '早上起床模式', desc: '每天', icon: 'all-on', onoff: true },
      { name: '早上起床模式', desc: '每天', icon: 'all-on', onoff: true },
      { name: '早上起床模式', desc: '每天', icon: 'all-on', onoff: true },
      { name: '早上起床模式', desc: '每天', icon: 'all-on', onoff: true },
      { name: '早上起床模式', desc: '每天', icon: 'all-on', onoff: true },
      { name: '早上起床模式', desc: '每天', icon: 'all-on', onoff: true },
      { name: '早上起床模式', desc: '每天', icon: 'all-on', onoff: true },
      { name: '早上起床模式', desc: '每天', icon: 'all-on', onoff: true },
      { name: '客厅无人关闭模式客...', desc: '每天', icon: 'all-on', onoff: true },
      { name: '早上起床模式', desc: '每天', icon: 'all-on', onoff: true },
      { name: '客厅无人关闭模式', desc: '每天', icon: 'mild', onoff: false },
    ],
    urls: {
      automationLog: '/package-automation/automation-log/index',
      automationAdd: '/package-automation/automation-add/index',
    },
    // 导航栏和状态栏高度
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
  },

  methods: {
    onLoad() {
      // 更新tabbar状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1,
        })
      }
    },
    toPage(e: { currentTarget: { dataset: { url: string } } }) {
      console.log('111', e.currentTarget.dataset.url)
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      })
    },
  },
})
