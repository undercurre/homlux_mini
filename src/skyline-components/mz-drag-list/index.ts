import { shared, timing, runOnJS } from '../common/worklet'
type listItem = {
  id: string
  sortKey: number
  realSortKey: number
  tempSortKey: number
  data: IAnyObject
}
type baseData = {
  platform: 'ios' | 'android' | 'windows' | 'mac' | 'devtools'
  windowHeight: number
  realTopSize: number
  realBottomSize: number
  wrapTopSize: number
  rows: number
  itemHeight: number
  maxScrollTop: number
  data: IAnyObject
}

Component({
  externalClasses: ['item-wrap-class'],
  options: {
    multipleSlots: true,
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  properties: {
    listData: {
      // 数据源
      type: Array,
      value: [],
    },
    topSize: {
      // scroll顶部固定高度
      type: Number,
      value: 0,
    },
    bottomSize: {
      // scroll底部固定高度
      type: Number,
      value: 0,
    },
    itemHeight: {
      // 每个 item 高度, 用于计算 item-wrap 高度
      type: Number,
      value: 0,
    },
  },
  data: {
    /* 未渲染数据 */
    _baseData: {} as baseData,
    _scrollTop: 0,
    _scrollTopReady: false,
    _preEndKey: -1,
    _autoMoveTimerId: null as null | number,
    _itemStyle: {} as IAnyObject, // 所有item 样式
    _tempItemStyle: {} as IAnyObject, // 假象item 样式

    /* 渲染数据 */
    wrapStyle: '', // item-wrap 样式
    list: [] as listItem[], // 渲染数据列
    curDragItem: {} as listItem,
    dragging: false,
    // updating: false, // 正在更新数据，不允许手势操作
  },
  methods: {
    /**
     *  初始化函数
     *  {listData, topSize, bottomSize, itemHeight} 参数改变需要手动调用初始化方法
     */
    init() {
      const { windowHeight, platform } = wx.getSystemInfoSync()
      console.log('drag的topsize和bottomsize', this.data.topSize, this.data.bottomSize)
      Object.assign(this.data._baseData, {
        platform: platform,
        windowHeight: windowHeight,
        realTopSize: this.data.topSize,
        realBottomSize: this.data.bottomSize === 0 ? windowHeight : this.data.bottomSize,
      })
      this.initList()
    },
    initList() {
      const { listData = [] } = this.data
      if (listData.length === 0) return

      Object.assign(this.data._baseData, {
        rows: Math.ceil(listData.length),
      })

      const list = [] as listItem[]
      const delItem = (item: IAnyObject, index: number) => ({
        id: item.dragId,
        data: item,
        sortKey: index,
        tempSortKey: index,
        realSortKey: index,
      })
      // 遍历数据源增加扩展项, 以用作排序使用
      listData.forEach((item, index) => {
        list.push(delItem(item, index))
      })
      this.setData(
        {
          list,
          wrapStyle: `height: ${this.data._baseData.rows * this.data.itemHeight}rpx`,
        },
        () => {
          // 绑定动画
          this.data.list.forEach((item) => {
            const translationY = shared(0)
            const opacity = shared(1)
            this.applyAnimatedStyle(
              `#ID${item.id}`,
              () => {
                'worklet'
                return {
                  transform: `translateY(${translationY.value}%)`,
                  opacity: opacity.value,
                }
              },
              { immediate: true, flush: 'async' },
            )
            this.data._itemStyle[item.id] = { translationY, opacity }
          })
          const tempItemTop = shared(0)
          const tempItemOpacity = shared(0)
          this.applyAnimatedStyle(
            '#tempItem',
            () => {
              'worklet'
              return {
                top: tempItemTop.value + 'px',
                opacity: tempItemOpacity.value,
              }
            },
            { immediate: true, flush: 'async' },
          )
          this.data._tempItemStyle = { tempItemTop, tempItemOpacity }
        },
      )

      // 异步加载数据时候, 延迟执行 initDom 方法, 防止基础库 2.7.1 版本及以下无法正确获取 dom 信息
      setTimeout(() => this.initDom(), 0)
    },
    /**
     *  初始化获取 dom 信息
     */
    initDom() {
      const query = this.createSelectorQuery()
      query.select('.item').boundingClientRect()
      query.exec((res) => {
        if (!res || !res[0]) {
          return
        }
        console.log('initDom的信息', res[0])
        Object.assign(this.data._baseData, {
          itemHeight: res[0].height,
          wrapTopSize: res[0].top,
          maxScrollTop:
            this.data._baseData.rows * res[0].height +
            (res[0].top - this.data._baseData.realTopSize) -
            (this.data._baseData.realBottomSize - this.data._baseData.realTopSize),
        })
        this.setData({
          wrapStyle: `height: ${this.data._baseData.rows * this.data._baseData.itemHeight}px`,
        })
      })
    },
    vibrate() {
      if (this.data._baseData.platform !== 'devtools') wx.vibrateShort({ type: 'heavy' })
    },
    pageScroll(e: { scrollTop: number }) {
      this.triggerEvent('scroll', {
        scrollTop: e.scrollTop,
      })
    },

    longPress(evt: { state: number; currentTarget: { dataset: { id: string; sortkey: number } }; absoluteY: number }) {
      'worklet'
      if (evt.state === 1) {
        runOnJS(this.toggleDragging.bind(this))(true, evt.currentTarget.dataset)
        runOnJS(this.setTempItemValue.bind(this))(evt.absoluteY)
      } else if (evt.state === 2) {
        runOnJS(this.setTempItemValue.bind(this))(evt.absoluteY)
        runOnJS(this.touchMove.bind(this))(evt)
      } else {
        runOnJS(this.toggleDragging.bind(this))(false, evt.currentTarget.dataset)
      }
    },

    toggleDragging(isDragging: boolean, dataset = { id: '', sortkey: 0 }) {
      this.data._scrollTopReady = false
      // 如果已经在 drag 中则禁止操作, 防止多指触发 drag 动作
      if (isDragging && this.data.dragging) return
      this.data._itemStyle[dataset.id].opacity.value = isDragging ? 0 : 1
      this.data._tempItemStyle.tempItemOpacity.value = isDragging ? 1 : 0

      this.setData(
        {
          dragging: isDragging,
          //HACK:安卓真机上不能置空对象
          curDragItem: isDragging ? this.data.list.find((item) => item.id === dataset.id) : this.data.curDragItem,
        },
        () => {
          if (isDragging) {
            this.vibrate()
            this.createSelectorQuery()
              .select(`#ID${dataset.id}`)
              .boundingClientRect()
              .exec((res) => {
                this.data._scrollTop =
                  this.data._baseData.realTopSize +
                  (this.data._baseData.wrapTopSize - this.data._baseData.realTopSize) +
                  this.data.curDragItem.sortKey * this.data._baseData.itemHeight -
                  res[0].top
                this.data._scrollTopReady = true

                console.log('此时scrollTop', this.data._scrollTop)
              })
          } else {
            if (!isDragging) {
              this.data._preEndKey = -1
              this.data.list.forEach((item) => {
                item.sortKey = item.tempSortKey
              })
              this.triggerEvent('sortend', {
                listData: this.data.list,
              })
            }
          }
        },
      )
    },
    setTempItemValue(value: number) {
      this.data._tempItemStyle.tempItemTop.value = value - this.data._baseData.itemHeight / 2
    },
    isOutRange(cY: number) {
      return cY < this.data._baseData.realTopSize || cY > this.data._baseData.realBottomSize
    },

    touchMove(evt: { absoluteY: number }) {
      //安卓真机上会快速触发多次手势
      if (!this.data._scrollTopReady) return
      if (this.data._autoMoveTimerId === null && !this.isOutRange(evt.absoluteY)) {
        this.touchAutoMove(evt.absoluteY)
      }
      // 到顶到底自动滑动
      if (evt.absoluteY < this.data._baseData.realTopSize && this.data._scrollTop >= 0) {
        if (this.data._autoMoveTimerId === null) {
          this.data._autoMoveTimerId = setInterval(() => {
            if (this.data._scrollTop <= 0) {
              clearInterval(this.data._autoMoveTimerId as number)
              this.data._autoMoveTimerId = null
              return
            }
            this.data._scrollTop -= 1
            this.touchAutoMove(evt.absoluteY, 'up')
          }, 10)
        }
      } else if (
        evt.absoluteY > this.data._baseData.realBottomSize &&
        this.data._scrollTop <= this.data._baseData.maxScrollTop
      ) {
        if (this.data._autoMoveTimerId === null) {
          this.data._autoMoveTimerId = setInterval(() => {
            if (this.data._scrollTop >= this.data._baseData.maxScrollTop) {
              clearInterval(this.data._autoMoveTimerId as number)
              this.data._autoMoveTimerId = null
              return
            }
            this.data._scrollTop += 1
            this.touchAutoMove(evt.absoluteY, 'down')
          }, 10)
        }
      } else {
        if (this.data._autoMoveTimerId !== null) {
          clearInterval(this.data._autoMoveTimerId)
          this.data._autoMoveTimerId = null
        }
      }
    },
    touchAutoMove(absoluteY: number, direction = '') {
      if (this.data._autoMoveTimerId !== null && direction) {
        this.triggerEvent('scroll', {
          scrollTop: this.data._scrollTop,
        })
      }
      const startKey = this.data.curDragItem.sortKey
      const endKey = Math.round(
        (this.data._scrollTop + (absoluteY - this.data._baseData.itemHeight / 2) - this.data._baseData.wrapTopSize) /
          this.data._baseData.itemHeight,
      )

      // 防止拖拽过程中发生乱序问题
      if (
        endKey === this.data._preEndKey ||
        (startKey === endKey && this.data._preEndKey === -1) ||
        endKey < 0 ||
        endKey > this.data.list.length - 1
      )
        return
      this.data._preEndKey = endKey

      this.sortCore(startKey, endKey)
      this.vibrate() // 触发震动
    },
    sortCore(sKey: number, eKey: number) {
      this.data.list.forEach((item) => {
        let tKey = item.sortKey
        if (tKey === sKey) {
          tKey = eKey
        } else if (sKey < eKey && tKey > sKey && tKey <= eKey) {
          --tKey
        } else if (sKey > eKey && tKey >= eKey && tKey < sKey) {
          ++tKey
        }

        this.data._itemStyle[item.id].translationY.value = timing(
          (tKey - item.realSortKey) * 100,
          {
            duration: 100,
          },
          () => {
            'worklet'
          },
        )
        if (item.tempSortKey !== tKey) item.tempSortKey = tKey
      })
    },
    /**
     * 向外暴露自定义事件
     * @param e
     */
    onItemClick(e: { detail: IAnyObject }) {
      this.triggerEvent('itemClick', e.detail)
    },
  },
})
