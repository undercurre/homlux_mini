import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
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

  computed: {},

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    handleActionEdit(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('actionEdit', e.currentTarget.dataset.index)
    },
    handleActionDelete(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('actionDelete', e.currentTarget.dataset.dragid)
    },
  },
})
