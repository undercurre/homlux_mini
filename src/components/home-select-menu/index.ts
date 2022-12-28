// components/home-select-menu/index.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    x: {
      type: String,
      value: '0',
    },
    y: {
      type: String,
      value: '0',
    },
    isShow: {
      type: Boolean,
      value: false,
    },
    list: {
      type: Array,
      value: [] as Home.DropdownItem[],
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
    test() {
      this.data.list[0]
    },
  },
})
