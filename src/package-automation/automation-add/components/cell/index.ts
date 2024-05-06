Component({
  options: {},
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
    handleActionEdit(e: WechatMiniprogram.TouchEvent) {
      console.log('hh')

      this.triggerEvent('itemClick', { type: 'actionEdit', data: e.currentTarget.dataset.index })
    },
    handleActionDelete(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('itemClick', { type: 'actionDelete', data: e.currentTarget.dataset.dragid })
    },
  },
})
