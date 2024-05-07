import { runOnJS } from '../../../../skyline-components/common/worklet'
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
      'worklet'
      console.log('handleActionEdit', e)
      runOnJS(this.triggerEvent.bind(this))('itemClick', { type: 'actionEdit', data: e.currentTarget.dataset.index })
      // this.triggerEvent('itemClick', { type: 'actionEdit', data: e.currentTarget.dataset.index })
    },
    handleActionDelete(e: WechatMiniprogram.TouchEvent) {
      'worklet'
      console.log('handleActionDelete', e)
      runOnJS(this.triggerEvent.bind(this))('itemClick', { type: 'actionDelete', data: e.currentTarget.dataset.dragid })

      // this.triggerEvent('itemClick', { type: 'actionDelete', data: e.currentTarget.dataset.dragid })
    },
  },
})
