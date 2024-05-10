import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {},
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
            icon: this.data.value,
          })
        }
      },
    },
    value: {
      type: String,
      value: '10:00',
      observer: function (newVal) {
        const [hour, minute] = newVal.split(':')
        this.setData({
          'pickerColumns[0].defaultIndex': parseInt(hour),
          'pickerColumns[1].defaultIndex': parseInt(minute),
        })
      },
    },
    type: {
      type: String,
      value: 'start',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    pickerColumns: [
      {
        values: Array.from({ length: 24 }, (_, i) => `${i < 10 ? '0' : ''}${i}`),
        defaultIndex: 10,
      },
      {
        values: Array.from({ length: 60 }, (_, i) => `${i < 10 ? '0' : ''}${i}`),
        defaultIndex: 0,
      },
    ],
  },

  computed: {
    title(data) {
      return data.type === 'start' ? '开始时间' : '结束时间'
    },
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
      const value = e.detail.value.join(':')
      this.setData({
        value,
      })
      // this.triggerEvent('change', e.detail)
    },
    blank() {},
  },
})
