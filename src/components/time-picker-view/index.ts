// import Toast from '@vant/weapp/toast/toast'

const hours = []
const minutes = []

for (let i = 0; i <= 23; i++) {
  hours.push(String(i).padStart(2, '0'))
}

for (let i = 0; i <= 59; i++) {
  minutes.push(String(i).padStart(2, '0'))
}

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  /**
   * 组件的属性列表
   */
  properties: {},
  /**
   * 用于监听 properties 和 data 的变化
   */
  observers: {},

  /**
   * 组件的初始数据
   */
  data: {
    hours: hours,
    minutes: minutes,
    hour: '2',
    minute: '2',
    value: [11, 0],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    bindChange(e: { detail: { value: Array<number> } }) {
      console.log('bindChange', e)
      const val = e.detail.value
      this.setData({
        hour: this.data.hours[val[0]],
        minute: this.data.minutes[val[1]],
      })
    },
  },
})
