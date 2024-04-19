import { isDef } from '../common/validator'
import { requestAnimationFrame, nextTick, groupSetData, getAllRect, getRect } from '../common/utils'
import touchBehavior from '../behaviors/touch'

Component({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
    multipleSlots: true,
  },
  behaviors: [touchBehavior],

  externalClasses: ['nav-class', 'tab-class', 'tab-active-class', 'line-class', 'wrap-class'],
  relations: {
    '../mz-tab/index': {
      type: 'descendant',
      linked: function () {
        this.updateTabs()
      },
      linkChanged: function () {
        this.updateTabs()
      },
      unlinked: function () {
        this.updateTabs()
      },
    },
  },
  properties: {
    sticky: Boolean,
    border: Boolean,
    swipeable: Boolean,
    titleActiveColor: String,
    titleInactiveColor: String,
    color: String,
    animated: {
      type: Boolean,
      observer: function () {
        this.data._children.forEach((child, index) => {
          return child.updateRender(index === this.data.currentIndex, this)
        })
      },
    },
    lineWidth: {
      type: null,
      value: 40,
      observer: 'resize',
    },
    lineHeight: {
      type: null,
      value: -1,
    },
    active: {
      type: null,
      value: 0,
      observer: function (name) {
        if (name !== this.getCurrentName()) {
          this.setCurrentIndexByName(name)
        }
      },
    },
    type: {
      type: String,
      value: 'line',
    },
    ellipsis: {
      type: Boolean,
      value: true,
    },
    duration: {
      type: Number,
      value: 0.3,
    },
    zIndex: {
      type: Number,
      value: 1,
    },
    swipeThreshold: {
      type: Number,
      value: 5,
      observer: function (value) {
        this.setData({
          scrollable: this.data._children.length > value || !this.data.ellipsis,
        })
      },
    },
    offsetTop: {
      type: Number,
      value: 0,
    },
    lazyRender: {
      type: Boolean,
      value: true,
    },
    useBeforeChange: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    //纯数据字段
    tabsLength: 0,
    _swiping: false,
    _children: [] as WechatMiniprogram.Component.TrivialInstance[],
    tabs: [] as IAnyObject,
    scrollLeft: 0,
    scrollable: false,
    currentIndex: 0,
    container: null as null | (() => unknown),
    skipTransition: true,
    scrollWithAnimation: false,
    lineOffsetLeft: 0,
    inited: false,
  },

  lifetimes: {
    attached: function () {
      Object.defineProperty(this.data, '_children', {
        get: () => {
          return this.getRelationNodes('../mz-tab/index') || []
        },
      })
    },
    ready: function () {
      requestAnimationFrame(() => {
        this.data._swiping = true
        this.setData({
          container: function () {
            return this.createSelectorQuery().select('.mz-tabs')
          },
        })
        this.resize()
        this.scrollIntoView()
      })
    },
  },

  methods: {
    updateTabs: function () {
      const children = this.data._children === void 0 ? [] : this.data._children
      this.setData(
        {
          tabs: children.map(function (child) {
            return child.data
          }),
          scrollable: this.data._children.length > this.data.swipeThreshold || !this.data.ellipsis,
        },
        () => {
          this.setData({
            tabsLength: this.data.tabs.length,
          })
        },
      )
      this.setCurrentIndexByName(this.data.active || this.getCurrentName())
    },
    trigger: function (eventName: string, child?: WechatMiniprogram.Component.TrivialInstance) {
      const currentIndex = this.data.currentIndex
      const data = this.getChildData(currentIndex, child)
      if (!isDef(data)) {
        return
      }
      this.triggerEvent(eventName, data)
    },
    onTap: function (event: { currentTarget: { dataset: { index: number } } }) {
      const index = event.currentTarget.dataset.index
      const child = this.data._children[index]
      if (child.data.disabled) {
        this.trigger('disabled', child)
        return
      }
      this.onBeforeChange(index).then(() => {
        this.setCurrentIndex(index)
        nextTick(() => {
          this.trigger('click')
        })
      })
    },
    // correct the index of active tab
    setCurrentIndexByName: function (name: string) {
      const children = this.data._children === void 0 ? [] : this.data._children
      const matched = children.filter(function (child) {
        return child.getComputedName() === name
      })
      if (matched.length) {
        this.setCurrentIndex(matched[0].data._index)
      }
    },
    setCurrentIndex: function (currentIndex: number) {
      const { data } = this
      const children = this.data._children === void 0 ? [] : this.data._children
      if (!isDef(currentIndex) || currentIndex >= children.length || currentIndex < 0) {
        return
      }
      groupSetData(this, () => {
        children.forEach((item, index) => {
          const active = index === currentIndex
          if (active !== item.data.active || !item.data._inited) {
            item.updateRender(active, this)
          }
        })
      })
      if (currentIndex === data.currentIndex) {
        if (!data.inited) {
          this.resize()
        }
        return
      }
      const shouldEmitChange = data.currentIndex !== null
      this.setData({ currentIndex: currentIndex })
      requestAnimationFrame(() => {
        this.resize()
        this.scrollIntoView()
      })
      nextTick(() => {
        this.trigger('input')
        if (shouldEmitChange) {
          this.trigger('change')
        }
      })
    },
    getCurrentName: function () {
      const children = this.data._children === void 0 ? [] : this.data._children
      const activeTab = children[this.data.currentIndex]

      if (activeTab) {
        return activeTab.getComputedName()
      }
    },
    resize: function () {
      if (this.data.type !== 'line') {
        return
      }
      const currentIndex = this.data.currentIndex
      const ellipsis = this.data.ellipsis
      const skipTransition = this.data.skipTransition
      Promise.all([getAllRect(this, '.mz-tab'), getRect(this, '.mz-tabs__line')]).then((_a: IAnyObject) => {
        const _b = _a[0]
        const rects = _b === void 0 ? [] : _b
        const lineRect = _a[1]
        const rect = rects[currentIndex]
        if (rect == null) {
          return
        }

        let lineOffsetLeft = rects.slice(0, currentIndex).reduce((prev: number, curr: { width: number }) => {
          return prev + curr.width
        }, 0)
        lineOffsetLeft += (rect.width - lineRect.width) / 2 + (ellipsis ? 0 : 8)
        this.setData({ lineOffsetLeft: lineOffsetLeft, inited: true })
        this.data._swiping = true
        if (skipTransition) {
          // waiting transition end
          setTimeout(() => {
            this.setData({ skipTransition: false })
          }, this.data.duration)
        }
      })
    },
    // scroll active tab into view
    scrollIntoView: function () {
      const currentIndex = this.data.currentIndex
      const scrollable = this.data.scrollable
      const scrollWithAnimation = this.data.scrollWithAnimation
      if (!scrollable) {
        return
      }
      Promise.all([getAllRect(this, '.mz-tab'), getRect(this, '.mz-tabs__nav')]).then((_a: IAnyObject) => {
        const tabRects = _a[0],
          navRect = _a[1]
        const offsetLeft = tabRects.slice(0, currentIndex).reduce((prev: number, curr: { width: number }) => {
          return prev + curr.width
        }, 0)
        this.setData({
          scrollLeft: offsetLeft - navRect.width / 2 <= 0 ? 0 : offsetLeft - navRect.width / 2,
          currentIndex,
        })
        if (!scrollWithAnimation) {
          nextTick(() => {
            this.setData({ scrollWithAnimation: true })
          })
        }
      })
    },
    onTouchScroll: function (event: { detail: IAnyObject }) {
      this.triggerEvent('scroll', event.detail)
    },
    onTouchStart: function (event: WechatMiniprogram.TouchEvent) {
      if (!this.data.swipeable) return
      this.data._swiping = true
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.touchStart(event)
    },
    onTouchMove: function (event: WechatMiniprogram.TouchEvent) {
      if (!this.data.swipeable || !this.data._swiping) return
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.touchMove(event)
    },
    // watch swipe touch end
    onTouchEnd: function () {
      if (!this.data.swipeable || !this.data._swiping) return
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const direction = this.data.direction
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const deltaX = this.data.deltaX
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const offsetX = this.data.offsetX
      const minSwipeDistance = 50
      if (direction === 'horizontal' && offsetX >= minSwipeDistance) {
        const index_1 = this.getAvaiableTab(deltaX)
        if (index_1 !== -1) {
          this.onBeforeChange(index_1).then(() => {
            return this.setCurrentIndex(index_1)
          })
        }
      }
      this.data._swiping = false
    },
    getAvaiableTab: function (direction: number) {
      const tabs = this.data.tabs
      const currentIndex = this.data.currentIndex
      const step = direction > 0 ? -1 : 1
      for (let i = step; currentIndex + i < tabs.length && currentIndex + i >= 0; i += step) {
        const index = currentIndex + i
        if (index >= 0 && index < tabs.length && tabs[index] && !tabs[index].disabled) {
          return index
        }
      }
      return -1
    },
    onBeforeChange: function (index: number) {
      const useBeforeChange = this.data.useBeforeChange
      if (!useBeforeChange) {
        return Promise.resolve()
      }
      return new Promise<void>((resolve, reject) => {
        this.triggerEvent(
          'before-change',
          Object.assign({}, this.getChildData(index), {
            callback: (status: boolean) => {
              return status ? resolve() : reject()
            },
          }),
        )
      })
    },
    getChildData: function (index: number | number, child?: WechatMiniprogram.Component.TrivialInstance) {
      const currentChild = child || this.data._children[index]
      if (!isDef(currentChild)) {
        return
      }
      return {
        index: currentChild.data._index,
        name: currentChild.getComputedName(),
        title: currentChild.data.title,
      }
    },
  },
})
