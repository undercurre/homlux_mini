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
    demoList: [] as { name: string }[],
  },

  lifetimes: {
    ready() {
      const demoList = []
      for (let i = 0; i < 18; ++i) {
        demoList.push({ name: `box-${i}` })
      }
      this.setData({ demoList })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    cardTap(e: { detail: number }) {
      const index = e.detail
      console.log('[draglist cardTap]', index)
      // const item = this.data.demoList[index]

      // // 定义一个移位操作
      // this.setData({
      //   [`demoList[${index}]`]: [item[0] + 10, item[1] + 50],
      // })
    },
  },
})
