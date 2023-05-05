import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceBinding, deviceStore } from '../../../../store/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    item: {
      type: Object,
      observer() {},
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {
    isEditSelect(data) {
      if (data.editSelect && data.item) {
        return data.editSelect?.includes(data.item?.uniId)
      }
      return false
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleControlTap(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('controlTap', e.detail)
    },
    handleCardTap(e: WechatMiniprogram.TouchEvent) {
      if (deviceStore.isEditSelectMode) {
        runInAction(() => {
          if (deviceStore.editSelect.includes(this.data.item?.uniId)) {
            const index = deviceStore.editSelect.findIndex((uniId) => uniId === this.data.item.uniId)
            deviceStore.editSelect.splice(index, 1)
            deviceStore.editSelect = [...deviceStore.editSelect]
          } else {
            deviceStore.editSelect = [...deviceStore.editSelect, this.data.item.uniId]
          }
        })
      } else {
        this.triggerEvent('cardTap', e.detail)
      }
    },
    handleOfflineTap(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('offlineTap', e.detail)
    },
    handleLongPress() {
      this.triggerEvent('cardLongpress', Object.assign({}, this.data.item))
    },
  },
})
