import { storage } from '../../utils/storage'
// import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { autosceneBinding } from '../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { strUtil } from '../../utils/strUtil'

// pages/login/index.ts
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [autosceneBinding] }), pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    hasAutoScene: true,
    // autoSceneList: [] as AutoScene.AutoSceneItem[],

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
  computed: {},
  methods: {
    async onLoad() {
      // 更新tabbar状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1,
        })
      }

      //加载自动化列表
      await autosceneBinding.store.updateAllRoomAutoSceneList()
      console.log('get', autosceneBinding.store.allRoomAutoSceneListComputed)
    },
    toPage(e: { currentTarget: { dataset: { url: string } } }) {
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      })
    },

    changeAutoSceneEnabled(e: { currentTarget: { dataset: { isenabled: '0' | '1'; sceneid: string } } }) {
      const { isenabled, sceneid } = e.currentTarget.dataset
      const isEnabled = isenabled === '0' ? '1' : '0'
      autosceneBinding.store.changeAutoSceneEnabled({ sceneId: sceneid, isEnabled })
    },
    toEditAutoScene(e: { currentTarget: { dataset: { autosceneid: string } } }) {
      const { autosceneid } = e.currentTarget.dataset

      wx.navigateTo({
        url: strUtil.getUrlWithParams(this.data.urls.automationAdd, { autosceneid }),
      })
    },
    //阻止事件冒泡
    stopPropagation() {},
  },
})
