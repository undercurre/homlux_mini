Component({
  data: {
    isAgree: false,
    seconds: 3,
  },
  lifetimes: {
    ready() {
      const timeId = setInterval(() => {
        this.data.seconds--

        this.setData({
          seconds: this.data.seconds,
        })

        if (this.data.seconds <= 0) {
          clearInterval(timeId)
        }
      }, 1000)
    },
    detached() {},
  },
  methods: {
    handleConfirm() {
      console.log('222222')
      wx.navigateTo({
        url: '/package-distribution-meiju/pages/addDevice/pages/inputWifiInfo/inputWifiInfo',
      })
    },
  },
})
