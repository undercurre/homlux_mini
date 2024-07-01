Component({
  properties: {
    selectIndex: {
      type: Number,
      observer(newValue, old) {
        console.debug('observer,selectIndex', newValue, old)
        if (newValue) {
          this.setData({
            selected: newValue,
          })
        }
      },
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    selected: 0,
    color: '#a2a2a2',
    selectedColor: '#1E2C46',
    list: [
      {
        text: '全屋',
        selectedIcon: '/assets/img/tabbar/home-selected.png',
        unSelectedIcon: '/assets/img/tabbar/home-unselected.png',
        pagePath: '/pages/index/index',
      },
      {
        text: '遥控器',
        selectedIcon: '/assets/img/tabbar/remoter-selected.png',
        unSelectedIcon: '/assets/img/tabbar/remoter-unselected.png',
        pagePath: '/pages/remoter/index',
      },
      {
        text: '我的',
        selectedIcon: '/assets/img/tabbar/mine-selected.png',
        unSelectedIcon: '/assets/img/tabbar/mine-unselected.png',
        pagePath: '/pages/mine/index',
      },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    switchTab(data: { currentTarget: { dataset: { index: number; path: string } } }) {
      const { index, path } = data.currentTarget.dataset
      if (index === this.data.selected) {
        return
      }

      wx.switchTab({
        url: path,
      })
    },
  },
})
