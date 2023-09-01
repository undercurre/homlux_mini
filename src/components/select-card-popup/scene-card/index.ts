import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {},
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
      return `border: 4rpx solid ${data.select ? '#507FFF' : 'rgba(0,0,0,0)'};`
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
