// skyline-components/mz-movable/index.ts
import { runOnJS, Easing, timing } from '../common/worklet'

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
    key: String,
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
        this.posTransfer(x, this.data.y)
        this.data._originX.value = x
      },
    },
    y: {
      type: Number,
      value: 0,
      observer(y) {
        this.posTransfer(this.data.x, y)
        this.data._originY.value = y
      },
    },
    // 超过可移动区域后，是否还可以移动
    outOfBounds: {
      type: Boolean,
      value: true,
    },
    // 边界（可移动区域）
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

      // console.log('movable wrapper attached', `#box-${this.data.key}`)

      this.applyAnimatedStyle(`#box-${this.data.key}`, () => {
        'worklet'
        return {
          transform: `translateX(${this.data._x.value}px) translateY(${this.data._y.value}px) `,
        }
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 动态变更坐标位置
    posTransfer(x: number, y: number) {
      if (this.data._x?.value !== x) {
        // console.log('[posTransfer x]', x, this.data._x?.value)

        if (this.data.animation) {
          this.data._x.value = timing(
            x,
            {
              duration: this.data.duration,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              easing: Easing.ease,
            },
            () => {
              'worklet'
            },
          )
        } else {
          this.data._x.value = x
        }
      }
      if (this.data._y?.value !== y) {
        // console.log('[posTransfer y]', y, this.data._y?.value)

        if (this.data.animation) {
          this.data._y.value = timing(
            y,
            {
              duration: this.data.duration,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              easing: Easing.ease,
            },
            () => {
              'worklet'
            },
          )
        } else {
          this.data._x.value = y
        }
      }
    },
    handleLongPress(e: { state: State; translationX: number; translationY: number }) {
      'worklet'

      const x = this.data._x.value
      const y = this.data._y.value
      const originX = this.data._originX.value
      const originY = this.data._originY.value

      switch (e.state) {
        // 长按开始
        case State.BEGIN: {
          if (wx.vibrateShort && this.data.vibrate) {
            runOnJS(wx.vibrateShort)({ type: 'heavy' })
          }
          runOnJS(this.triggerEvent.bind(this))('dragBegin')

          break
        }

        // 长按继续（拖动中）
        case State.ACTIVE: {
          const newX = Math.round(e.translationX + originX)
          if (x !== newX && (this.data.direction === 'all' || this.data.direction === 'horizontal')) {
            this.data._x.value = this.data.outOfBounds
              ? newX
              : Math.min(Math.max(newX, this.data.bound.left), this.data.bound.right)
          }

          const newY = Math.round(e.translationY + originY)
          if (y !== newY && (this.data.direction === 'all' || this.data.direction === 'vertical')) {
            this.data._y.value = this.data.outOfBounds
              ? newY
              : Math.min(Math.max(newY, this.data.bound.top), this.data.bound.bottom)
          }

          break
        }

        // 松手
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
      // console.log('handleLongPress', e.state, e.translationX, e.translationY, { x, y })
    },
    onClick() {
      console.log('onClick')
      this.triggerEvent('dragClick')
    },
  },
})
