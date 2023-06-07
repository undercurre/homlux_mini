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
    sceneIcon: 'general',
    isLoading: false,
    contentHeight: 0,
    showEditIconPopup: false,
    showEditConditionPopup: false, //展示添加条件popup
    showPeriodPopup: false, //展示周期popup
    fromDevice: false,
    formatter(type: string, value: string) {
      if (type === 'hour') {
        return `${value} 时`
      } else if (type === 'minute') {
        return `${value} 分`
      }
      return value
    },
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
    changeAutoSceneName(event: WechatMiniprogram.CustomEvent) {
      console.log('changeAutoSceneName', event)

      // this.setData({
      //   sceneIcon: event.detail || '',
      // })

      // this.triggerEvent('change', Object.assign({}, this.data.deviceInfo))
    },
    handleEditIconShow() {
      this.setData({
        showEditIconPopup: true,
      })
    },
    handleEditIconClose() {
      this.setData({
        showEditIconPopup: false,
      })
    },
    handleEditIconConfirm(e: { detail: string }) {
      console.log(e)
      this.setData({
        showEditIconPopup: false,
        sceneIcon: e.detail,
      })
    },
    handleConditionShow() {
      this.setData({
        showEditConditionPopup: true,
      })
    },
    handleConditionClose() {
      this.setData({
        showEditConditionPopup: false,
      })
    },
    onConditionClicked(e: { detail: number }) {
      console.log(e.detail)
      if (!e.detail) {
        this.setData({
          showPeriodPopup: true,
        })
      }
      this.setData({
        showEditConditionPopup: false,
      })
    },
    handlePeriodClose() {
      this.setData({
        showPeriodPopup: false,
      })
    },
  },
})
