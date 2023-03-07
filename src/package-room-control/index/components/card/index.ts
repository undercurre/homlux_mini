// package-room-control/index/components/card/index.ts
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
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    handleControlTap(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('controlTap', e.currentTarget.dataset.item)
    },
    handleCardTap(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('cardTap', e.currentTarget.dataset.item)
    },
  },
})
