// pages/index/components/room-card/index.ts
Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    roomName: {
      type: String,
      value: '',
    },
    lightOnNumber: {
      type: Number,
      value: 0,
    },
    sceneList: {
      type: Array,
    },
    sceneSelect: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {},
})
