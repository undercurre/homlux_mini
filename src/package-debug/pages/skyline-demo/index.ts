import pageBehavior from '../../../behaviors/pageBehaviors'

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
    show: false,
  },

  lifetimes: {
    ready() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    toClick() {
      console.log('toClick')
    },
    openPopup() {
      this.setData({
        show: true,
      })
    },
    closePopup() {
      this.setData({
        show: false,
      })
    },
  },
})
