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
  properties: {
    popup: {
      type: Boolean,
      value: true,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    _divideRpxByPx: 0,
    _bottom: 0, // 收起来时的bottom值
    _minHeight: 0,
    _componentHeight: 0,
    _wfullpx: 0,
    barWidth: 0,
    isRender: false,
    tab: '' as '' | 'light' | 'switch' | 'curtain',
    lightInfo: {
      brightness: 10,
      colorTemp: 20,
      maxColorTempK: 6000,
      minColorTempK: 2400,
    },
    curtainInfo: {
      left: 50,
      right: 50,
    },
    linkType: '',
    linkList: [] as string[],
    showLinkPopup: false,
  },

  computed: {
    colorTempK(data) {
      return (
        (data.lightInfo.colorTemp / 100) * (data.lightInfo.maxColorTempK - data.lightInfo.minColorTempK) +
        data.lightInfo.minColorTempK
      )
    },
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
    isSelectMultiSwitch(data) {
      if ((data as unknown as { selectSwitchList: string[] }).selectSwitchList) {
        return (data as unknown as { selectSwitchList: string[] }).selectSwitchList.length > 1
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
      const from = -this.data._componentHeight
      const to = this.properties.popup ? 0 : this.data._bottom
      if (this.data._componentHeight === 0) {
        return // 这时候还没有第一次渲染，from是0，不能正确执行动画
      }
      if (value.length > 0 && !this.data.isRender) {
        this.setData({
          isRender: true,
        })
        this.animate(
          '#popup',
          [
            {
              opacity: 0,
              bottom: from + 'px',
            },
            {
              opacity: 1,
              bottom: to + 'px',
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
              bottom: to + 'px',
            },
            {
              opacity: 0,
              bottom: -this.data._componentHeight + 'px',
            },
          ],
          200,
          () => {
            this.setData({
              isRender: false,
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
      const _componentHeight = 776 * divideRpxByPx
      let _minHeight = 0
      if (bottomBarHeight === 0) {
        bottomBarHeight = 32 // 如果没有高度，就给个高度，防止弹窗太贴底部
      }
      _minHeight = divideRpxByPx * 60 + bottomBarHeight
      this.data._minHeight = _minHeight
      this.data._componentHeight = _componentHeight
      this.data._bottom = _minHeight - _componentHeight
      this.data._wfullpx = divideRpxByPx * 750
      this.data._divideRpxByPx = divideRpxByPx
      this.setData({
        barWidth: 686 * divideRpxByPx,
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleBarTap() {
      const from = this.properties.popup ? 0 : this.data._bottom
      const to = this.properties.popup ? this.data._bottom : 0

      this.animate(
        '#popup',
        [
          {
            bottom: from + 'px',
            ease: 'ease-in-out',
          },
          {
            bottom: to + 'px',
            ease: 'ease-in-out',
          },
        ],
        200,
        () => {
          this.triggerEvent('popMove')
        },
      )
    },
    handleSwitchLinkPopup(e: { currentTarget: { dataset: { link: string } } }) {
      this.setData({
        linkType: e.currentTarget.dataset.link,
        showLinkPopup: true,
      })
    },
    handleTabTap(e: { currentTarget: { dataset: { tab: 'light' | 'switch' | 'curtain' } } }) {
      this.setData({
        tab: e.currentTarget.dataset.tab,
      })
    },
    handleBrightChange(e: { detail: number }) {
      this.setData({
        'lightInfo.brightness': e.detail,
      })
    },
    handleBrightDrag(e: { detail: { value: number } }) {
      this.setData({
        'lightInfo.brightness': e.detail.value,
      })
    },
    handleBrightDragEnd() {},
    handleColorTempChange(e: { detail: number }) {
      this.setData({
        'lightInfo.colorTemp': e.detail,
      })
    },
    handleColorTempDrag(e: { detail: { value: number } }) {
      this.setData({
        'lightInfo.colorTemp': e.detail.value,
      })
    },
    handleColorTempDragEnd() {},
    handleLinkPopupClose() {
      this.setData({
        showLinkPopup: false,
      })
    },
    handleLinkPopupConfirm(e: { detail: string[] }) {
      this.setData({
        showLinkPopup: false,
        linkList: e.detail,
      })
    },
  },
})
