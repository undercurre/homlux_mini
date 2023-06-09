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
      observer(value) {
        if (value) {
          this.setData({
            icon: this.data.value,
          })
        }
      },
    },
    value: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    actionList: [
      {
        id: 0,
        icon: '/assets/img/automation/device.png',
        title: '设备',
        desc: '执行房间内的设备动作',
      },
      {
        id: 1,
        icon: '/assets/img/automation/scene.png',
        title: '场景',
        desc: '执行房间内的场景',
      },
      {
        id: 3,
        icon: '/assets/img/automation/time.png',
        title: '延时',
        desc: '延迟一段时间',
      },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
      this.setData({
        icon: '',
      })
    },
    handleSceneIconTap(e: { currentTarget: { dataset: { scene: string } } }) {
      this.setData({
        icon: e.currentTarget.dataset.scene,
      })
    },
    // data-scene="{{item[0]}}"
    onConditionClicked(e: { currentTarget: { dataset: { index: number } } }) {
      console.log('actionClicked', e)
      this.triggerEvent('actionClicked', e.currentTarget.dataset.index)
      this.setData({
        icon: '',
      })
    },
  },
})
