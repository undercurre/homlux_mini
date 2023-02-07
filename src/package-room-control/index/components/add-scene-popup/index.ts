// package-room-control/index/components/add-scene/index.ts
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
    sceneIcon: '',
    sceneName: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onClickHide() {
      this.triggerEvent('close')
    },
    onConfirm() {
      // todo:
      this.triggerEvent('close')
    },
    handleClear() {
      this.setData({
        sceneName: '',
      })
    },
  },
})
