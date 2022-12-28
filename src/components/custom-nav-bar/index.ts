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
      value: '',
    },
    background: {
      type: String,
      value: '#fff',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 状态栏高度
    statusBarHeight: wx.getStorageSync('statusBarHeight') + 'px',
    // 导航栏高度
    navigationBarHeight: wx.getStorageSync('navigationBarHeight') + 'px',
    // 胶囊按钮高度
    menuButtonHeight: wx.getStorageSync('menuButtonHeight') + 'px',
    // 导航栏和状态栏高度
    navigationBarAndStatusBarHeight:
      wx.getStorageSync('statusBarHeight') + wx.getStorageSync('navigationBarHeight') + 'px',
  },

  /**
   * 组件的方法列表
   */
  methods: {},
})
