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
    time: {
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
    periodType: {
      type: String,
      value: '1',
      observer(value) {
        if (value === '1' && this.data.week.split(',').length < 7) {
          this.setData({
            periodType: '4',
          })
        }
      },
    },
    week: {
      type: String,
      observer(value) {
        if (this.data.periodType === '1' && value.split(',').length < 7) {
          this.setData({
            periodType: '4',
          })
        }
      },
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
  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleCancel() {
      this.triggerEvent('cancel')
    },
    handleConfirm() {
      this.triggerEvent('confirm', { time: this.data.time, periodType: this.data.periodType, week: this.data.week })
    },
    timeChange(e: { detail: { value: string[] } }) {
      const time = e.detail.value.join(':')
      this.setData({
        time,
      })
      // this.triggerEvent('change', time)
    },
    /* 周期设置 start */
    periodChange(e: { detail: string }) {
      this.setData({
        periodType: e.detail,
      })
    },
    weekChange(e: { detail: string }) {
      this.setData({
        week: e.detail,
      })
    },
    /* 周期设置 end */
    blank() {},
  },
})
