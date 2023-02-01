import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, userBinding, home } from '../../store/index'
import { runInAction } from 'mobx-miniprogram'
Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, userBinding] })],
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
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleHomeTap(e: { currentTarget: { dataset: { value: string } } }) {
      runInAction(() => {
        home.currentHomeId = e.currentTarget.dataset.value
      })
      this.triggerEvent('select')
    },
    hideAnimate() {
      this.animate(
        '#menu',
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
  },
})
