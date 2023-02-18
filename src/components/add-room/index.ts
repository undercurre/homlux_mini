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
      },
      {
        icon: 'restaurant',
      },
      {
        icon: 'toilet',
      },
      {
        icon: 'kitchen',
      },
      {
        icon: 'master-bedroom',
      },
      {
        icon: 'kids-room',
      },
      {
        icon: 'drawing-room',
      },
      {
        icon: 'study-room',
      },
      {
        icon: 'balcony',
      },
      {
        icon: 'cloakroom',
      },
      {
        icon: 'bathroom',
      },
      {
        icon: 'second-bedroom',
      },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    changeRoomName(event: WechatMiniprogram.CustomEvent) {
      console.log('changeRoomName', event)

      this.setData({
        'roomInfo.name': event.detail.value
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      // todo: 添加家庭业务
      this.triggerEvent('confirm')
    },
    selectIcon({ currentTarget }: WechatMiniprogram.BaseEvent) {
      console.log('selectIcon', currentTarget)
      this.setData({
        'roomInfo.icon': currentTarget.dataset.icon,
      })
    },
  },
})
