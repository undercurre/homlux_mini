// components/home-select-menu/index.ts
Component({
  options: {
    styleIsolation: 'apply-shared',
  },
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
      value: [
        // todo: 测试数据，需要删除
        {
          value: 1,
          name: '我的家庭',
          isCreator: true,
          isSelect: true,
        },
        {
          value: 2,
          name: '7285的家',
          isCreator: false,
          isSelect: false,
        },
        {
          value: 3,
          name: '1235的家',
          isCreator: false,
          isSelect: false,
        },
      ] as Home.DropdownItem[],
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
