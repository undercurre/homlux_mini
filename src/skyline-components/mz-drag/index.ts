import { throttle } from '../../utils/index'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    cols: {
      type: Number,
      value: 1,
    },
    // 可拖动元素列表
    movableList: {
      type: Array,
      observer(data) {
        if (!data?.length) {
          return
        }
        const { itemWidth, itemHeight, cols } = this.data
        this.setData({
          list: data.map((item, i) => ({
            ...item,
            pos: [(i % cols) * itemWidth, Math.floor(i / cols) * itemHeight],
            order: i,
          })),
          moveareaHeight: itemHeight * Math.ceil(data.length / cols),
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
    currentIndex: -1, // 当前拖动的元素索引
    placeholder: -1, // 临时占位的排序号
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
      return -1
    },
    /**
     * 根据索引计算坐标位置
     * @returns [x, y]
     */
    getPos(i: number) {
      const { cols } = this.data
      return [(i % cols) * this.data.itemWidth, Math.floor(i / cols) * this.data.itemHeight]
    },
    // 点击事件处理
    dragClick(e: { target: { dataset: { index: number } } }) {
      const { index } = e.target.dataset
      this.setData({ currentIndex: index })

      this.triggerEvent('dragClick', index)
    },
    dragBegin(e: { target: { dataset: { index: number } } }) {
      const { index } = e.target.dataset
      const { order } = this.data.list[index]
      this.setData({
        currentIndex: index,
        placeholder: order,
      })
      console.log('[dragBegin]index:', index)
    },
    dragMove(e: { target: { dataset: { index: number } }; detail: number[] }) {
      this.dragMoveThrottle(e.target.dataset.index, [e.detail[2], e.detail[3]])
    },
    dragMoveThrottle: throttle(
      function (this: IAnyObject, index: number, [x, y]: [number, number]) {
        // console.log('dragMoveThrottle', index, x, y)
        this.handleReorder(index, [x, y])
      },
      150, // 节流时间间隔，若太短，会导致运动中的联动卡片过多，出现异常空位
      true,
      false,
    ),
    dragEnd(e: { target: { dataset: { index: number } } }) {
      const { index } = e.target.dataset
      const newOrder = this.data.placeholder
      console.log(`[dragEnd]->${newOrder}`)

      if (newOrder < 0) return

      // 修正被拖元素的位置
      const diffData = {} as IAnyObject
      diffData[`list[${index}].pos`] = this.getPos(newOrder)
      diffData[`list[${index}].order`] = newOrder

      // 修正联动元素的位置
      // for (const i in this.data.list) {
      //   const item = this.data.list[i]
      //   const pos = this.getPos(item.order)
      //   // if (pos[0] !== item.pos[0] || pos[1] !== item.pos[1]) {
      //   diffData[`list[${i}].pos`] = pos
      //   // }
      // }
      console.log('[dragEnd]diffData', diffData)
      this.setData(diffData)

      this.data.placeholder = -1
    },
    // 处理排序操作
    handleReorder(index: number, [x, y]: [number, number]) {
      // 新排序
      const oldOrder = this.data.placeholder
      const newOrder = this.getIndex(x, y)
      if (newOrder === oldOrder || newOrder === -1) return
      console.log(`[handleReorder]${oldOrder}->${newOrder}`)

      const isForward = oldOrder < newOrder // 是否向前移动（队列末端为前）
      const diffData = {} as IAnyObject

      // 更新联动卡片
      for (const i in this.data.list) {
        // 拖动中的卡片不需要处理
        if (parseInt(i) === index) continue

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

      diffData.placeholder = newOrder

      wx.nextTick(() => this.setData(diffData))
      console.log('[handleReorder]diffData', diffData)
    },
  },
})
