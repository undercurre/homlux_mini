import { timing } from '../../skyline-components/common/worklet'

Component({
  properties: {
    // disabled: Boolean,
    power: {
      type: Boolean,
      value: false,
      observer: function (newVal) {
        if (this.data.vertical) {
          //HACK: 直接赋值会导致控制前动画不到位
          this.data.top.value = timing(
            newVal ? 0 : 50,
            {
              duration: 30,
            },
            () => {
              'worklet'
            },
          )
          // this.data.top.value = newVal ? 0 : 50
        } else {
          this.data.left.value = timing(
            newVal ? 0 : 50,
            {
              duration: 30,
            },
            () => {
              'worklet'
            },
          )
          // this.data.left.value = newVal ? 0 : 50
        }
      },
    },
    vertical: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    top: { value: 0 },
    left: { value: 0 },
  },
  lifetimes: {
    attached() {
      if (this.data.vertical) {
        this.data.top = wx.worklet.shared(this.data.power ? 0 : 50)
        this.applyAnimatedStyle('#slider', () => {
          'worklet'
          return {
            top: this.data.top.value + '%',
          }
        })
      } else {
        this.data.left = wx.worklet.shared(this.data.power ? 0 : 50)
        this.applyAnimatedStyle('#slider', () => {
          'worklet'
          return {
            left: this.data.left.value + '%',
          }
        })
      }
    },
  },
  methods: {
    handleOnOffChange(e: WechatMiniprogram.TouchEvent) {
      if (e.currentTarget.dataset.value === this.data.power) {
        return
      }
      // HACK 无法在动画结束后的worklet函数调用setData、triggerEvent方法
      setTimeout(() => {
        this.setData(
          {
            power: e.currentTarget.dataset.value,
          },
          () => {
            this.triggerEvent('change', e.currentTarget.dataset.value)
          },
        )
      }, 100)
      if (this.data.vertical) {
        this.data.top.value = timing(
          e.currentTarget.dataset.value ? 0 : 50,
          {
            duration: 100,
          },
          () => {
            'worklet'
          },
        )
      } else {
        this.data.left.value = timing(
          e.currentTarget.dataset.value ? 0 : 50,
          {
            duration: 100,
          },
          () => {
            'worklet'
          },
        )
      }
    },
  },
})
