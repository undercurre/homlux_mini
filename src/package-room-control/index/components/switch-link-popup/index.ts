import { ComponentWithComputed } from 'miniprogram-computed'
ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(v) {
        console.log(v)
      },
    },
    linkType: {
      type: String,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {
    title(data) {
      console.log(data)
      if (data.linkType === 'light') {
        return '关联智能灯'
      } else if (data.linkType === 'switch') {
        return '关联智能开关'
      } else if (data.linkType === 'scene') {
        return '关联场景'
      }
      return ''
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onClickHide() {
      this.triggerEvent('close')
    },
  },
})
