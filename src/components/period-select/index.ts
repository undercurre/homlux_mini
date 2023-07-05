// import Toast from '@vant/weapp/toast/toast'

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
    radio: '1',
    periodList: [
      { radio: '0', title: '仅一次' },
      { radio: '1', title: '每天' },
      { radio: '2', title: '法定工作日' },
      { radio: '3', title: '法定节假日' },
      { radio: '4', title: '自定义' },
    ],
    weekList: [
      { title: '周日', key: 'sun', checked: false },
      { title: '周一', key: 'mon', checked: true },
      { title: '周二', key: 'tue', checked: true },
      { title: '周三', key: 'wed', checked: true },
      { title: '周四', key: 'thu', checked: true },
      { title: '周五', key: 'fri', checked: true },
      { title: '周六', key: 'sat', checked: false },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onClick(event: { currentTarget: { dataset: { radio: string } } }) {
      const { radio } = event.currentTarget.dataset
      this.setData({
        radio,
      })
    },

    weekSelect(event: { currentTarget: { dataset: { index: number } } }) {
      console.log('weekSelect', event)
      const { index } = event.currentTarget.dataset
      this.setData({
        [`weekList[${index}].checked`]: !this.data.weekList[index].checked,
      })
    },
  },
})
