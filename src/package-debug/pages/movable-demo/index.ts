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
    itemHeight: CARD_H,
    itemWidth: CARD_W,
    list: [] as [number, number][],
  },

  lifetimes: {
    ready() {
      const list = [] as [number, number][]
      for (let i = 0; i < 18; ++i) {
        list.push([(i % 4) * CARD_W, Math.floor(i / 4) * CARD_H])
      }
      this.setData({ list })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    cardTap(e: { detail: number }) {
      const index = e.detail
      console.log('[draglist cardTap]', index)
      const item = this.data.list[index]

      // 定义一个移位操作
      this.setData({
        [`list[${index}]`]: [item[0] + 10, item[1] + 50],
      })
    },
  },
})
