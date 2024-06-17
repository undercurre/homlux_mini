import { delay, Logger, throttle } from '../../utils/index'

Component({
  options: {
    pureDataPattern: /^_/,
  },
  /**
   * 组件的属性列表
   */
  properties: {
    /**
     * 样式相关配置
     * @param draggable 是否可拖动
     * @param 其余配置传入抽象节点
     */
    config: {
      type: Object,
    },
    cols: {
      type: Number,
      value: 1,
    },
    // 可拖动元素列表
    movableList: {
      type: Array,
      value: [],
    },
    // 是否处于编辑模式 // ! 目前是否能拖动与编辑模式无内在关联，只是业务逻辑需要
    editMode: Boolean,

    // 单个元素的占位宽度（含边距）
    itemWidth: Number,
    // 单个元素的占位高度（含边距）
    itemHeight: Number,
    // 元素是否有动态尺寸变化
    hasSizeChange: {
      type: Boolean,
      value: false,
    },
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

  observers: {
    'movableList.**,itemHeight'(_, itemHeight) {
      console.log('[drag observer]', this.data.editMode, this.data._inited)

      // 如果未初始化，则直接初始化并忽略后续逻辑
      if (!this.data._inited) {
        this.data._inited = true
        this.data._itemHeight = itemHeight
        this.initList()
        return
      }

      // 如项目高度变化触发，则不进行列表初始化，由用户操作后进行列表初始化
      if (itemHeight !== this.data._itemHeight) {
        this.data._itemHeight = itemHeight
        return
      }

      throttle(() => this.initList(), 50).bind(this)()
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    list: [] as {
      name: string
      uniId: string
      pos: [number, number]
      orderNum: number
      tag: string
      deleted: boolean
    }[],
    currentIndex: -1, // 当前拖动的元素索引，从0开始
    placeholder: -1, // 临时占位（上轮联动结束时）的排序号，从1开始
    moveareaHeight: 0,
    _originOrder: -1, // 被拖动元素，拖动开始前的排序号，从1开始
    _inited: false,
    _itemHeight: 0,
  },

  methods: {
    /** 初始化列表 */
    initList() {
      const { itemWidth, cols, movableList, itemHeight } = this.data
      const list = []

      // 索引号可能与排序号不对应，先排序，避免界面跳动
      // movableList.sort((a, b) => a.orderNum - b.orderNum)
      console.log('[initList movableList]', movableList)

      // 更新已存在的项
      for (const item of movableList) {
        // 过滤已标记删除的内容
        if (!item || item.deleted) continue

        // 补充位置数据
        const i = item.orderNum - 1
        list.push({
          ...item,
          pos: [(i % cols) * itemWidth, Math.floor(i / cols) * itemHeight],
        })
      }

      this.setData({
        list,
        moveareaHeight: itemHeight * Math.ceil(list.length / cols),
      })
      Logger.trace('[initList]', list)
    },
    /**
     * 根据坐标位置计算索引
     * @returns order （从1开始）
     */
    getOrder(x: number, y: number) {
      const { list, itemHeight, itemWidth } = this.data

      // 没有元素
      if (!list?.length) {
        return -1
      }
      // 只有一个元素
      if (list.length === 1) {
        return 1
      }

      // 修正超出区域的情况
      const _x = Math.max(x, 0)
      const _y = Math.max(y, 0)

      for (const key in list) {
        const order = parseInt(key) + 1
        const cur = this.getPos(order)
        if (
          _y >= cur[1] - itemHeight / 2 &&
          _y < cur[1] + itemHeight / 2 &&
          _x >= cur[0] - itemWidth / 2 &&
          _x < cur[0] + itemWidth / 2
        ) {
          return order
        }
      }
      // 遍历所有元素都找不到，返回最大索引
      return -1
    },
    /**
     * 根据排序（从1开始）计算坐标位置
     * @returns [x, y]
     */
    getPos(order: number) {
      const index = order - 1
      const { cols } = this.data
      return [(index % cols) * this.data.itemWidth, Math.floor(index / cols) * this.data.itemHeight]
    },
    // 点击事件处理
    cardTap(e: WechatMiniprogram.CustomEvent) {
      this.triggerEvent('cardTap', e.detail)
    },
    dragBegin(e: { target: { dataset: { index: number } } }) {
      const { index } = e.target.dataset
      const { orderNum } = this.data.list[index]
      this.setData({
        currentIndex: index,
        placeholder: orderNum,
      })
      this.data._originOrder = orderNum
      console.log('⇅ [dragBegin]index:', index)

      this.triggerEvent('dragBegin', this.data.list[index])

      if (this.data.hasSizeChange) this.initList()
    },
    dragMove(e: { target: { dataset: { index: number } }; detail: number[] }) {
      this.dragMoveThrottle(e.target.dataset.index, [e.detail[2], e.detail[3]])
    },
    dragMoveThrottle: throttle(
      function (this: IAnyObject, index: number, [x, y]: [number, number]) {
        this.handleReorder(index, [x, y])
      },
      150, // 节流时间间隔，若太短，会导致运动中的联动卡片过多，出现异常空位
      true,
      false,
    ),
    async dragEnd(e: { target: { dataset: { index: number } } }) {
      const { index } = e.target.dataset
      const newOrder = this.data.placeholder
      this.data.placeholder = -1
      console.log(`⇅ [dragEnd]->${newOrder}`)

      if (newOrder < 0) return

      // 修正被拖元素的位置
      const diffData = {} as IAnyObject
      diffData[`list[${index}].pos`] = this.getPos(newOrder)
      diffData[`list[${index}].orderNum`] = newOrder

      // DESERTED 修正联动元素的位置
      // for (const i in this.data.list) {
      //   const item = this.data.list[i]
      //   const pos = this.getPos(item.orderNum)
      //   // if (pos[0] !== item.pos[0] || pos[1] !== item.pos[1]) {
      //   diffData[`list[${i}].pos`] = pos
      //   // }
      // }
      this.setData(diffData, async () => {
        if (this.data.hasSizeChange) {
          await delay(160) // 确保上次150ms动画完成
          this.initList()
        }
      })

      // 未实际产生移动的，不触发事件
      const isMoved = newOrder !== this.data._originOrder

      this.triggerEvent('dragEnd', { isMoved, list: this.data.list })

      Logger.trace('⇅ [dragEnd]diffData', diffData, 'isMoved', isMoved)
    },
    // 处理排序操作
    handleReorder(index: number, [x, y]: [number, number]) {
      const oldTag = this.data.list[this.data.currentIndex].tag

      // 新排序
      const oldOrder = this.data.placeholder
      const newOrder = this.getOrder(x, y)
      if (newOrder === oldOrder || newOrder === -1) return
      console.log(`⇅ [handleReorder]${oldOrder}->${newOrder}`)

      const isForward = oldOrder < newOrder // 是否向前移动（队列末端为前）
      const diffData = {} as IAnyObject

      // 更新联动卡片
      for (const i in this.data.list) {
        const newTag = this.data.list[i].tag

        // 如果刚好遍历到目标位置的卡片且Tag不一致则直接中断
        if (this.data.list[i].orderNum === newOrder && oldTag !== newTag) {
          return
        }

        // 拖动中的卡片不需要处理；
        if (parseInt(i) === index) continue

        // 未遍历到目标位置的卡片，Tag不一致先跳过
        if (oldTag !== newTag) continue

        const { orderNum } = this.data.list[i]
        if (
          (isForward && orderNum > oldOrder && orderNum <= newOrder) ||
          (!isForward && orderNum >= newOrder && orderNum < oldOrder)
        ) {
          const target = isForward ? orderNum - 1 : orderNum + 1
          diffData[`list[${i}].pos`] = this.getPos(target)
          diffData[`list[${i}].orderNum`] = target
        }
      }

      // !! 若目标位置卡片Tag不一致，程序在上面循环中跳出，以下代码不必执行

      // 暂存目标位置，以便下轮联动或结束拖拽时处理
      diffData.placeholder = newOrder

      this.setData(diffData)

      console.log('⇅ [handleReorder]diffData', diffData)
    },
  },
})
