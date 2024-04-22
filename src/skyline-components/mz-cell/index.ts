Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
  },
  externalClasses: ['value-class', 'label-class'],
  /**
   * 组件的属性列表
   */
  properties: {
    title: String,
    value: String,
    icon: String,
    size: String,
    label: String,
    center: Boolean,
    isLink: Boolean,
    required: Boolean,
    clickable: Boolean,
    titleWidth: String,
    customStyle: String,
    arrowDirection: String,
    useLabelSlot: Boolean,
    border: {
      type: Boolean,
      value: true,
    },
    titleStyle: String,
  },

  /**
   * 组件的初始数据
   */
  data: {
    cellLeftStyle: '',
  },

  observers: {
    titleStyle: function (titleStyle) {
      this.setData({
        cellLeftStyle: titleStyle,
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onClick() {
      this.triggerEvent('click')
    },
  },
})
