import { ComponentWithComputed } from 'miniprogram-computed'
import { getRect } from '../../utils/index'

ComponentWithComputed({
  externalClasses: ['custom-class'],
  options: {
    multipleSlots: true,
    // pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    disabled: Boolean,
    useButtonSlot: Boolean,
    activeColor: String,
    inactiveColor: String,
    max: {
      type: Number,
      value: 100,
    },
    min: {
      type: Number,
      value: 0,
    },
    step: {
      type: Number,
      value: 1,
    },
    value: {
      type: Number,
      value: 0,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    sliderBarStyle: '',
    _isWxsHandle: false,
    // _value: 0,
  },
  lifetimes: {
    attached() {},
    ready() {},
    detached() {},
  },
  observers: {
    value: function (newValue) {
      // console.log('observers-value, roomIcon', newValue, this.data._isWxsHandle)
      setTimeout(() => {
        //setTimeout是避免在popup中使用时无法获取（添加手动场景那里的popup）
        Promise.all([getRect(this, '#mz-slider'), getRect(this, '#button')]).then(([mzSlider, button]) => {
          this.setData({
            sliderBarStyle: `width: ${this.calcDis(
              ((newValue - this.data.min) / (this.data.max - this.data.min)) * (mzSlider.width - button.width) +
                button.width,
              button.width,
              mzSlider.width,
            )}px${this.data._isWxsHandle ? '' : ' !important'};`,
          })
        })
      }, 100)
    },
    //wxs执行时清空!important
    // _value: function (newValue) {
    //   console.log('observers-value, _value', newValue)
    //   this.setData({
    //     sliderBarStyle: '',
    //   })
    // },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    calcDis(value: number, min: number, max: number) {
      if (value >= min) {
        if (value < max) {
          return value
        } else {
          return max
        }
      } else {
        return min
      }
    },
    valueChange(e: { value: number }) {
      this.setData({
        value: parseInt((e.value / 100) * (this.data.max - this.data.min) + this.data.min),
      })
      this.triggerEvent('slideChange', this.data.value)
    },
    handleEnd(e: { value: number }) {
      this.setData({
        value: parseInt((e.value / 100) * (this.data.max - this.data.min) + this.data.min),
      })
      this.triggerEvent('slideEnd', this.data.value)
      //释放标志，允许通过外部value重新计算slider-bar宽度
      setTimeout(() => {
        this.setData({ _isWxsHandle: false })
      }, 200)
    },
    touchstart(e: { value: number }) {
      this.setData({
        _isWxsHandle: true,
        sliderBarStyle: '',
        value: parseInt((e.value / 100) * (this.data.max - this.data.min) + this.data.min),
      })
      this.triggerEvent('slideStart', this.data.value)
    },
  },
})
