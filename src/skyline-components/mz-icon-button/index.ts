import { ComponentWithComputed } from 'miniprogram-computed'
import { timing, Easing } from '../common/worklet'

ComponentWithComputed({
  properties: {
    disabled: Boolean,
    icon: {
      type: String,
      value: '',
    },
    iconActive: {
      type: String,
      value: '',
    },
    imageSize: {
      type: Number,
      value: 64,
    },
    wrapperWidth: {
      type: Number,
      value: 80,
    },
    wrapperHeight: {
      type: Number,
      value: 80,
    },
    round: {
      type: Number,
      value: 48,
    },
    textColor: {
      type: String,
      value: '#555659',
    },
    bgColor: {
      type: String,
      value: '#f7f8f9',
    },
    bgColorActive: {
      type: String,
      value: '#cccccc',
    },
    text: {
      type: String,
      value: '',
    },
    isOn: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    _btn_opacity: { value: 1 },
    _bg_color: { value: '' },
  },

  lifetimes: {
    attached() {
      if (this.data.iconActive) {
        this.data._btn_opacity = wx.worklet.shared(1)
        this.data._bg_color = wx.worklet.shared(this.data.bgColor)

        this.applyAnimatedStyle('#icon', () => {
          'worklet'
          return {
            opacity: this.data._btn_opacity.value,
          }
        })
        this.applyAnimatedStyle('#iconActive', () => {
          'worklet'
          return {
            opacity: 1 - this.data._btn_opacity.value,
          }
        })
        this.applyAnimatedStyle('#iconWrapper', () => {
          'worklet'
          return {
            'background-color': this.data._bg_color.value,
          }
        })
      }
    },
  },

  computed: {
    imageStyle(data) {
      const { imageSize } = data
      return `width: ${imageSize}rpx; height: ${imageSize}rpx;
      margin-left: -${imageSize / 2}rpx; margin-top: -${imageSize / 2}rpx;`
    },
    wrapperStyle(data) {
      const { wrapperWidth, wrapperHeight, round, bgColor, bgColorActive, isOn } = data
      const _bgColor = isOn ? bgColorActive : bgColor
      return `width: ${wrapperWidth}rpx; height: ${wrapperHeight}rpx; border-radius: ${round}rpx; background-color: ${_bgColor};`
    },
  },

  methods: {
    handleTouchStart(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('btnTouchStart', e.detail)

      if (this.data.disabled) return

      this.data._bg_color.value = this.data.bgColorActive
      if (this.data.iconActive) {
        this.data._btn_opacity.value = timing(
          0,
          {
            duration: 150,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            easing: Easing.ease,
          },
          () => {
            'worklet'
          },
        )
      }

      // if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
    },

    handleTouchEnd(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('btnTouchEnd', e.detail)

      if (this.data.disabled) return

      this.data._bg_color.value = this.data.bgColor
      if (this.data.iconActive) {
        this.data._btn_opacity.value = timing(
          1,
          {
            duration: 150,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            easing: Easing.ease,
          },
          () => {
            'worklet'
          },
        )
      }
    },
  },
})
