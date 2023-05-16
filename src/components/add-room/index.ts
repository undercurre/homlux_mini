import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import { saveHouseRoomInfo } from '../../apis/index'
import { homeBinding, roomBinding } from '../../store/index'
import { checkInputNameIllegal, emitter } from '../../utils/index'

Component({
  options: {
    styleIsolation: 'apply-shared',
    pureDataPattern: /^_/,
  },

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
        icon: 'drawing-room',
        text: '客厅',
      },
      {
        icon: 'master-bedroom',
        text: '主卧',
      },
      {
        icon: 'second-bedroom',
        text: '次卧',
      },
      {
        icon: 'study-room',
        text: '书房',
      },
      {
        icon: 'restaurant',
        text: '餐厅',
      },
      {
        icon: 'cloakroom',
        text: '衣帽间',
      },
      {
        icon: 'bathroom',
        text: '浴室',
      },
      {
        icon: 'balcony',
        text: '阳台',
      },
      {
        icon: 'toilet',
        text: '卫生间',
      },
      {
        icon: 'gallery',
        text: '走廊',
      },
      {
        icon: 'kitchen',
        text: '厨房',
      },
      {
        icon: 'parents-room',
        text: '默认',
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
        'roomInfo.name': event.detail || '',
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },
    async handleConfirm() {
      if (!this.data.roomInfo.name) {
        Toast('名称不能为空')
        return
      }

      // 校验名字合法性
      if (checkInputNameIllegal(this.data.roomInfo.name)) {
        Toast('名称不能用特殊符号或表情')
        return
      }

      if (this.data.roomInfo.name.length > 5) {
        Toast('名称不能超过5个字符')
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
        emitter.emit('homeInfoEdit')
      }
    },
    /**
     * @name 图标选中操作
     */
    selectIcon({ currentTarget }: WechatMiniprogram.BaseEvent) {
      console.log('selectIcon', currentTarget)
      const { icon } = currentTarget.dataset
      this.setData({
        'roomInfo.icon': icon,
      })
    },
  },
})
