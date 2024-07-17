import { runOnJS, shared, timing, GestureState } from '../../skyline-components/common/worklet'
import { throttle } from '../../utils/index'
import { storage } from '../../utils/storage'

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
    _windowWidth: wx.getSystemInfoSync().windowWidth,
    _isHandling: { value: false },
    _translateX: { value: 0 },
    _divideRpxByPx: storage.get('divideRpxByPx'),
    _isTouchRight: { value: false },
    _maxTranslateX: 280,
  },
  lifetimes: {
    attached() {
      this.data._isTouchRight = shared(false)
      this.data._isHandling = shared(false)
      this.data._maxTranslateX = 252 * this.data._divideRpxByPx
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
      const { state, absoluteX, deltaX } = evt
      // console.log('[drag]', state, absoluteX, deltaX)

      switch (state) {
        case GestureState.BEGIN:
          this.data._isHandling.value = true
          this.data._isTouchRight.value = absoluteX > this.data._windowWidth / 2
          break

        case GestureState.END:
        case GestureState.CANCELLED:
          runOnJS(this.dragEnd.bind(this))()
          break

        case GestureState.ACTIVE: {
          const nextTranslateX = this.data._isTouchRight.value
            ? this.data._translateX.value + deltaX
            : this.data._translateX.value - deltaX
          const posX = Math.min(this.data._maxTranslateX, Math.max(0, nextTranslateX))

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
