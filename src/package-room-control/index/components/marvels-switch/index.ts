// components/marvels-switch.ts
import { timing } from '../../../../skyline-components/common/worklet'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    checkedIndex: {
      type: Number,
      value: 0,
      observer(newVal) {
        this.data.left.value = timing(
          newVal * 148 + 8,
          {
            duration: 100,
          },
          () => {
            'worklet'
          },
        )
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    left: { value: 8 },
  },
  lifetimes: {
    attached() {
      this.data.left = wx.worklet.shared(this.data.checkedIndex * 148 + 8)
      this.applyAnimatedStyle('#slider', () => {
        'worklet'
        return {
          left: this.data.left.value + 'rpx',
        }
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    onSwitchChange(e: WechatMiniprogram.TouchEvent) {
      const { index } = e.currentTarget.dataset
      this.data.left.value = timing(
        index * 148 + 8,
        {
          duration: 100,
        },
        () => {
          'worklet'
        },
      )
      this.setData({
        checkedIndex: parseInt(index),
      })
      this.triggerEvent('switchchange', { checkedIndex: index })
    },
  },
})
