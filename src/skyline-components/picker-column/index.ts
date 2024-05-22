import { isObj } from '../common/validator'
import { range } from '../common/utils'
const DEFAULT_DURATION = 200
Component({
  externalClasses: ['active-class'],
  properties: {
    valueKey: String,
    className: String,
    itemHeight: Number,
    visibleItemCount: Number,
    initialOptions: {
      type: Array,
      value: [],
    },
    defaultIndex: {
      type: Number,
      value: 0,
      observer: function (value) {
        this.setIndex(value)
      },
    },
  },
  data: {
    startY: 0,
    offset: 0,
    duration: 0,
    startOffset: 0,
    options: [] as IAnyObject[],
    currentIndex: 0,
  },
  lifetimes: {
    attached() {
      const defaultIndex = this.data.defaultIndex
      const initialOptions = this.data.initialOptions
      this.setData(
        {
          currentIndex: defaultIndex,
          options: initialOptions,
        },
        () => {
          this.setIndex(defaultIndex)
        },
      )
    },
  },
  methods: {
    getCount: function () {
      return this.data.options.length
    },
    onTouchStart: function (event: WechatMiniprogram.TouchEvent) {
      this.setData({
        startY: event.touches[0].clientY,
        startOffset: this.data.offset,
        duration: 0,
      })
    },
    onTouchMove: function (event: WechatMiniprogram.TouchEvent) {
      const deltaY = event.touches[0].clientY - this.data.startY
      this.setData({
        offset: range(this.data.startOffset + deltaY, -(this.getCount() * this.data.itemHeight), this.data.itemHeight),
      })
    },
    onTouchEnd: function () {
      if (this.data.offset !== this.data.startOffset) {
        this.setData({ duration: DEFAULT_DURATION })
        const index = range(Math.round(-this.data.offset / this.data.itemHeight), 0, this.getCount() - 1)
        this.setIndex(index, true)
      }
    },
    onClickItem: function (event: { currentTarget: { dataset: { index: number } } }) {
      const index = event.currentTarget.dataset.index
      this.setIndex(index, true)
    },
    adjustIndex: function (index: number) {
      const count = this.getCount()
      index = range(index, 0, count)
      for (let i = index; i < count; i++) {
        if (!this.isDisabled(this.data.options[i])) return i
      }
      for (let i = index - 1; i >= 0; i--) {
        if (!this.isDisabled(this.data.options[i])) return i
      }
      return
    },
    isDisabled: function (option: unknown) {
      return isObj(option) && option.disabled
    },
    getOptionText: function (option: unknown) {
      return isObj(option) && this.data.valueKey in option ? option[this.data.valueKey] : option
    },
    setIndex: function (index: number, userAction?: boolean) {
      index = this.adjustIndex(index) || 0
      const offset = -index * this.data.itemHeight
      if (index !== this.data.currentIndex) {
        return this.setData({ offset: offset, currentIndex: index }, () => {
          userAction && this.triggerEvent('change', index)
        })
      }
      return this.setData({ offset: offset })
    },
    setValue: function (value: unknown) {
      for (let i = 0; i < this.data.options.length; i++) {
        if (this.getOptionText(this.data.options[i]) === value) {
          return this.setIndex(i)
        }
      }
      return Promise.resolve()
    },
    getValue: function () {
      return this.data.options[this.data.currentIndex]
    },
  },
})
