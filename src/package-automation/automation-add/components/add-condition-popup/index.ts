Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    conditionList: [
      {
        id: 0,
        icon: '/assets/img/automation/time.png',
        title: '到达某个时间时',
        desc: '如“晚上12点时，自动关闭卧室灯光和窗帘”',
        key: 'time',
      },
      {
        id: 1,
        icon: '/assets/img/automation/sensor.png',
        title: '传感器触发时',
        desc: '如“有人经过时，自动打开过道灯光”',
        key: 'sensor',
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

    onConditionClicked(e: { currentTarget: { dataset: { key: string } } }) {
      console.log('conditionClicked', e)
      this.triggerEvent('conditionClicked', e.currentTarget.dataset.key)
    },
  },
})
