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
    currentIndex: -1,
    moveareaHeight: CARD_H,
  },

  lifetimes: {
    ready() {
      const list = [] as [number, number][]
      for (let i = 0; i < 11; ++i) {
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
    cardTap(e: { target: { dataset: { index: number } } }) {
      const { index } = e.target.dataset
      const item = this.data.list[index]
      this.setData({
        [`list[${index}]`]: [item[0] + 10, item[1] + 50],
        currentIndex: index,
      })
      console.log('[cardTap]', item)
    },
    dragBegin(e: { target: { dataset: { index: number } } }) {
      const { index } = e.target.dataset
      this.setData({ currentIndex: index })
      console.log('[dragBegin]index:', index)
    },
    dragEnd(e: { target: { dataset: { index: number } }; detail: { x: number; y: number } }) {
      const { index } = e.target.dataset
      const { x, y } = e.detail
      this.setData({
        [`list[${index}]`]: [x, y],
        currentIndex: -1,
      })
      console.log('[dragEnd]index:', index, e.detail)
    },
  },
})
