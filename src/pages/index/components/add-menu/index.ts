import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    x: {
      type: String,
      value: '0',
    },
    y: {
      type: String,
      value: '0',
    },
    isShow: {
      type: Boolean,
      value: false,
      observer: function (newVal: boolean) {
        if (newVal) {
          this.setData({
            isRender: true,
          })
          this.showAnimate()
        } else {
          this.hideAnimate()
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isRender: false,
    menuList: [
      {
        title: '添加设备',
        key: 'device',
        icon: 'add',
        url: '/package-distribution/scan/index',
      },
      {
        title: '添加自动化',
        key: 'auto',
        icon: 'auto',
      },
      {
        title: '连接其它平台',
        key: 'platform',
        icon: 'auth',
        url: '/package-mine/auth/index',
      },
    ],
  },

  computed: {},

  /**
   * 组件的方法列表
   */
  methods: {
    async addMenuTap(e: { currentTarget: { dataset: { url: string } } }) {
      const url = e.currentTarget.dataset.url
      wx.navigateTo({ url })
    },
    hideAnimate() {
      this.animate(
        '#addMenu',
        [
          {
            opacity: 1,
            scaleY: 1,
            scaleX: 1,
            transformOrigin: '64rpx -16rpx 0',
            ease: 'ease',
          },
          {
            opacity: 0,
            scaleY: 0.8,
            scaleX: 0.8,
            transformOrigin: '64rpx -16rpx 0',
            ease: 'ease',
          },
        ],
        100,
        () => {
          this.setData({
            isRender: false,
          })
        },
      )
    },
    showAnimate() {
      this.animate(
        '#addMenu',
        [
          {
            opacity: 0,
            scaleY: 0.8,
            scaleX: 0.8,
            transformOrigin: '64rpx -16rpx 0',
            ease: 'ease',
          },
          {
            opacity: 1,
            scaleY: 1,
            scaleX: 1,
            transformOrigin: '64rpx -16rpx 0',
            ease: 'ease',
          },
        ],
        100,
      )
    },
    black() {},
  },
})
