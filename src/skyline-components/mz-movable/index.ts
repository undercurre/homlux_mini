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

type GestureEvent = {
  state: State
  absoluteX: number
  absoluteY: number
}

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    key: String,
    // 拖动模式，属性值 pan | longpress
    trigger: {
      type: String,
      value: 'longpress',
    },
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
    // 移动方向，属性值有all | vertical | horizontal | none
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
        this.data._lastX.value = x
      },
    },
    y: {
      type: Number,
      value: 0,
      observer(y) {
        this.posTransfer(this.data.x, y)
        this.data._lastY.value = y
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
    // 组件当前坐标
    _x: { value: 0 },
    _y: { value: 0 },
    // 上一次移动结束时的坐标
    _lastX: { value: 0 },
    _lastY: { value: 0 },
    // 本次移动开始时的坐标
    _originX: { value: 0 },
    _originY: { value: 0 },
    // 正在被动移动中
    _settingX: { value: false },
    _settingY: { value: false },
  },

  lifetimes: {
    attached() {
      this.data._originX = wx.worklet.shared(this.data.x)
      this.data._originY = wx.worklet.shared(this.data.y)
      this.data._lastX = wx.worklet.shared(this.data.x)
      this.data._lastY = wx.worklet.shared(this.data.y)
      this.data._x = wx.worklet.shared(this.data.x)
      this.data._y = wx.worklet.shared(this.data.y)
      this.data._settingX = wx.worklet.shared(false)
      this.data._settingY = wx.worklet.shared(false)

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
      if (this.data._x?.value !== x && !this.data._settingX.value) {
        // console.log('[posTransfer x]', x, this.data._x?.value)

        this.data._settingX.value = true

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
              this.data._settingX.value = false
            },
          )
        } else {
          this.data._x.value = x
          this.data._settingX.value = false
        }
      }
      if (this.data._y?.value !== y && !this.data._settingY.value) {
        // console.log('[posTransfer y]', y, this.data._y?.value)

        this.data._settingY.value = true

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
              this.data._settingY.value = false
            },
          )
        } else {
          this.data._y.value = y
          this.data._settingY.value = false
        }
      }
    },
    /**
     * 拖动事件处理方法
     * @param e 为兼容长按及pan，使用绝对位置数值
     */
    handleMove(e: GestureEvent) {
      'worklet'
      const x = this.data._x.value
      const y = this.data._y.value
      const lastX = this.data._lastX.value
      const lastY = this.data._lastY.value
      // console.log('MOVE trigger', e.state, { x, y })

      switch (e.state) {
        // 长按开始
        case State.BEGIN: {
          if (wx.vibrateShort && this.data.vibrate) {
            runOnJS(wx.vibrateShort)({ type: 'heavy' })
          }
          runOnJS(this.triggerEvent.bind(this))('dragBegin')
          this.data._originX.value = e.absoluteX
          this.data._originY.value = e.absoluteY

          break
        }

        // 长按继续（拖动中）
        case State.ACTIVE: {
          const translationX = e.absoluteX - this.data._originX.value
          const translationY = e.absoluteY - this.data._originY.value
          const newX = Math.round(translationX + lastX)
          if (x !== newX && (this.data.direction === 'all' || this.data.direction === 'horizontal')) {
            this.data._x.value = this.data.outOfBounds
              ? newX
              : Math.min(Math.max(newX, this.data.bound.left), this.data.bound.right)
          }

          const newY = Math.round(translationY + lastY)
          if (y !== newY && (this.data.direction === 'all' || this.data.direction === 'vertical')) {
            this.data._y.value = this.data.outOfBounds
              ? newY
              : Math.min(Math.max(newY, this.data.bound.top), this.data.bound.bottom)
          }

          runOnJS(this.triggerEvent.bind(this))('dragMove', [e.absoluteX, e.absoluteY, newX, newY])

          break
        }

        // 松手
        case State.END:
          // 暂存坐标
          this.data._lastX.value = x
          this.data._lastY.value = y
          runOnJS(this.triggerEvent.bind(this))('dragEnd', { x, y })

          console.log('MOVE State.END', { x, y })
          break

        default:
          break
      }
    },
    handlePan(e: GestureEvent) {
      'worklet'
      if (this.data.trigger === 'pan') {
        this.handleMove(e)
      }
    },
    handleLongPress(e: GestureEvent) {
      'worklet'
      this.handleMove(e)
    },
    onClick() {
      console.log('onClick')
      this.triggerEvent('dragClick')
    },
  },
})
