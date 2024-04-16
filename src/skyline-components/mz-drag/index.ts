Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 可拖动元素列表
    // TODO n个元素的计算
    movableList: {
      type: Array,
      observer(data) {
        if (!data?.length) {
          return
        }
        const { itemWidth, itemHeight } = this.data
        this.setData({
          list: data.map((item, i) => ({
            ...item,
            pos: [(i % 4) * itemWidth, Math.floor(i / 4) * itemHeight],
            order: i,
          })),
          moveareaHeight: itemHeight * Math.ceil(data.length / 4),
        })
      },
    },
    // 单个元素的占位宽度（含边距）
    itemWidth: Number,
    // 单个元素的占位高度（含边距）
    itemHeight: Number,
    // 滚动高度
    scrollHeight: {
      type: String,
      value: '80vh',
    },
    // 移动方向，属性值有all vertical horizontal none
    direction: {
      type: String,
      value: 'all',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    list: [] as { name: string; pos: [number, number]; order: number }[],
    currentIndex: -1,
    moveareaHeight: 0,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 根据坐标位置计算索引
     * @returns index
     */
    getIndex(x: number, y: number) {
      const { list, itemHeight, itemWidth } = this.data

      // 没有元素
      if (!list?.length) {
        return -1
      }
      // 只有一个元素
      if (list.length === 1) {
        return 0
      }

      // 修正超出区域的情况
      const _x = Math.max(x, 0)
      const _y = Math.max(y, 0)

      for (const key in list) {
        const index = parseInt(key)
        const cur = this.getPos(index)
        if (
          _y >= cur[1] - itemHeight / 2 &&
          _y < cur[1] + itemHeight / 2 &&
          _x >= cur[0] - itemWidth / 2 &&
          _x < cur[0] + itemWidth / 2
        ) {
          return index
        }
      }
      // 遍历所有元素都找不到，返回最大索引
      return list.length - 1
    },
    /**
     * 根据索引计算坐标位置
     * @param n 每行n个
     * @returns [x, y]
     */
    getPos(i: number, n = 4) {
      return [(i % n) * this.data.itemWidth, Math.floor(i / 4) * this.data.itemHeight]
    },
    cardTap(e: { target: { dataset: { index: number } } }) {
      const { index } = e.target.dataset
      this.setData({ currentIndex: index })

      this.triggerEvent('cardTap', index)
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
        [`list[${index}].pos`]: [x, y],
      })

      // 新排序
      const newOrder = this.getIndex(x, y)

      // console.log('[dragEnd]index:', index, { x, y }, newOrder)

      // 更新联动卡片
      const oldOrder = this.data.list[index].order
      const isForward = oldOrder < newOrder // 是否向前移动（队列末端为前）
      const diffData = {} as IAnyObject

      for (const i in this.data.list) {
        const { order } = this.data.list[i]
        if (
          (isForward && order > oldOrder && order <= newOrder) ||
          (!isForward && order >= newOrder && order < oldOrder)
        ) {
          const target = isForward ? order - 1 : order + 1
          diffData[`list[${i}].pos`] = this.getPos(target)
          diffData[`list[${i}].order`] = target
        }
      }

      // 修正被拖元素的位置
      if (newOrder >= 0) {
        diffData[`list[${index}].pos`] = this.getPos(newOrder)
        diffData[`list[${index}].order`] = newOrder
      }

      this.setData(diffData)
      console.log('[dragEnd]diffData', diffData)
    },
  },
})
