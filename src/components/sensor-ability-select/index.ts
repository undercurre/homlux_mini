import { timing } from '../../skyline-components/common/worklet'

enum sensorProductId {
  Value1 = 'midea.ir.201',
  Value2 = 'midea.magnet.001.201',
  Value3 = 'midea.freepad.001.201',
}

Component({
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
        { name: '有人移动', ability: { occupancy: 1, modelName: 'irDetector' } },
        { name: '超时无人移动', ability: { occupancy: 0, PIRToUnoccupiedDelay: 10, modelName: 'irDetector' } },
        // { name: '环境光亮', ability: { IlluminanceLevelStatus: 2 } },
        // { name: '环境光暗', ability: { IlluminanceLevelStatus: 1 } },
      ],
      'midea.magnet.001.201': [
        { name: '打开', ability: { doorStatus: 1, modelName: 'magnet' } },
        { name: '关闭', ability: { doorStatus: 0, modelName: 'magnet' } },
        // { name: '环境光暗', ability: { IlluminanceLevelStatus: 1 } },
        // { name: '环境光亮', ability: { IlluminanceLevelStatus: 2 } },
        { name: '超时未关闭', ability: { doorStatus: 1, PIRToUnoccupiedDelay: 10, modelName: 'magnet' } },
      ],
      'midea.freepad.001.201': [
        { name: '单击', ability: { buttonClicked: 1, modelName: 'freepad' } },
        { name: '双击', ability: { buttonClicked: 2, modelName: 'freepad' } },
        { name: '长按', ability: { buttonClicked: 3, modelName: 'freepad' } },
      ],
    },
    top: { value: 0 },
    checkedIndex: 0,
    list: [] as IAnyObject[],
  },

  observers: {
    'productId, checkList': function (productId, checkList) {
      this.setData(
        {
          checkedIndex: this.data.abilityList[productId as sensorProductId]?.findIndex((item) => {
            return item.name === checkList[0]
          }),
          list: this.data.abilityList[productId as sensorProductId],
        },
        () => {
          this.data.top.value = this.data.checkedIndex * 96
        },
      )
    },
  },
  lifetimes: {
    attached() {
      this.data.top = wx.worklet.shared(this.data.checkedIndex * 96)
      this.applyAnimatedStyle('#slider', () => {
        'worklet'
        return {
          top: this.data.top.value + 'rpx',
        }
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    handleOnOffChange(e: WechatMiniprogram.TouchEvent) {
      const { index } = e.currentTarget.dataset
      this.data.top.value = timing(
        index * 96,
        {
          duration: 100,
        },
        () => {
          'worklet'
        },
      )
      this.setData({
        checkedIndex: this.data.abilityList[this.data.productId as sensorProductId].findIndex((item) => {
          return item.name === e.currentTarget.dataset.item.name
        }),
      })
      this.triggerEvent('change', e.currentTarget.dataset.item)
    },
  },
})
