// package-distribution/search-subdevice/components/edit-device-info/index.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    deviceInfo: {
      name: ''
    },
    isAddRoom: false,
    roomList: [
      {
        id: '',
        name: '客厅',
        isCheck: true
      },
      {
        id: '',
        name: '卧室',
        isCheck: false
      }
    ]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    addRoom() {
      this.setData({
        isAddRoom: true
      })
    }
  }
})
