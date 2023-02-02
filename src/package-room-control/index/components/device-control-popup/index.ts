import { storage } from '../../../../utils/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceBinding } from '../../../../store/index'

// package-room/index/components/popup-select-light/index.ts
ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] })],
  watch: {
    /**
     * 监听选择列表，执行动画
     * @param value 选择列表
     */
    selectList(value) {
      if (value.length > 0 && !this.data.info.show) {
        this.setData({
          'info.show': true,
        })
        this.animate(
          '#popup',
          [
            {
              opacity: 0,
            },
            {
              opacity: 1,
            },
          ],
          200,
        )
      } else if(value.length === 0) {
        this.animate(
          '#popup',
          [
            {
              opacity: 1,
            },
            {
              opacity: 0,
            },
          ],
          200,
          () => {
            this.setData({
              'info.show': false,
            })
          },
        )
      }
    },
  },
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    info: {
      bottomBarHeight: 0,
      componentHeight: 0,
      divideRpxByPx: 0,
      show: false,
    },
  },

  lifetimes: {
    /**
     * 初始化数据
     */
    attached() {
      const divideRpxByPx = storage.get<number>('divideRpxByPx')
        ? (storage.get<number>('divideRpxByPx') as number)
        : 0.5
      this.setData({
        info: {
          divideRpxByPx,
          componentHeight: divideRpxByPx * 752,
          bottomBarHeight: storage.get<number>('bottomBarHeight') as number,
          show: false
        },
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {},
})
