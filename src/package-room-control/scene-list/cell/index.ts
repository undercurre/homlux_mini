// package-room-control/scene-list/cell/index.ts
Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    tapAnimate: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleExecScene(e: WechatMiniprogram.TouchEvent) {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      this.setData({
        tapAnimate: true,
      })
      setTimeout(() => {
        this.setData({
          tapAnimate: false,
        })
      }, 700)
      this.triggerEvent('exec', e.currentTarget.dataset.item)
    },
    handleToSetting(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('toSetting', e.currentTarget.dataset.item)
    },
  },
})
