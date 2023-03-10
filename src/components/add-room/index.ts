import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { saveHouseRoomInfo } from '../../apis/index'
import { homeBinding, roomBinding } from '../../store/index'
import Toast from '@vant/weapp/toast/toast'

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
    show: function (show) {
      if (!show) {
        return
      }

      console.log('observers-roomName, roomIcon', this.data)

      this.setData({
        roomInfo: {
          name: this.data.roomName,
          icon: this.data.roomIcon || 'parents-room',
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
      icon: 'parents-room',
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
      if (!this.data.roomInfo.name) {
        Toast('房间名称不能为空')
        return
      }

      if (this.data.roomInfo.name.length > 6) {
        Toast('房间名称不能超过6个字符')
        return
      }

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

        this.triggerEvent('close')
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
