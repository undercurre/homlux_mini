import { ComponentWithComputed } from 'miniprogram-computed'

enum sensorProductId {
  Value1 = 'midea.ir.201',
  Value2 = 'midea.magnet.001.201',
  Value3 = 'midea.freepad.001.201',
}

ComponentWithComputed({
  externalClasses: ['custom-class'],
  /**
   * 组件的属性列表
   */
  properties: {
    // disabled: Boolean,
    checkList: {
      type: Array,
      value: [],
    },
    //用于判断是哪种类型的传感器
    productId: {
      type: String,
      value: 'midea.ir.201',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    abilityList: {
      'midea.ir.201': [
        { name: '有人移动', ability: { Occupancy: 1 } },
        { name: '超时无人移动', ability: { Occupancy: 0, PIRToUnoccupiedDelay: 10 } },
        // { name: '环境光亮', ability: { IlluminanceLevelStatus: 2 } },
        // { name: '环境光暗', ability: { IlluminanceLevelStatus: 1 } },
      ],
      'midea.magnet.001.201': [
        { name: '打开', ability: { ZoneStatus: 1 } },
        { name: '关闭', ability: { ZoneStatus: 0 } },
        // { name: '环境光暗', ability: { IlluminanceLevelStatus: 1 } },
        // { name: '环境光亮', ability: { IlluminanceLevelStatus: 2 } },
        { name: '超时未关', ability: { ZoneStatus: 1, PIRToUnoccupiedDelay: 10 } },
      ],
      'midea.freepad.001.201': [
        { name: '单击', ability: { power: 1 } },
        { name: '双击', ability: { power: 2 } },
        { name: '长按', ability: { power: 3 } },
      ],
    },
  },
  computed: {
    checkedIndex(data) {
      return data.abilityList[data.productId as sensorProductId].findIndex((item) => {
        return item.name === data.checkList[0]
      })
    },
    list(data) {
      return data.abilityList[data.productId as sensorProductId]
    },
  },

  observers: {},
  lifetimes: {
    attached() {},
    ready() {},
    detached() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async handleOnOffChange(e: WechatMiniprogram.TouchEvent) {
      if (e.currentTarget.dataset.item.name === this.data.checkList[0]) {
        return
      }

      this.animate(
        '#slider',
        [
          {
            top: this.data.checkedIndex * 96 + 'rpx',
          },
          {
            top: e.currentTarget.dataset.index * 96 + 'rpx',
          },
        ],
        100,
        () => {
          //先设置原style，再清除动画样式避免样式造成闪烁问题
          this.setData({
            checkList: [e.currentTarget.dataset.item.name],
          })
          this.triggerEvent('change', e.currentTarget.dataset.item)
          this.clearAnimation('#slider', () => {})
        },
      )
    },
  },
})
