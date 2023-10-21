Component({
  data: {
    animationData: {},
    content: '',
  },
  methods: {
    /**
     * 显示toast
     * @param {String} message 文本内容
     * @param {Number} duration 展示时长
     */
    showToast(message, duration = 2000) {
      this.timeout && clearTimeout(this.timeout)
      const animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease',
      })
      animation.opacity(1).step()
      this.setData({
        animationData: animation.export(),
        content: message,
      })
      // 延时消失
      this.timeout = setTimeout(
        function () {
          animation.opacity(0).step()
          this.setData({
            animationData: animation.export(),
          })
        }.bind(this),
        duration,
      )
    },
  },
})
