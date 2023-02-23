import { storage } from '../../utils/index'

// components/custom-nav-bar/index.ts
Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
    },
    background: {
      type: String,
      value: 'transparent',
    },
    zIndex: {
      type: Number,
      value: 1,
    },
    leftArrow: {
      type: Boolean,
      value: false,
    },
    leftIcon: {
      type: String,
      value: '/assets/img/base/back.png',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 状态栏高度
    statusBarHeight: storage.get<number>('statusBarHeight') + 'px',
    // 导航栏高度
    navigationBarHeight: storage.get<number>('navigationBarHeight') + 'px',
    // 胶囊按钮高度
    menuButtonHeight: storage.get<number>('menuButtonHeight') + 'px',
    // 导航栏和状态栏高度
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleLeftTap() {
      this.triggerEvent('leftTap')
    },
  },
})
