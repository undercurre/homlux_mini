// skyline-components/mz-pop-menu/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import { Easing, timing } from '../common/worklet'

ComponentWithComputed({
  /**
   * 组件的属性列表
   */
  properties: {
    menuList: {
      type: Array,
      value: [],
    },
    // 位置变化时是否使用动画
    animation: {
      type: Boolean,
      value: true,
    },
    // 动画生效时的持续时间
    duration: {
      type: Number,
      value: 150,
    },
    // 初始位置
    x: {
      type: String,
      value: '0rpx',
    },
    y: {
      type: String,
      value: '0rpx',
    },
    // 弹出动画原点
    transformOrigin: {
      type: String,
      value: 'center top',
    },
    // 最小宽度，FIXME scroll-view下无法自动横向延伸？
    width: {
      type: Number,
      value: 350,
    },
    // 最大高度
    height: {
      type: Number,
      value: 480,
    },
    // 上箭头的左边距
    arrowX: {
      type: Number,
      value: 32,
    },
    isShow: {
      type: Boolean,
      value: false,
      observer(val: boolean) {
        if (val) {
          this.showMenu()
        } else {
          this.hideMenu()
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    _scale: { value: 0 },
    _opacity: { value: 0 },
    reverseArrow: false,
  },

  computed: {
    composedHeight(data) {
      const ITEM_HEIGHT = 96
      const { height, menuList } = data
      const listHeight = menuList.length * ITEM_HEIGHT
      return Math.min(height, listHeight)
    },
  },

  lifetimes: {
    attached() {
      this.data._scale = wx.worklet.shared(0)
      this.data._opacity = wx.worklet.shared(0)

      this.applyAnimatedStyle('#menu', () => {
        'worklet'
        return {
          transform: `scale(${this.data._scale.value})`,
          opacity: this.data._opacity.value,
          transformOrigin: this.data.transformOrigin,
        }
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 动态变更坐标位置
    menuTransfer(scale: number, opacity: number) {
      if (this.data._scale?.value !== scale) {
        if (this.data.animation) {
          this.data._scale.value = timing(
            scale,
            {
              duration: this.data.duration,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              easing: Easing.ease,
            },
            () => {
              'worklet'
            },
          )
        } else {
          this.data._scale.value = scale
        }
      }
      if (this.data._opacity?.value !== opacity) {
        if (this.data.animation) {
          this.data._opacity.value = timing(
            opacity,
            {
              duration: this.data.duration,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              easing: Easing.ease,
            },
            () => {
              'worklet'
              if (!opacity) {
                // 确保彻底消失，以免遮挡其他元素
                this.data._scale.value = 0
              }
            },
          )
        } else {
          this.data._opacity.value = opacity
        }
      }
    },
    hideMenu() {
      this.menuTransfer(0.8, 0)
    },
    showMenu() {
      this.menuTransfer(1, 1)
    },
    scrollToLower() {
      this.setData({
        reverseArrow: true,
      })
    },
    scrollToUpper() {
      this.setData({
        reverseArrow: false,
      })
    },
    handleMenuTap(e: { currentTarget: { dataset: { value: string } } }) {
      this.triggerEvent('menuTap', e.currentTarget.dataset.value)
    },
    onClickOverlay() {
      this.triggerEvent('overlayClick')
    },
  },
})
