import { delay, Logger, throttle } from '../../utils/index'

type CardItem = {
  name: string
  id: string
  pos: [number, number]
  orderNum: number
  tag: string
  deleted: boolean
  added: boolean
  slimSize: boolean
  select?: boolean
}

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
      value: [] as CardItem[],
    },
    // 列表数据更新的时间戳
    listTimestamp: Number,

    // 是否处于编辑模式
    editMode: Boolean,

    // 单个元素的占位宽度（含边距）
    itemWidth: Number,
    // 单个元素的占位高度（含边距）
    itemHeight: Number,
    // 单个元素的非拖动态占位高度（含边距）
    itemHeightLarge: Number,
    // 滚动区域高度
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
    // !! 注意此项计算优先进行
    'itemHeight,itemHeightLarge,editMode'(itemHeight, itemHeightLarge, editMode) {
      const hasSizeChange = itemHeight !== itemHeightLarge && !!itemHeightLarge
      const useAccumulatedY = hasSizeChange && !editMode
      this.setData({
        hasSizeChange,
        useAccumulatedY,
      })
    },
    'movableList,itemHeight'() {
      // Logger.trace('[movableList observer]', this.data.movableList)

      // 列表变更触发
      this.initListThrottle()
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    list: [] as CardItem[],
    currentIndex: -1, // 当前拖动的元素索引，从0开始
    placeholder: -1, // 临时占位（上轮联动结束时）的排序号，从1开始
    moveareaHeight: 0,
    hasSizeChange: false, // 元素是否有动态尺寸变化
    useAccumulatedY: false, // 纵向坐标是否使用累加值计算法
    scrollTop: 0, // 滚动条位置
    _moving: false, // 是否正在拖动
    _scrollHeightRes: 0,
    _touchY: 0,
    _originOrder: -1, // 被拖动元素，拖动开始前的排序号，从1开始
    _lastTimestamp: 0, // 记录上次的时间戳
  },

  lifetimes: {
    ready() {
      this.createSelectorQuery()
        .select('#scroller')
        .boundingClientRect()
        .exec((res) => {
          this.data._scrollHeightRes = res[0].height
        })
    },
  },

  methods: {
    initListThrottle: throttle(function (this: IAnyObject) {
      this.initList()
    }, 800),
    /**
     * 初始化列表
     * 索引号可能与排序号不对应，要注意避免变更oldList物理索引，而引起界面跳动；故优先旧列表排序号
     */
    async initList() {
      const { itemWidth, cols, movableList, itemHeight, itemHeightLarge } = this.data
      const oldList = JSON.parse(JSON.stringify(this.data.list)) as CardItem[]
      const newList = JSON.parse(JSON.stringify(movableList)) as CardItem[]
      const isUpdateList = this.data.listTimestamp > this.data._lastTimestamp || this.data.listTimestamp === 0

      Logger.trace('[initList]', this.data._lastTimestamp, '->', this.data.listTimestamp, oldList, '->', newList)

      const diffData = {} as IAnyObject
      const list = []
      let deleted = 0 // 已删除卡片计数
      let orderNum = 0

      // 遍历旧列表，对照新列表进行更新或者删除
      for (const index in oldList) {
        const item = oldList[index]
        const newItem = newList.find((ele) => ele.id === item.id)

        // 过滤已删除的内容（在新列表中不存在 || 带有已删除已添加标记）
        if (!newItem || newItem.deleted || newItem.added) {
          deleted++
          continue
        }

        // 如果更新列表，则使用新列表序号（物理索引不变）；否则直接基于旧序号计算
        orderNum = isUpdateList ? newItem.orderNum : item.orderNum - deleted

        const mergedItem = {
          ...item,
          ...newItem,
          orderNum,
        } as IAnyObject

        list.push(mergedItem)

        // 标记新列表中已添加
        newItem.added = true
      } // for

      // 遍历新列表，添加剩余的新增项
      for (const newItem of newList) {
        // 过滤已删除、已添加的内容
        if (newItem.deleted || newItem.added) continue

        orderNum = isUpdateList ? newItem.orderNum : orderNum + 1

        list.push({
          ...newItem,
          orderNum,
        })
      }

      // useAccumulatedY 模式下，提前计算位置映射，id -> posY
      const posMap = {} as IAnyObject
      let accumulatedY = 0
      if (this.data.useAccumulatedY) {
        const sortedList = [...list]?.sort((a, b) => a.orderNum - b.orderNum) ?? []
        for (const item of sortedList) {
          posMap[item.id] = accumulatedY
          accumulatedY += item.slimSize ? itemHeight : itemHeightLarge
        }
      }

      // 再次遍历，补充位置信息
      list.forEach((item, index) => {
        const i = item.orderNum - 1
        const itemY = this.data.useAccumulatedY ? posMap[item.id] : Math.floor(i / cols) * itemHeight

        // 当前拖拽中的元素，按拖拽位置及滚动偏移量计算位置
        if (index === this.data.currentIndex && this.data.hasSizeChange) {
          const marginBottom = 120 // 按钮占位及边距
          // ! 新的滚动位置：0 ~ i个卡片高度-滚动区域高度+触摸位置 ~ 列表高度-可滚动区域高度
          const maxScrollTop = i * itemHeight - this.data._scrollHeightRes + this.data._touchY + marginBottom
          const newScrollTop = Math.max(
            0,
            Math.min(maxScrollTop, newList.length * itemHeight - this.data._scrollHeightRes),
          )
          item.pos = [item.pos[0], item.pos[1] - this.data.scrollTop + newScrollTop]
          diffData.scrollTop = newScrollTop
          console.log('[reset scrollTop]max:', newList.length * itemHeight, '-', this.data._scrollHeightRes)
        } else {
          item.pos = [(i % cols) * itemWidth, itemY]
        }
      })

      diffData.list = list
      diffData.moveareaHeight = this.data.useAccumulatedY ? accumulatedY : itemHeight * Math.ceil(list.length / cols)

      this.setData(diffData)

      this.data._lastTimestamp = this.data.listTimestamp

      // Logger.trace('[initList result]', diffData.list)
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
      if (this.data._moving) {
        this.data._moving = false
        return
      }
      this.triggerEvent('cardTap', e.detail)

      const { type } = e.detail
      const { index } = e.currentTarget.dataset
      const { select } = this.data.list[index]
      console.log('cardTap', index, select, type)
      if (typeof select !== 'boolean' || type === 'control' || (type === 'offline' && !this.data.editMode)) return

      // 处理选择样式渲染逻辑
      this.setData({
        [`list[${index}].select`]: !select,
      })
    },
    dragBegin(e: WechatMiniprogram.CustomEvent<{ x: number; y: number }, IAnyObject, { index: number }>) {
      const { index } = e.target.dataset
      const { orderNum } = this.data.list[index]
      const diffData = {
        currentIndex: index,
        placeholder: orderNum,
      } as IAnyObject

      const { select } = this.data.list[index]

      // （进入编辑模式）首次拖动的同时，选中当前卡片
      if (!this.data.editMode && typeof select === 'boolean') {
        diffData[`list[${index}].select`] = !select
      }

      this.setData(diffData)

      console.log(`⇅ [dragBegin][${index}] draggable: ${this.data.config.draggable}`)

      this.triggerEvent('dragBegin', this.data.list[index])

      if (!this.data.config.draggable) return

      this.data._moving = true
      this.data._originOrder = orderNum
      this.data._touchY = e.detail.y - this.data.scrollTop

      if (this.data.hasSizeChange) this.initList()
    },
    dragMove(e: WechatMiniprogram.CustomEvent<number[], IAnyObject, { index: number }>) {
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
    async dragEnd(e: WechatMiniprogram.CustomEvent<IAnyObject, IAnyObject, { index: number }>) {
      const { index } = e.target.dataset
      const newOrder = this.data.placeholder
      this.data.placeholder = -1

      console.log(`⇅ [dragEnd]->${newOrder}`)

      if (newOrder < 0) return

      // 修正被拖元素的位置
      const diffData = {} as IAnyObject
      diffData[`list[${index}].pos`] = this.getPos(newOrder)
      diffData[`list[${index}].orderNum`] = newOrder
      diffData[`currentIndex`] = -1

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

      await delay(160) // 确保拖拽操作已结束，屏蔽tap事件

      this.data._moving = false

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

    // 页面滚动
    handleScroll(e: WechatMiniprogram.CustomEvent<{ scrollTop: number }>) {
      if (!this.data.hasSizeChange) return

      const { scrollTop } = e.detail
      this.data.scrollTop = scrollTop
    },
  },
})
