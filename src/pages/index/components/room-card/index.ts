// pages/index/components/room-card/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    roomName: {
      type: String,
      value: '',
    },
    lightOnNumber: {
      type: Number,
      value: 0,
    },
    sceneList: {
      type: Array,
      value: [],
    },
    sceneSelect: {
      type: String,
      value: '',
    },
    showScene: {
      type: Boolean,
      value: false,
    },
    svgLoaded: {
      type: Boolean,
      value: false,
    },
  },

  computed: {
    cardList(data) {
      return data.sceneList.slice(0, 4)
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
    handleSceneTap(e: { currentTarget: { dataset: { value: string } } }) {
      this.triggerEvent('sceneSelect', e.currentTarget.dataset.value)
    },
    handleCardTap() {
      this.triggerEvent('cardTap')
    },
  },
})
