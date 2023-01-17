// package-distribution/search-subdevice/components/edit-device-info/index.ts
Component({
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
    roomInfo: {
      name: '',
      icon: '',
    },
    iconList: [
      {
        icon: 'parents-room',
        isCheck: true,
      },
      {
        icon: 'restaurant',
        isCheck: false,
      },
      {
        icon: 'toilet',
        isCheck: false,
      },
      {
        icon: 'kitchen',
        isCheck: false,
      },
      {
        icon: 'master-bedroom',
        isCheck: false,
      },
      {
        icon: 'kids-room',
        isCheck: false,
      },
      {
        icon: 'drawing-room',
        isCheck: false,
      },
      {
        icon: 'study-room',
        isCheck: false,
      },
      {
        icon: 'balcony',
        isCheck: false,
      },
      {
        icon: 'cloakroom',
        isCheck: false,
      },
      {
        icon: 'bathroom',
        isCheck: false,
      },
      {
        icon: 'second-bedroom',
        isCheck: false,
      },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    close() {
      this.setData({
        show: false
      })
    },
    selectIcon({ currentTarget }: WechatMiniprogram.BaseEvent) {
      console.log('selectIcon', currentTarget)
      this.data.roomInfo.icon = currentTarget.dataset.icon
      this.setData({
        roomInfo: this.data.roomInfo,
      })
    },
  },
})
