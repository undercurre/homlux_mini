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
      const { actionStatus, DISCOVERED } = device
      const action = device.actions[device.defaultAction]
      if (device?.saved === true) {
        const connectText = DISCOVERED === 1 ? '已连接' : '未连接'
        const statusText = actionStatus ? '开启' : '关闭'
        return typeof actionStatus === 'boolean' ? `${action.name}${statusText}` : connectText
      }
      return '未连接'
    },
    bleIcon(data) {
      const device = data.item?.data ?? data.item
      const iconName = device.DISCOVERED === 0 ? 'bleOff' : 'bleOn'
      return `/assets/img/base/${iconName}.png`
    },
    action(data) {
      const device = data.item?.data ?? data.item
      return device.actions[device.defaultAction]
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
    handlePicTap() {
      this.triggerEvent('exec', this.data.device)
    },
  },
})
