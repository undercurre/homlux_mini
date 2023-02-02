// package-mine/home-manage/components/transfer-home/index.ts
Component({
  options: {
    addGlobalClass: true,
  },
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    memberList: [1, 2]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    close() {
      this.setData({
        show: false,
      })
    },
  }
})
