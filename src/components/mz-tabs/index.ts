Component({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  properties: {
    tabs: {
      type: Array,
      value: [],
    },
  },
  data: {
    selectedTab: 0,
    translateX: 0,
    _tabItemWidth: [] as number[],
    _tabBorderWidth: 0,
    scrollLeft: 0,
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
          this.onTapTab()
        })
        .catch((error) => {
          console.error('Error in Promise.all:', error)
        })
    },
  },

  methods: {
    onTapTab(evt = { currentTarget: { dataset: { tab: 0 } } }) {
      const { tab = 0 } = evt.currentTarget?.dataset || {}

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
