Component({
  /**
   * 组件的属性列表
   */
  properties: {
    showProgress: {
      type: Boolean,
      value: true,
    },
    stepList: {
      type: Array,
      value: [
        {
          text: '连接设备',
        },
        {
          text: '设备联网中',
        },
        {
          text: '账号绑定',
        },
      ],
    },
    totalSection: {
      type: Number,
      value: -1,
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
    percentage: 0,
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
      const totalSection = this.data.totalSection > 0 ? this.data.totalSection : this.data.stepList.length
      const length = 100 / totalSection

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
