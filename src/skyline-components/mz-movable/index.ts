// skyline-components/mz-movable/index.ts
const { runOnJS } = wx.worklet

enum State {
  // 手势未识别
  POSSIBLE = 0,
  // 手势已识别
  BEGIN = 1,
  // 连续手势活跃状态
  ACTIVE = 2,
  // 手势终止
  END = 3,
  // 手势取消
  CANCELLED = 4,
}

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 开始拖动时，振动反馈
    vibrate: {
      type: Boolean,
      value: true,
    },
    // 初始位置
    origin: {
      type: Array,
      value: [0, 0],
      observer([x, y]) {
        if (this.data._origin) {
          this.data._origin.value = { x, y }
        }
        if (this.data._offset) {
          this.data._offset.value = { x, y }
        }
      },
    },
    // 边界
    bound: {
      type: Object,
      value: {
        top: 0,
        left: 0,
        right: 300,
        bottom: 600,
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    text: 'debug',
    _offset: { value: { x: 0, y: 0 } },
    _origin: { value: { x: 0, y: 0 } },
  },

  lifetimes: {
    attached() {
      this.data._offset = wx.worklet.shared({ x: this.data.origin[0], y: this.data.origin[1] })
      this.data._origin = wx.worklet.shared({ x: this.data.origin[0], y: this.data.origin[1] })
      this.applyAnimatedStyle('#moved-box', () => {
        'worklet'
        return {
          transform: `translateX(${this.data._offset.value.x}px) translateY(${this.data._offset.value.y}px) `,
        }
      })
      console.log('movable wrapper attached', this.data._offset.value)
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onClick() {
      // console.log('movable wrapper click')
      // this.triggerEvent('movableClick')
    },

    handleLongPress(e: { state: State; translationX: number; translationY: number }) {
      'worklet'

      let { x, y } = this.data._offset.value
      const { x: originalX, y: originalY } = this.data._origin.value

      switch (e.state) {
        case State.BEGIN: {
          if (wx.vibrateShort && this.data.vibrate) {
            runOnJS(wx.vibrateShort)({
              type: 'heavy',
            })
          }
          runOnJS(this.triggerEvent.bind(this))('dragBegin')

          break
        }

        case State.ACTIVE:
          x = Math.min(Math.max(e.translationX + originalX, this.data.bound.left), this.data.bound.right)
          y = Math.min(Math.max(e.translationY + originalY, this.data.bound.top), this.data.bound.bottom)
          this.data._offset.value = { x, y }

          // console.log('handleLongPress State.ACTIVE', this.data._offset.value, this.data.bound)
          break

        case State.END:
          // 暂存坐标
          this.data._origin.value = { x, y }
          // console.log('handleLongPress State.END', this.data._offset.value)
          break

        default:
          break
      }
      // console.log('handleLongPress End', e.state, e.translationX, e.translationY, { x, y, originalX, originalY })
    },
  },
})
