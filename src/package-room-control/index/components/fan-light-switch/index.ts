// components/fan-light-switch.ts
import { timing } from '../../../../skyline-components/common/worklet'

const _BTN_WIDTH = 342

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isLightOn: Boolean,
    isFanOn: Boolean,
    checkedIndex: {
      type: Number,
      value: 0,
      observer(newVal) {
        this.data.left.value = timing(
          newVal * _BTN_WIDTH,
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
    left: { value: 0 },
  },
  lifetimes: {
    attached() {
      this.data.left = wx.worklet.shared(this.data.checkedIndex * _BTN_WIDTH)
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
    onSwitchChange(e: WechatMiniprogram.TouchEvent<never, never, { index: number }>) {
      const { index } = e.currentTarget.dataset
      this.data.left.value = timing(
        index * _BTN_WIDTH,
        {
          duration: 100,
        },
        () => {
          'worklet'
        },
      )
      this.setData({
        checkedIndex: Number(index),
      })
      this.triggerEvent('switchchange', { checkedIndex: index })
    },
    handleBtnTap(e: WechatMiniprogram.TouchEvent<never, never, { key: string }>) {
      const { key } = e.currentTarget.dataset

      this.triggerEvent('btnTap', { key })
    },
  },
})
