// package-room-control/index/components/switch-link-popup/index.ts
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
      observer(v) {
        console.log(v)
      },
    },
    linkType: {
      type: String,
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
    onClickHide() {
      this.triggerEvent('close')
    },
  },
})
