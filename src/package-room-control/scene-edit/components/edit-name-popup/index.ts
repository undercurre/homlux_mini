// package-room-control/scene-edit/components/edit-name/index.ts
Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          this.setData({
            name: this.data.value,
          })
        }
      },
    },
    value: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    name: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
      this.setData({
        name: '',
      })
    },
    handleConfirm() {
      this.triggerEvent('confirm', this.data.name)
      this.setData({
        name: '',
      })
    },
  },
})
