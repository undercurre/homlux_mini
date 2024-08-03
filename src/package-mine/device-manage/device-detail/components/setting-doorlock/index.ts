import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    deviceInfo: {
      type: Object,
    },
    isManager: {
      type: Boolean,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {
    electronicLock(data) {
      const modelName = 'doorLock'
      return data.deviceInfo?.mzgdPropertyDTOList[modelName]?.electronicLock ?? false
    },
    powerSaving() {
      return true
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toPage(e: WechatMiniprogram.TouchEvent<never, never, { url: string }>) {
      console.log('toPage', e.currentTarget.dataset.url)
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      })
    },
  },
})
