Component({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  properties: {
    tabs: {
      type: Array,
      value: [],
    },
    activeId: {
      type: String,
      value: '',
      observer(val) {
        this.onTapTab({ currentTarget: { dataset: { activeid: val } } })
      },
    },
    textColorActive: {
      type: String,
      value: '#27282a',
    },
    itemWidth: String,
    itemHeight: String,
  },
  data: {
    selectedTab: 0,
    translateX: 0,
    _tabItemWidth: [] as number[],
    _tabBorderWidth: 0,
    scrollLeft: 0,
    itemStyle: '',
    wrapperStyle: 'height: 100rpx;',
  },

  observers: {
    'itemWidth,itemHeight'(w, h) {
      let itemStyle = '',
        wrapperStyle = ''
      if (w) itemStyle += `width: ${w}rpx;`
      if (h) {
        itemStyle += `height: ${h}rpx;`
        wrapperStyle += `height: ${h}rpx;`
      }
      this.setData({ itemStyle, wrapperStyle })
    },
  },

  lifetimes: {
    ready() {
      Promise.all([
        new Promise((resolve, reject) => {
          this.createSelectorQuery()
            .selectAll('.tab-item')
            .boundingClientRect()
            .exec((rect) => {
              if (rect && rect[0]) {
                resolve(rect[0].map((item: { width: number }) => item.width))
              } else {
                reject(new Error('No elements found for .tab-item'))
              }
            })
        }),
        new Promise((resolve, reject) => {
          this.createSelectorQuery()
            .select('.tab-border')
            .boundingClientRect()
            .exec((rect) => {
              if (rect && rect[0]) {
                resolve(rect[0].width)
              } else {
                reject(new Error('No element found for .tab-border'))
              }
            })
        }),
      ])
        .then(([tabItemsWidths, tabBorderWidth]) => {
          this.data._tabItemWidth = tabItemsWidths as number[]
          this.data._tabBorderWidth = tabBorderWidth as number
          this.onTapTab({ currentTarget: { dataset: { activeid: this.data.activeId } } })
        })
        .catch((error) => {
          console.error('Error in Promise.all:', error)
        })
    },
  },

  methods: {
    onTapTab(evt: { type?: string; currentTarget: { dataset: { tab?: number; activeid?: string } } }) {
      //初始化未完成或tabs为空数组
      if (!this.data._tabItemWidth.length) return
      let { tab = 0 } = evt.currentTarget?.dataset || {}
      const { activeid = '' } = evt.currentTarget?.dataset || {}
      // 防止tap事件和activeId变化导致多次相同触发
      if (this.data.translateX && (tab === this.data.selectedTab || activeid === this.data.activeId)) return
      // 非点击触发
      if (!evt.type) {
        tab = this.data.tabs.findIndex((item) => item.id === activeid)
        tab = tab < 0 ? 0 : tab
      }
      const translateX =
        this.data._tabItemWidth.slice(0, tab).reduce((prev, curr) => {
          return prev + curr
        }, 0) +
        (this.data._tabItemWidth[tab] - this.data._tabBorderWidth) / 2

      const tabOffset = tab - 1 < 0 ? 0 : tab - 1

      const scrollLeft =
        this.data._tabItemWidth.slice(0, tabOffset).reduce((prev, curr) => {
          return prev + curr
        }, 0) -
        this.data._tabItemWidth[tabOffset] / 2

      this.setData({
        selectedTab: tab,
        translateX,
        scrollLeft: scrollLeft,
      })
      this.triggerEvent('change', { selectedIndex: tab, selectedId: this.data.tabs[tab].id })
    },
  },
})
