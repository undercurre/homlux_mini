import { runOnJS, shared, timing, GestureState } from '../../skyline-components/common/worklet'
import { throttle } from '../../utils/index'
import { storage } from '../../utils/storage'

const CURTAIN_WIDTH = 252 // 窗帘有效拖动宽度（rpx）
const THRESHOLD = 20 // 窗帘拖动时，有效计算范围，可稍微越界的阈值，确保能关闭到0%

Component({
  options: {
    pureDataPattern: /^_/,
  },
  properties: {
    value: {
      type: Number,
      value: 0,
      observer(newVal) {
        //HACK: 直接赋值会导致控制前动画不到位
        if (this.data._isHandling.value) return

        this.data._translateX.value = timing(
          Math.round((newVal / 100) * this.data._maxTranslateX),
          {
            duration: 30,
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
    _WINDOW_WIDTH: wx.getSystemInfoSync().windowWidth,
    _isHandling: { value: false },
    _isOpening: { value: false }, // 窗帘是否正处于打开趋势（包括暂停状态）
    _startSide: { value: '' }, // 开始拖动时的位置
    _translateX: { value: 0 },
    _maxTranslateX: CURTAIN_WIDTH / 2,
  },
  lifetimes: {
    attached() {
      const divideRpxByPx = storage.get('divideRpxByPx') as number
      this.data._maxTranslateX = CURTAIN_WIDTH * divideRpxByPx
      this.data._isHandling = shared(false)
      this.data._isOpening = shared(this.data.value < 100)
      this.data._startSide = shared('')
      this.data._translateX = shared((this.data.value / 100) * this.data._maxTranslateX)

      this.applyAnimatedStyle('#right-curtain', () => {
        'worklet'
        return {
          transform: `translateX(${this.data._translateX.value}px)`,
        }
      })
      this.applyAnimatedStyle('#left-curtain', () => {
        'worklet'
        return {
          transform: `translateX(-${this.data._translateX.value}px)`,
        }
      })

      this.applyAnimatedStyle('#right-indicator', () => {
        'worklet'
        return {
          transform: this.data._isOpening.value ? 'unset' : 'scaleX(-1)',
        }
      })
      this.applyAnimatedStyle('#left-indicator', () => {
        'worklet'
        return {
          transform: this.data._isOpening.value ? 'unset' : 'scaleX(-1)',
        }
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    // DESERTED 直接使用拖动手势即可，效果比缩放手势更流畅
    // handleScale(e: { state: number; horizontalScale: number }) {
    //   'worklet'
    //   const { state, horizontalScale } = e
    //   // console.log('[handleScale]', state, horizontalScale)

    //   switch (state) {
    //     case GestureState.BEGIN:
    //       this.data._isHandling.value = true
    //       console.log('[handleScale BEGIN]')

    //       break

    //     case GestureState.CANCELLED:
    //     case GestureState.END:
    //       console.log('[handleScale End]')
    //       break

    //     case GestureState.POSSIBLE:
    //     case GestureState.ACTIVE: {
    //       runOnJS(this.scaleThrottle.bind(this))(horizontalScale)
    //     }
    //   }
    // },
    // scaleThrottle: throttle(function (this: IAnyObject, scale: number) {
    //   console.log('[handleScale Throttle]', scale)

    //   const ratio = 0.5 // 降速倍率，用于减缓缩放速度
    //   const fixedScale = (scale - 1) * ratio + 1
    //   const distance = Math.abs(this.data._translateX.value * fixedScale)
    //   const posX = Math.min(this.data._maxTranslateX, distance)
    //   this.data._translateX.value = posX
    // }, 150),

    handleDrag(e: { state: number; absoluteX: number; deltaX: number }) {
      'worklet'
      const { state, absoluteX } = e
      const midWidth = this.data._WINDOW_WIDTH / 2
      const curSide = absoluteX > midWidth ? 'right' : 'left'
      // console.log('[handleDrag]', state, absoluteX)

      switch (state) {
        case GestureState.BEGIN:
          this.data._isHandling.value = true
          this.data._startSide.value = curSide
          break

        case GestureState.CANCELLED: // HACK 代替点击离开事件
        case GestureState.END:
          this.data._startSide.value = ''
          runOnJS(this.dragEnd.bind(this))()
          break

        case GestureState.POSSIBLE: {
          // HACK 代替双指点击事件
          const distance = Math.abs(absoluteX - midWidth)
          const posX = Math.min(this.data._maxTranslateX, Math.max(0, distance))
          this.data._translateX.value = posX
          runOnJS(this.valueChangeThrottle.bind(this))(posX)
          break
        }
        case GestureState.ACTIVE: {
          const delta = Math.abs(absoluteX - midWidth)

          // 只响应单边操作；跨越另一边超过THRESHOLD的操作不响应，小于THRESHOLD响应为0
          if (curSide !== this.data._startSide.value && delta > THRESHOLD) return
          const distance = curSide === this.data._startSide.value ? delta : 0

          const posX = Math.min(this.data._maxTranslateX, Math.max(0, distance))
          this.data._isOpening.value = this.data._translateX.value < posX || posX === 0
          this.data._translateX.value = posX

          runOnJS(this.valueChangeThrottle.bind(this))(posX)
          break
        }
      }
    },
    valueChangeThrottle: throttle(
      function (this: IAnyObject, posX: number) {
        const value = this.xToV(posX)
        this.triggerEvent('change', value)
        this.setData({
          value,
        })
      },
      200,
      true,
      true,
    ),
    dragEnd() {
      const value = this.xToV(this.data._translateX.value)
      this.triggerEvent('slideEnd', value)
      //释放标志，允许通过外部value重新计算slider-bar宽度
      setTimeout(() => {
        this.data._isHandling.value = false
      }, 200)
    },
    xToV(posX: number) {
      return Math.round((posX / this.data._maxTranslateX) * 100)
    },
  },
})
