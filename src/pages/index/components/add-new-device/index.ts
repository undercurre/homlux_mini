// pages/index/components/add-new-device/index.ts
Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    isShow: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    handleOverlayTap(e: { detail: { x: number; y: number } }) {
      console.log(e)
      this.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          // 判断是否点中蒙层
          if (e.detail.y < res[0].top) {
            this.triggerEvent('hide')
          }
        })
    },
    onClickHide() {
      this.triggerEvent('hide')
    },
    toNearDevice() {
      wx.navigateTo({
        url: '/package-distribution/near-device/index',
      })
    },
  },
})
