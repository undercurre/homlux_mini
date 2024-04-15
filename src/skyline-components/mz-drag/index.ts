Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 可拖动元素列表
    movableList: {
      type: Array,
      observer(val) {
        this.setData({
          list: [...val],
          moveareaHeight: this.data.itemHeight * Math.ceil(val.length / 4), // TODO
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
    list: [] as [number, number][],
    currentIndex: -1,
    moveareaHeight: 0,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 根据坐标计算索引
    getIndex(x: number, y: number) {
      const { movableList, itemHeight, itemWidth } = this.data

      if (movableList?.length === 1) {
        return 1
      }
      const _x = Math.max(x, 0)
      const _y = Math.max(y, 0)

      for (const key in movableList) {
        const index = parseInt(key)
        const cur = movableList[index]
        if (_y >= cur[1] && _y < cur[1] + itemHeight && _x >= cur[0] && _x < cur[0] + itemWidth) {
          return index
        }
      }
      return -1
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
      const fixedIndex = this.getIndex(x, y)
      const [_x, _y] = fixedIndex === -1 ? [0, 0] : this.data.movableList[fixedIndex]
      this.setData({
        [`list[${index}]`]: [_x, _y],
      })
      console.log('[dragEnd]index:', index, e.detail, fixedIndex, _x, _y)
    },
  },
})
