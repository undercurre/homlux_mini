import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    deviceList: {
      type: Array,
      value: [1, 2, 3],
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {
    finishNum(data) {
      return data.deviceList.filter((item) => item.status !== 'loading').length
    },
  },

  lifetimes: {
    ready() {},
  },

  /**
   * 组件的方法列表
   */
  methods: {
    cancel() {
      this.triggerEvent('cancel')
    },

    ignoreError() {
      this.triggerEvent('ignore')
    },

    finish() {
      this.triggerEvent('confirm')
    },
  },
})
