import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  externalClasses: ['custom-class'],
  /**
   * 组件的属性列表
   */
  properties: {
    // disabled: Boolean,
    show: {
      type: Boolean,
    },
    OnOff: {
      type: Boolean,
      value: false,
    },
    vertical: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    sliderWidth: 0,
  },
  computed: {
    isShow(data: { show: boolean; vertical: boolean }) {
      return { show: data.show, vertical: data.vertical }
    },
  },

  observers: {
    show: function () {
      setTimeout(() => {
        this.createSelectorQuery()
          .select('#slider')
          .boundingClientRect((res) => {
            this.setData({
              sliderWidth: res.width,
            })
          })
          .exec()
      }, 300)
    },
  },
  lifetimes: {
    attached() {},
    ready() {},
    detached() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    handleOnOffChange(e: WechatMiniprogram.TouchEvent) {
      if (e.currentTarget.dataset.value === this.data.OnOff) {
        return
      }

      this.setData({
        OnOff: e.currentTarget.dataset.value,
      })
      this.triggerEvent('OnOffChange', this.data.OnOff)

      if (this.data.vertical) {
        this.animate(
          '#slider',
          [
            {
              top: this.data.OnOff ? '96rpx' : '0',
            },
            {
              top: this.data.OnOff ? '0' : '96rpx',
            },
          ],
          100,
        )
      } else {
        this.animate(
          '#slider',
          [
            {
              left: this.data.OnOff ? this.data.sliderWidth + 'px' : '0',
            },
            {
              left: this.data.OnOff ? '0' : this.data.sliderWidth + 'px',
            },
          ],
          100,
        )
      }
    },
  },
})
