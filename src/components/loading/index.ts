let interId: NodeJS.Timer

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    text: {
      type: String,
      value: '',
    },
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
  data: {},

  lifetimes: {
    ready() {
      this.setProgressPercentage()
    },
    detached() {
      clearInterval(interId)
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    // 构造假进度条
    setProgressPercentage() {
      const length = 100 / this.data.stepList.length

      interId = setInterval(() => {
        const { activeIndex } = this.data
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
