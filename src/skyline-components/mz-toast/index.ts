Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: Boolean,
    mask: Boolean,
    message: String,
    forbidClick: Boolean,
    zIndex: {
      type: Number,
      value: 1000,
    },
    type: {
      type: String,
      value: 'text',
    },
    loadingType: {
      type: String,
      value: 'circular',
    },
    position: {
      type: String,
      value: 'middle',
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
    // for prevent touchmove
    noop: function () {},
  },
})
