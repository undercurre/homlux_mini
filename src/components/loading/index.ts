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
      default: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    stepList: {
      type: Array,
      default: [],
    },
    activeIndex: {
      type: Number,
      default: -1,
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
      interId = setInterval(() => {
        const { activeIndex } = this.data
        let { percentage } = this.data

        if (percentage >= 99) {
          clearInterval(interId)
        }

        ++percentage

        if (activeIndex < 0 && percentage > 10) {
          percentage = 10
        } else if (activeIndex < 1 && percentage > 33) {
          percentage = 33
        }

        this.setData({
          percentage: percentage,
        })
      }, 1000)
    },
  },
})
