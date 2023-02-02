import { storage } from '../../../../utils/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceBinding } from '../../../../store/index'

type SelectTypeList = ('light' | 'switch' | 'curtain')[]
ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] })],

  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    _minHeight: 0,
    _maxHeight: 0,
    isRender: false,
    popup: true, // 是否展开整个popup
    tab: '' as '' | 'light' | 'switch' | 'curtain',
    lightInfo: {
      brightness: 50,
      colorTemp: 2000,
    },
    curtainInfo: {
      left: 50,
      right: 50
    }
  },

  computed: {
    lightTab(data) {
      if ((data as unknown as { selectType: SelectTypeList }).selectType) {
        return (data as unknown as { selectType: SelectTypeList }).selectType.includes('light')
      }
      return false
    },
    switchTab(data) {
      if ((data as unknown as { selectType: SelectTypeList }).selectType) {
        return (data as unknown as { selectType: SelectTypeList }).selectType.includes('switch')
      }
      return false
    },
    curtainTab(data) {
      if ((data as unknown as { selectType: SelectTypeList }).selectType) {
        return (data as unknown as { selectType: SelectTypeList }).selectType.includes('curtain')
      }
      return false
    },
  },

  watch: {
    /**
     * 监听选择列表，执行动画
     * @param value 选择列表
     */
    selectList(value) {
      if (value.length > 0 && !this.data.isRender) {
        this.setData({
          isRender: true,
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
      } else if (value.length === 0) {
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
              isRender: false,
              popup: true,
            })
          },
        )
      }
    },
    /**
     * 监听当前选择类型
     */
    selectType(value) {
      if (value.length > 0) {
        if (!value.includes(this.data.tab)) {
          this.setData({
            tab: value[0],
          })
        }
      } else {
        this.setData({
          tab: '',
        })
      }
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
      let bottomBarHeight = storage.get<number>('bottomBarHeight') as number
      const componentHeight = 776 * divideRpxByPx
      let minHeight = 0
      if (bottomBarHeight === 0) {
        bottomBarHeight = 32 // 如果没有高度，就给个高度，防止弹窗太贴底部
      }
      minHeight = divideRpxByPx * 60 + bottomBarHeight
      this.data._minHeight = minHeight
      this.data._maxHeight = componentHeight
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleBarTap() {
      console.log(this.data._minHeight, this.data._maxHeight)
      const from = this.data.popup ? 0 : this.data._minHeight - this.data._maxHeight
      const to = this.data.popup ? this.data._minHeight - this.data._maxHeight : 0

      this.animate(
        '#popup',
        [
          {
            bottom: from + 'px',
          },
          {
            bottom: to + 'px',
          },
        ],
        200,
        () => {
          this.setData({
            popup: !this.data.popup,
          })
        },
      )
    },
    handleLightTabTap() {
      this.setData({
        tab: 'light',
      })
    },
    handleSwitchTabTap() {
      this.setData({
        tab: 'switch',
      })
    },
    handleCurtainTabTap() {
      this.setData({
        tab: 'curtain',
      })
    },
    doPopupShowAnimation() {},
  },
})
