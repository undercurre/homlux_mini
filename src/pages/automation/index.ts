import { storage } from '../../utils/storage'
// import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { autosceneBinding, homeStore, userBinding } from '../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { strUtil } from '../../utils/strUtil'
import { reaction } from 'mobx-miniprogram'
import { emitter } from '../../utils/index'

// pages/login/index.ts
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [autosceneBinding, userBinding] }), pageBehaviors],
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
    onLoad() {
      // 更新tabbar状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1,
        })
      }
      // 监听houseId变化，重新请求对应家庭的自动化列表
      reaction(
        () => homeStore.currentHomeDetail.houseId,
        () => {
          autosceneBinding.store.updateAllRoomAutoSceneList()
        },
      )
      emitter.on('wsReceive', (res) => {
        const { eventType } = res.result
        if (eventType === 'scene_add' || eventType === 'scene_del' || eventType === 'scene_upt') {
          autosceneBinding.store.updateAllRoomAutoSceneList()
        }
      })
      //加载自动化列表
      if (this.data.isLogin) {
        autosceneBinding.store.updateAllRoomAutoSceneList()
      }
    },
    onUnload() {
      emitter.off('wsReceive')
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
