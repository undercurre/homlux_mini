import pageBehavior from '../../behaviors/pageBehaviors'
Component({
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    autoUpdate: false,
    isLoading: false,
    contentHeight: 0,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onLoad() {
      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },
    onChange(e: { detail: boolean }) {
      if (this.data.isLoading) {
        return
      }
      this.setData({
        isLoading: true,
        autoUpdate: e.detail,
      })
      setTimeout(() => {
        this.setData({
          isLoading: !this.data.isLoading,
        })
      }, 1000)
    },
  },
})
