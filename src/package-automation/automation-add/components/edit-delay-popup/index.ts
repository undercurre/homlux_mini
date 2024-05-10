Component({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    value: {
      type: Number,
      value: 0,
      observer: function (newVal) {
        const minute = Math.trunc(newVal / 60)
        const second = Math.trunc(newVal % 60)
        this.setData({
          'pickerColumns[0].defaultIndex': minute,
          'pickerColumns[1].defaultIndex': second,
        })
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    pickerColumns: [
      {
        values: Array.from({ length: 11 }, (_, i) => `${i < 10 ? '0' : ''}${i}`),
        defaultIndex: 0,
      },
      {
        values: Array.from({ length: 60 }, (_, i) => `${i < 10 ? '0' : ''}${i}`),
        defaultIndex: 0,
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
    handleConfirm() {
      this.triggerEvent('confirm', this.data.value)
    },
    handleCancel() {
      this.triggerEvent('cancel')
    },
    timeChange(e: { detail: { value: string[] } }) {
      const min = parseInt(e.detail.value[0])
      const sec = parseInt(e.detail.value[1])
      const value = min * 60 + sec
      this.setData({
        value,
      })
    },
    blank() {},
  },
})
