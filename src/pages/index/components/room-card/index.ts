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
    showScene: {
      type: Boolean,
      value: false,
    },
  },

  computed: {
    cardList(data) {
      return data.sceneList.slice(0, 4)
    },
    hasBottomPadding(data) {
      return data.sceneList.length > 0
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    sceneClickId: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleSceneTap(e: { currentTarget: { dataset: { value: string } } }) {
      // this.triggerEvent('sceneSelect', e.currentTarget.dataset.value)
      console.log(e.currentTarget.dataset.value)
      if (this.data.sceneClickId) {
        return
      }
      this.setData({
        sceneClickId: e.currentTarget.dataset.value,
      })
      this.animate(
        `#effect-${e.currentTarget.dataset.value}`,
        [
          {
            opacity: 0,
          },
          {
            opacity: 1,
          },
        ],
        200,
      )
      setTimeout(() => {
        this.animate(
          `#effect-${e.currentTarget.dataset.value}`,
          [
            {
              opacity: 1,
            },
            {
              opacity: 0,
            },
          ],
          200,
          () => {
            this.setData({
              sceneClickId: '',
            })
          },
        )
      }, 2000)
    },
    handleCardTap() {
      this.triggerEvent('cardTap')
    },
  },
})
