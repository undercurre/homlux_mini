Component({
  /**
   * 组件的属性列表
   */
  properties: {
    showProgress: {
      type: Boolean,
      value: true,
    },
    percentage: {
      type: Number,
      value: 0,
    },
    stepList: {
      type: Array,
      value: [
        {
          text: '连接设备',
        },
        {
          text: '设备联网',
        },
        {
          text: '账号绑定',
        },
      ],
    },
    activeIndex: {
      type: Number,
      value: -1,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    interId: null as any,
  },

  lifetimes: {
    ready() {
      this.setProgressPercentage()
    },
    detached() {
      clearInterval(this.data.interId)
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    // 构造假进度条
    setProgressPercentage() {
      const length = 100 / this.data.stepList.length

      this.data.interId = setInterval(() => {
        const { activeIndex, interId } = this.data
        let { percentage } = this.data

        if (percentage >= 100) {
          clearInterval(interId)
          return
        }

        if (percentage >= length * (activeIndex + 1)) {
          return
        }

        ++percentage

        if (percentage < length * activeIndex) {
          percentage = length * activeIndex
        }

        this.setData({
          percentage: percentage,
        })
      }, 1000)
    },
  },
})
