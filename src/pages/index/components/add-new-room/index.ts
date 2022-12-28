Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    isShow: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    roomName: '',
    roomIcon: '',
    list: [
      {
        value: 'parents-room',
        icon: '/assets/img/room/parents-room.png',
      },
      {
        value: 'restaurant',
        icon: '/assets/img/room/restaurant.png',
      },
      {
        value: 'toilet',
        icon: '/assets/img/room/toilet.png',
      },
      {
        value: 'kitchen',
        icon: '/assets/img/room/kitchen.png',
      },
      {
        value: 'second-bedroom',
        icon: '/assets/img/room/second-bedroom.png',
      },
      {
        value: 'kids-room',
        icon: '/assets/img/room/kids-room.png',
      },
      {
        value: 'drawing-room',
        icon: '/assets/img/room/drawing-room.png',
      },
      {
        value: 'study-room',
        icon: '/assets/img/room/study-room.png',
      },
      {
        value: 'balcony',
        icon: '/assets/img/room/balcony.png',
      },
      {
        value: 'cloakroom',
        icon: '/assets/img/room/cloakroom.png',
      },
      {
        value: 'bathroom',
        icon: '/assets/img/room/bathroom.png',
      },
      {
        value: 'master-bedroom',
        icon: '/assets/img/room/master-bedroom.png',
      },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCancel() {
      this.triggerEvent('hide')
      this.setData({
        roomIcon: '',
        roomName: '',
      })
    },
    handleConfirm() {
      this.triggerEvent('hide')
      this.setData({
        roomIcon: '',
        roomName: '',
      })
    },
    handleClear() {
      this.setData({
        roomName: '',
      })
    },
    handleRoomNameInput(value: { detail: { value: string } }) {
      console.log(value.detail.value)
      this.setData({
        roomName: value.detail.value.slice(0, 5),
      })
    },
    handleIconClick(e: { currentTarget: { dataset: { icon: string } } }) {
      console.log(e.currentTarget.dataset.icon)
      this.setData({
        roomIcon: e.currentTarget.dataset.icon,
      })
    },
  },
})
