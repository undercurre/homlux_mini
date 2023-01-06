// components/home-select-menu/index.ts
Component({
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
    list: {
      type: Array,
      value: [],
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isRender: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleHomeTap(e: { currentTarget: { dataset: { value: number | string } } }) {
      this.triggerEvent('select', e.currentTarget.dataset.value)
    },
    hideAnimate() {
      this.animate(
        '#menu',
        [
          {
            opacity: 1,
            scaleY: 1,
            transformOrigin: '0 -16rpx 0',
            ease: 'ease',
          },
          {
            opacity: 0,
            scaleY: 0.8,
            transformOrigin: '0 -16rpx 0',
            ease: 'ease',
          },
        ],
        100,
        () => {
          this.setData({
            isRender: true,
          })
        },
      )
    },
    showAnimate() {
      this.animate(
        '#menu',
        [
          {
            opacity: 0,
            scaleY: 0.8,
            transformOrigin: '0 -16rpx 0',
            ease: 'ease',
          },
          {
            opacity: 1,
            scaleY: 1,
            transformOrigin: '0 -16rpx 0',
            ease: 'ease',
          },
        ],
        100,
      )
    },
  },
})
