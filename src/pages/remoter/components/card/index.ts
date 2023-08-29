import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  /**
   * 组件的属性列表
   */
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },

  computed: {
    // 设备数据，兼容独立使用和在drag组件中引用
    device(data) {
      return data.item?.data ?? data.item
    },
    desc(data) {
      const device = data.item?.data ?? data.item
      if (device?.saved === true) {
        const statusText = device.switchStatus === 'on' ? '开启' : '关闭'
        return `${device.switchType}${statusText}`
      }
      return '未连接'
    },
    bleIcon(data) {
      const device = data.item?.data ?? data.item
      const iconName = device.discovered === false ? 'bleOff' : 'bleOn'
      return `/assets/img/base/${iconName}.png`
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap() {
      this.triggerEvent('cardTap', this.data.device)
    },
    handleControlTap() {
      this.triggerEvent('controlTap', this.data.device)
    },
  },
})
