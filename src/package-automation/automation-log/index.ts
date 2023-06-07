import pageBehavior from '../../behaviors/pageBehaviors'
// import { homeBinding, homeStore, otaBinding, otaStore } from '../../store/index'
// import Toast from '@vant/weapp/toast/toast'
import { ComponentWithComputed } from 'miniprogram-computed'
// import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
// import { getEnv } from '../../config/index'
ComponentWithComputed({
  behaviors: [pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    autoUpdate: false,
    isLoading: false,
    contentHeight: 0,
    autoSceneLog: {
      '6月23日': [
        { id: 0, name: '早上起床模式', desc: '早上7:00', icon: 'all-on', isSuccess: '已执行' },
        { id: 1, name: '早上起床模式', desc: '早上7:00', icon: 'all-on', isSuccess: '执行失败' },
      ],
      '5月30日': [
        { id: 0, name: '客厅无人关闭模式客...', desc: '上午12:00', icon: 'mild', isSuccess: '已执行' },
        { id: 1, name: '客厅无人关闭模式', desc: '上午12:00', icon: 'mild', isSuccess: '执行失败' },
      ],
      '4月30日': [
        { id: 0, name: '客厅无人关闭模式客...', desc: '上午12:00', icon: 'mild', isSuccess: '已执行' },
        { id: 1, name: '客厅无人关闭模式', desc: '上午12:00', icon: 'mild', isSuccess: '执行失败' },
      ],
    },
    isUpdating: false,
    hasUpdate: false,
    fromDevice: false,
    _pollingTimer: 0,
  },

  computed: {
    // canOTA(data) {
    //   return data.isCreator || data.isAdmin
    // },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onLoad() {
      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },
  },
})
