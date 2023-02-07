import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    select: {
      type: Boolean,
      value: false,
    },
    sceneInfo: {
      type: Object,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {
    style(data) {
      return `border: ${data.select ? '3rpx solid #488FFF' : '3rpx solid rgba(0,0,0,0)'};`
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap() {
      this.triggerEvent('cardTap', this.data.sceneInfo)
    },
  },
})
