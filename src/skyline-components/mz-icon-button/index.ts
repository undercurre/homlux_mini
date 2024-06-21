import { ComponentWithComputed } from 'miniprogram-computed'
import { delay } from '../../utils/index'

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
      value: 0,
    },
    wrapperHeight: {
      type: Number,
      value: 80,
    },
    round: {
      type: Number,
      value: 48,
    },
    bgColor: {
      type: String,
      value: '#f7f8f9',
    },
    bgColorActive: {
      type: String,
      value: '#cccccc',
    },
    // 初始开关状态
    isOn: {
      type: Boolean,
      value: false,
      observer(v) {
        if (this.data.innerOn === v) return
        this.setData({ innerOn: v })
      },
    },
    // 松手后，UI状态是否回弹
    rebound: {
      type: Boolean,
      value: false,
    },
    // 回弹模式激活状态最短持续时间
    interval: {
      type: Number,
      value: 150,
    },
    // 图标文字排列方向 column | row
    direction: {
      type: String,
      value: 'column',
    },
    // 按钮文本
    text: {
      type: String,
      value: '',
    },
    textColor: {
      type: String,
      value: '#555659',
    },
    textColorActive: {
      type: String,
      value: '#ffffff',
    },
    // 按钮文本在按钮背景内部
    textInset: {
      type: Boolean,
      value: false,
    },
    textSize: {
      type: Number,
      value: 24,
    },
    // 文本与图标的间距
    textMargin: {
      type: Number,
      value: 16,
    },
    fontWeight: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    innerOn: false, // 内部开关状态
  },

  lifetimes: {
    ready() {},
  },

  computed: {
    hasIcon(data) {
      const { icon, iconActive } = data
      return icon || iconActive
    },
    imagePos(data) {
      const { imageSize } = data
      return `width: ${imageSize}rpx; height: ${imageSize}rpx;
      margin-left: -${imageSize / 2}rpx; margin-top: -${imageSize / 2}rpx;`
    },
    imageStyle(data) {
      const { innerOn, imagePos } = data
      return `${imagePos} opacity: ${innerOn ? 0 : 1}`
    },
    imageActiveStyle(data) {
      const { innerOn, imagePos } = data
      return `${imagePos} opacity: ${innerOn ? 1 : 0}`
    },
    iconWrapperStyle(data) {
      const { textInset, wrapperWidth, wrapperHeight, round, bgColor, bgColorActive, innerOn } = data
      if (textInset) return ''

      // 如果文本在按钮背景外，则设置图标包围样式
      const _bgColor = innerOn ? bgColorActive : bgColor
      return `width: ${wrapperWidth}rpx; height: ${wrapperHeight}rpx; border-radius: ${round}rpx; background-color: ${_bgColor};`
    },
    btnWrapperStyle(data) {
      const { textInset, direction, wrapperWidth, wrapperHeight, round, bgColor, bgColorActive, innerOn } = data

      if (!textInset) return `flex-direction: ${direction};`

      // 如果文本在按钮背景内，则设置按钮整体包围样式
      const _bgColor = innerOn ? bgColorActive : bgColor
      let style = `flex-direction: ${direction};  border-radius: ${round}rpx; background-color: ${_bgColor}; padding: 0 20rpx;`
      if (wrapperWidth) style += wrapperWidth ? `width: ${wrapperWidth}rpx;` : ''
      if (wrapperHeight) style += `height: ${wrapperHeight}rpx; `

      return style
    },
    textStyle(data) {
      const { direction, textColor, textColorActive, textMargin, textSize, innerOn, hasIcon } = data
      const _color = innerOn ? textColorActive : textColor

      let style = `color: ${_color}; font-size: ${textSize}rpx;`
      if (hasIcon) {
        style += direction === 'row' ? `margin-left: ${textMargin}rpx;` : `margin-top: ${textMargin}rpx;`
      }

      return style
    },
  },

  methods: {
    handleTouchStart(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('btnTouchStart', e.detail)

      if (this.data.disabled) return
      // TODO 动画效果
      if (this.data.rebound) {
        this.setData({ innerOn: !this.data.innerOn })
      }
    },

    async handleTouchEnd(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('btnTouchEnd', e.detail)

      if (this.data.disabled || !this.data.rebound) return

      await delay(this.data.interval)
      if (this.data.rebound) {
        this.setData({ innerOn: !this.data.innerOn })
      }
    },
  },
})
