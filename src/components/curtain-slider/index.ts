import { runOnJS, shared, timing, GestureState } from '../../skyline-components/common/worklet'
import { throttle } from '../../utils/index'
import { storage } from '../../utils/storage'

const CURTAIN_WIDTH = 252 // 窗帘有效拖动宽度（rpx）

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
    _translateX: { value: 0 },
    _maxTranslateX: CURTAIN_WIDTH / 2,
  },
  lifetimes: {
    attached() {
      const divideRpxByPx = storage.get('divideRpxByPx') as number
      this.data._maxTranslateX = CURTAIN_WIDTH * divideRpxByPx
      this.data._isHandling = shared(false)
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
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    drag(evt: { state: number; absoluteX: number; deltaX: number }) {
      'worklet'
      const { state, absoluteX } = evt
      // console.log('[drag]', state, absoluteX, deltaX)

      switch (state) {
        case GestureState.BEGIN:
          this.data._isHandling.value = true
          break

        case GestureState.END:
        case GestureState.CANCELLED:
          runOnJS(this.dragEnd.bind(this))()
          break

        case GestureState.POSSIBLE: // HACK 代替点击事件
        case GestureState.ACTIVE: {
          const distance = Math.abs(absoluteX - this.data._WINDOW_WIDTH / 2)
          const posX = Math.min(this.data._maxTranslateX, Math.max(0, distance))

          this.data._translateX.value = posX

          runOnJS(this.valueChangeThrottle.bind(this))(posX)
        }
      }
    },
    valueChange(posX: number) {
      const value = this.xToV(posX)
      this.triggerEvent('change', value)
      this.setData({
        value,
      })
    },
    valueChangeThrottle: throttle(function (this: IAnyObject, posX: number) {
      this.valueChange(posX)
    }, 300),
    dragEnd() {
      const value = this.xToV(this.data._translateX.value)
      this.setData({
        value,
      })
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
