import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { saveHouseRoomInfo } from '../../apis/index'
import { homeBinding, roomBinding } from '../../store/index'

Component({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] })],

  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    isEditName: {
      type: Boolean,
      value: true,
    },
    isEditIcon: {
      type: Boolean,
      value: true,
    },
    roomId: {
      type: String,
      default: '',
    },
    roomName: {
      type: String,
      default: '',
    },
    roomIcon: {
      type: String,
      default: '',
    },
  },

  observers: {
    'roomName, roomIcon': function (roomName, roomIcon) {
      this.setData({
        roomInfo: {
          name: roomName,
          icon: roomIcon,
        },
      })
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
        'roomInfo.name': event.detail.value,
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },
    async handleConfirm() {
      const res = await saveHouseRoomInfo({
        houseId: homeBinding.store.currentHomeId,
        roomId: this.data.roomId,
        roomIcon: this.data.roomInfo.icon,
        roomName: this.data.roomInfo.name,
      })

      if (res.success) {
        roomBinding.store.updateRoomList()

        this.triggerEvent('confirm', {
          roomId: this.data.roomId,
          roomIcon: this.data.roomInfo.icon,
          roomName: this.data.roomInfo.name,
        })
      }
    },
    selectIcon({ currentTarget }: WechatMiniprogram.BaseEvent) {
      console.log('selectIcon', currentTarget)
      this.setData({
        'roomInfo.icon': currentTarget.dataset.icon,
      })
    },
  },
})
