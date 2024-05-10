Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    customStyle: String,
    rootPortal: {
      type: Boolean,
      value: false,
    },
    zIndex: {
      type: Number,
      value: 1,
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
    onClick: function () {
      this.triggerEvent('click')
    },
    // for prevent touchmove
    noop: function () {},
  },
})
