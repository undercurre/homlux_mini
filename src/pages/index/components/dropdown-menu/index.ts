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
      observer: function (newVal: boolean) {
        if (newVal) {
          this.setData({
            isRender: true,
          })
          this.animate(
            '#menu',
            [
              {
                opacity: 0,
                scaleY: 0,
                transformOrigin: '0 0',
              },
              {
                opacity: 1,
                scaleY: 1,
              },
            ],
            500,
          )
        } else {
          this.animate(
            '#menu',
            [
              {
                opacity: 1,
              },
              {
                opacity: 0,
              },
            ],
            500,
            () => {
              this.setData({
                isRender: true,
              })
            },
          )
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isRender: false,
  },

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
