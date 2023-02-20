import { addRoom } from '../../apis/index'
import { homeStore } from '../../store/index'

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
    roomName: '',
    roomIcon: '',
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
    handleClose() {
      this.triggerEvent('close')
    },
    async handleConfirm() {
      const res = await addRoom({
        houseId: homeStore.currentHomeDetail.houseId,
        roomIcon: this.data.roomIcon,
        roomName: this.data.roomName,
      })
      if (res.success) {
        homeStore.updateHomeInfo()
        this.triggerEvent('close')
      }
    },
    selectIcon({ currentTarget }: WechatMiniprogram.BaseEvent) {
      console.log('selectIcon', currentTarget)
      this.setData({
        roomIcon: currentTarget.dataset.icon,
      })
    },
  },
})
