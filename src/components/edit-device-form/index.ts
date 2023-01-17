// components/edit-device-form/index.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    isAddRoom: false,
    deviceInfo: {
      name: '',
    },
    roomList: [
      {
        id: '',
        name: '客厅',
        isCheck: true,
      },
      {
        id: '',
        name: '卧室',
        isCheck: false,
      },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    addRoom() {
      this.setData({
        isAddRoom: true,
      })
    },
  }
})
