Component({
  /**
   * 组件的属性列表
   */
  properties: {
    value: Boolean,
    disabled: Boolean,
    iconSize: {
      type: null,
      value: 16,
    },
    label: {
      type: String,
      value: '',
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
      if (this.data.disabled) {
        return
      }

      this.triggerEvent('change', !this.data.value)
    },
  },
})
