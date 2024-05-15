Component({
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

  methods: {
    handleTouchStart(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('btnTouchStart', e.detail)

      if (this.data.disabled) return

      this.data._bg_color.value = this.data.bgColorActive
      if (this.data.iconActive) {
        this.data._btn_opacity.value = 0
      }

      // if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
    },

    handleTouchEnd(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('btnTouchEnd', e.detail)

      if (this.data.disabled) return

      this.data._bg_color.value = this.data.bgColor
      if (this.data.iconActive) {
        this.data._btn_opacity.value = 1
      }
    },
  },
})
