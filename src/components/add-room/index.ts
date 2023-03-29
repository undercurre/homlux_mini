import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { saveHouseRoomInfo } from '../../apis/index'
import { homeBinding, roomBinding } from '../../store/index'
import Toast from '@vant/weapp/toast/toast'

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
    _hasEditName: false,
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
    handleScroll(_: WechatMiniprogram.CustomEvent) {
      console.log('handleScroll')
    },
    changeRoomName(event: WechatMiniprogram.CustomEvent) {
      console.log('changeRoomName', event)

      this.setData({
        _hasEditName: true,
        'roomInfo.name': event.detail.value || '',
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

      if (this.data.roomInfo.name.length > 5) {
        Toast('房间名称不能超过5个字符')
        return
      }

      // 过滤表情符号
      const ranges = ['\ud83c[\udf00-\udfff]', '\ud83d[\udc00-\ude4f]', '\ud83d[\ude80-\udeff]']

      const reg = new RegExp(ranges.join('|'), 'g')

      if (reg.test(this.data.roomInfo.name)) {
        Toast('房间名称不能包含表情字符')
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
      const { icon, text } = currentTarget.dataset
      if (this.data._hasEditName) {
        this.setData({
          'roomInfo.icon': icon,
        })
      } else {
        this.setData({
          'roomInfo.icon': icon,
          'roomInfo.name': text,
        })
      }
    },
  },
})
