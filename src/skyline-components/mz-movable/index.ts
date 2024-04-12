// skyline-components/mz-movable/index.ts
const { runOnJS, Easing, timing } = wx.worklet

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
    // 位置变化时是否使用动画
    animation: {
      type: Boolean,
      value: true,
    },
    // 动画生效时的持续时间
    duration: {
      type: Number,
      value: 300,
    },
    // 移动方向，属性值有all vertical horizontal none
    direction: {
      type: String,
      value: 'none',
    },
    // 初始位置
    x: {
      type: Number,
      value: 0,
      observer(x) {
        console.log('observer x', x)
        if (!this.data._originX || this.data._originX.value === x) {
          return
        }

        this.data._originX.value = x
        if (this.data.animation) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this.data._x.value = timing(x, {
            duration: this.data.duration,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            easing: Easing.ease,
          })
        } else {
          this.data._x.value = x
        }
      },
    },
    y: {
      type: Number,
      value: 0,
      observer(y) {
        if (!this.data._originY || this.data._originY.value === y) {
          return
        }

        this.data._originY.value = y
        if (this.data.animation) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this.data._y.value = timing(y, {
            duration: this.data.duration,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            easing: Easing.ease,
          })
        } else {
          this.data._y.value = y
        }
      },
    },
    // 是否限制拖动边界
    hasBound: {
      type: Boolean,
      value: false,
    },
    // 边界
    bound: {
      type: Object,
      value: {
        top: 0,
        left: 0,
        right: 300,
        bottom: 9999,
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    _x: { value: 0 },
    _y: { value: 0 },
    _originX: { value: 0 },
    _originY: { value: 0 },
  },

  lifetimes: {
    attached() {
      this.data._originX = wx.worklet.shared(this.data.x)
      this.data._originY = wx.worklet.shared(this.data.y)
      this.data._x = wx.worklet.shared(this.data.x)
      this.data._y = wx.worklet.shared(this.data.y)

      this.applyAnimatedStyle('#moved-box', () => {
        'worklet'
        return {
          transform: `translateX(${this.data._x.value}px) translateY(${this.data._y.value}px) `,
        }
      })
      console.log('movable wrapper attached', this.data._x.value, this.data._y.value)
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

      const x = this.data._x.value
      const y = this.data._y.value
      const originX = this.data._originX.value
      const originY = this.data._originY.value

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

        case State.ACTIVE: {
          const newX = Math.round(e.translationX + originX)
          if (this.data._x.value !== newX && (this.data.direction === 'all' || this.data.direction === 'horizontal')) {
            this.data._x.value = this.data.hasBound
              ? Math.min(Math.max(newX, this.data.bound.left), this.data.bound.right)
              : newX
          }

          const newY = Math.round(e.translationY + originY)
          if (this.data._y.value !== newY && (this.data.direction === 'all' || this.data.direction === 'vertical')) {
            this.data._y.value = this.data.hasBound
              ? Math.min(Math.max(newY, this.data.bound.top), this.data.bound.bottom)
              : newY
          }

          // console.log('handleLongPress State.ACTIVE', this.data._offset.value, this.data.bound)
          break
        }

        case State.END:
          // 暂存坐标
          this.data._originX.value = x
          this.data._originY.value = y
          runOnJS(this.triggerEvent.bind(this))('dragEnd', { x, y })

          // console.log('handleLongPress State.END', this.data._offset.value)
          break

        default:
          break
      }
      console.log('handleLongPress', e.state, e.translationX, e.translationY, { x, y, originX, originY })
    },
  },
})
