Component({
  externalClasses: ['custom-class'],
  /**
   * 组件的属性列表
   */
  properties: {
    // disabled: Boolean,

    max: {
      type: Number,
      value: 100,
    },
    min: {
      type: Number,
      value: 0,
    },
    step: {
      type: Number,
      value: 1,
    },
    value: {
      type: Number,
      value: 0,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  lifetimes: {
    attached() {},
    ready() {},
    detached() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    valueChange(e: { value: number }) {
      this.triggerEvent('change', e.value)
      this.setData({
        value: e.value,
      })
    },
  },
})
