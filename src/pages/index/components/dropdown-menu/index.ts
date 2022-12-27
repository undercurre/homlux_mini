// pages/index/components/dropdown-menu/index.ts
Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    x: {
      type: String,
      value: '0',
    },
    y: {
      type: String,
      value: '0',
    },
    isShow: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    handleAddDevice() {
      this.triggerEvent('select', 'addDevice')
    },
    handleAddRoom() {
      this.triggerEvent('select', 'addRoom')
    },
    handleInviteFamily() {
      this.triggerEvent('select', 'inviteFamily')
    },
  },
})
