// skyline-components/mz-movable/index.ts
import { runOnJS, Easing, timing, GestureState } from '../common/worklet'

type GestureEvent = {
  state: GestureState
  absoluteX: number
  absoluteY: number
}

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    key: String,
    // 拖动模式，属性值 all | pan | longpress
    trigger: {
      type: String,
      value: 'longpress',
    },
    // 是否可拖动
    draggable: Boolean,
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
      value: 100,
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
    },
    y: {
      type: Number,
      value: 0,
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
        right: 375,
        bottom: 9999,
      },
      observer(v) {
        this.data._bound.value = v as { top: number; left: number; right: number; bottom: number }
      },
    },
  },

  observers: {
    'x, y'(x, y) {
      this.posTransfer(x, y)
      this.data._lastX.value = x
      this.data._lastY.value = y
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
    // 边界
    _bound: { value: { top: 0, left: 0, right: 0, bottom: 0 } },
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
      this.data._bound = wx.worklet.shared(this.data.bound)

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
      if (!this.data.draggable) return

      if (!this.data._settingX.value) {
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
      if (!this.data._settingY.value) {
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
      if (!this.data.draggable) return

      const x = this.data._x.value
      const y = this.data._y.value
      const lastX = this.data._lastX.value
      const lastY = this.data._lastY.value
      // console.log('MOVE trigger', e.state, e.absoluteX, e.absoluteY, { x, y })

      switch (e.state) {
        // 拖动识别，保存初始值
        case GestureState.POSSIBLE: {
          this.data._originX.value = e.absoluteX
          this.data._originY.value = e.absoluteY
          break
        }
        // 拖动开始
        case GestureState.BEGIN: {
          this.data._originX.value = e.absoluteX
          this.data._originY.value = e.absoluteY

          if (wx.vibrateShort && this.data.vibrate) {
            runOnJS(wx.vibrateShort)({ type: 'heavy' })
          }
          runOnJS(this.triggerEvent.bind(this))('dragBegin', { x, y })

          break
        }

        // 拖动继续（拖动中）
        case GestureState.ACTIVE: {
          const translationX = e.absoluteX - this.data._originX.value
          const translationY = e.absoluteY - this.data._originY.value
          const newX = Math.round(translationX + lastX)
          if (x !== newX && (this.data.direction === 'all' || this.data.direction === 'horizontal')) {
            this.data._x.value = this.data.outOfBounds
              ? newX
              : Math.min(Math.max(newX, this.data._bound.value.left), this.data._bound.value.right)
          }

          const newY = Math.round(translationY + lastY)
          if (y !== newY && (this.data.direction === 'all' || this.data.direction === 'vertical')) {
            this.data._y.value = this.data.outOfBounds
              ? newY
              : Math.min(Math.max(newY, this.data._bound.value.top), this.data._bound.value.bottom)
          }

          runOnJS(this.triggerEvent.bind(this))('dragMove', [
            e.absoluteX,
            e.absoluteY,
            this.data._x.value,
            this.data._y.value,
          ])
          break
        }

        // 松手
        case GestureState.END:
          // 暂存坐标
          this.data._lastX.value = x
          this.data._lastY.value = y
          runOnJS(this.triggerEvent.bind(this))('dragEnd', { x, y })

          console.log('MOVE GestureState.END', { x, y })
          break

        default:
          break
      }
    },
    handlePan(e: GestureEvent) {
      'worklet'
      if (this.data.trigger === 'pan' || this.data.trigger === 'all') {
        this.handleMove(e)
      }
    },
    handleLongPress(e: GestureEvent) {
      'worklet'
      if (this.data.trigger === 'longpress' || this.data.trigger === 'all') {
        this.handleMove(e)
      }
    },
  },
})
