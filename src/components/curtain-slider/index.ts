import { runOnJS, shared, timing } from '../../skyline-components/common/worklet'
import { storage } from '../../utils/storage'

Component({
  properties: {
    // disabled: Boolean,
    // max: {
    //   type: Number,
    //   value: 100,
    // },
    // min: {
    //   type: Number,
    //   value: 0,
    // },
    // step: {
    //   type: Number,
    //   value: 1,
    // },
    value: {
      type: Number,
      value: 0,
      observer(newVal) {
        //HACK: 直接赋值会导致控制前动画不到位
        if (this.data.isHandling.value) return
        this.data.translateX.value = timing(
          (newVal / 100) * this.data.maxTranslateX.value,
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
    windowWidth: { value: 0 },
    isHandling: { value: false },
    translateX: { value: 0 },
    divideRpxByPx: storage.get('divideRpxByPx'),
    isTouchRight: { value: false },
    maxTranslateX: { value: 280 },
    throttleTimer: 0,
  },
  lifetimes: {
    attached() {
      const { windowWidth } = wx.getSystemInfoSync()
      this.data.windowWidth = shared(windowWidth)
      this.data.isTouchRight = shared(false)
      this.data.isHandling = shared(false)
      this.data.maxTranslateX = shared(252 * this.data.divideRpxByPx)
      this.data.translateX = shared((this.data.value / 100) * this.data.maxTranslateX.value)
      this.applyAnimatedStyle('#right-curtain', () => {
        'worklet'
        return {
          transform: `translateX(${this.data.translateX.value}px)`,
        }
      })
      this.applyAnimatedStyle('#left-curtain', () => {
        'worklet'
        return {
          transform: `translateX(-${this.data.translateX.value}px)`,
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
      if (state === 3 || state === 4) {
        runOnJS(this.dragEnd.bind(this))()
      }
      if (state === 1) {
        this.data.isHandling.value = true
        this.data.isTouchRight.value = absoluteX > this.data.windowWidth.value / 2
      }

      if (state !== 2) return
      runOnJS(this.valueChange.bind(this))()
      const nextTranslateX = this.data.isTouchRight.value
        ? this.data.translateX.value + deltaX
        : this.data.translateX.value - deltaX
      if (nextTranslateX <= 0) {
        this.data.translateX.value = 0
      } else if (nextTranslateX >= this.data.maxTranslateX.value) {
        this.data.translateX.value = this.data.maxTranslateX.value
      } else {
        this.data.translateX.value = nextTranslateX
      }
    },
    valueChange() {
      if (this.data.throttleTimer) return
      const value = Math.round((this.data.translateX.value / this.data.maxTranslateX.value) * 100)
      this.data.throttleTimer = setTimeout(() => {
        this.triggerEvent('change', value)
        this.setData({
          value,
        })
        this.data.throttleTimer = 0
      }, 150)
    },
    dragEnd() {
      if (this.data.throttleTimer) {
        clearTimeout(this.data.throttleTimer)
        this.data.throttleTimer = 0
      }
      const value = Math.round((this.data.translateX.value / this.data.maxTranslateX.value) * 100)
      this.setData({
        value,
      })
      this.triggerEvent('slideEnd', value)
      //释放标志，允许通过外部value重新计算slider-bar宽度
      setTimeout(() => {
        this.data.isHandling.value = false
      }, 200)
    },
  },
})
