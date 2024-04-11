import { CARD_W, CARD_H } from '../../../config/index'

Component({
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    list: [] as [number, number][],
    cardPos: [0, 0],
    currentIndex: 0,
    moveareaHeight: CARD_H,
  },

  lifetimes: {
    ready() {
      const list = [] as [number, number][]
      for (let i = 0; i < 18; ++i) {
        list.push([(i % 4) * CARD_W, Math.floor(i / 4) * CARD_H])
        this.setData({ list })
      }
      this.setData({
        moveareaHeight: CARD_H * Math.ceil(list.length / 4),
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    cardTap() {
      this.setData({
        cardPos: [100, 200],
      })
      console.log('[cardTap]', this.data.cardPos)
    },
    dragBegin(e: { target: { dataset: { index: number } } }) {
      const { index } = e.target.dataset
      this.setData({ currentIndex: index })
      console.log('[dragBegin]', index)
    },
  },
})
