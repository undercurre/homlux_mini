const DRAG_STATUS = {
  START: 'start',
  MOVING: 'moving',
  END: 'end',
}

Component({
  externalClasses: ['custom-class'],
  options: {
    multipleSlots: true,
  },
  /**
   * 组件的属性列表
   */
  properties: {
    disabled: Boolean,
    useButtonSlot: Boolean,
    activeColor: String,
    inactiveColor: String,
    max: {
      type: Number,
      value: 100,
    },
    min: {
      type: Number,
      value: 0,
    },
    step: {
      type: Number,
      value: 1,
    },
    value: {
      type: Number,
      value: 0,
      observer(val) {
        if (val) {
          this.updateValue(val)
        }
      },
    },
    barWidth: {
      type: Number,
      value: 622,
    },
    barHeight: {
      type: Number,
      value: 80,
    },
    buttonLeft: {
      type: Number,
      value: 18,
    }, //按钮左边到slider-bar的距离rpx
  },

  /**
   * 组件的初始数据
   */
  data: {
    dragStatus: '',
    deltaX: 0,
    deltaY: 0,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    startValue: 0,
    newValue: 0,
  },

  lifetimes: {
    attached() {},
    ready() {
      this.updateValue(this.data.value)
    },
    detached() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    getRect(
      context: WechatMiniprogram.Component.TrivialInstance | WechatMiniprogram.Page.TrivialInstance,
      selector: string,
    ) {
      return new Promise((resolve: (value: { top: number; left: number; height: number; width: number }) => void) => {
        wx.createSelectorQuery()
          .in(context)
          .select(selector)
          .boundingClientRect()
          .exec((rect = []) => resolve(rect[0]))
      })
    },
    resetTouchStatus() {
      this.setData({
        deltaX: 0,
        deltaY: 0,
        offsetX: 0,
        offsetY: 0,
      })
    },
    touchStart(event: { touches: { clientX: number; clientY: number }[] }) {
      this.resetTouchStatus()
      const touch = event.touches[0]
      this.setData({
        startX: touch.clientX,
        startY: touch.clientY,
      })
    },
    touchMove(event: { touches: { clientX: number; clientY: number }[] }) {
      const touch = event.touches[0]
      this.setData({
        deltaX: touch.clientX - this.data.startX,
        deltaY: touch.clientY - this.data.startY,
        offsetX: Math.abs(this.data.deltaX),
        offsetY: Math.abs(this.data.deltaY),
      })
    },
    onTouchStart(event: { touches: { clientX: number; clientY: number }[] }) {
      if (this.data.disabled) return

      this.touchStart(event)
      this.setData({
        startValue: this.format(this.data.value),
        newValue: this.data.value,
      })
      this.setData({
        startValue: this.format(this.data.newValue),
        dragStatus: DRAG_STATUS.START,
      })
    },
    onTouchMove(event: { touches: { clientX: number; clientY: number }[] }) {
      if (this.data.disabled) return
      if (this.data.dragStatus === DRAG_STATUS.START) {
        this.triggerEvent('drag-start')
      }
      this.touchMove(event)
      this.setData({
        dragStatus: DRAG_STATUS.MOVING,
      })
      this.getRect(this, '.mz-slider').then((rect: { height: number; width: number }) => {
        const delta = this.data.deltaX
        const total = rect.width
        const diff = (delta / total) * this.getRange()
        this.setData({ newValue: this.data.startValue + diff })

        this.updateValue(this.data.newValue, false, true)
      })
    },
    onTouchEnd() {
      if (this.data.disabled) return
      if (this.data.dragStatus === DRAG_STATUS.MOVING) {
        this.setData({
          dragStatus: DRAG_STATUS.END,
        })
        wx.nextTick(() => {
          this.updateValue(this.data.newValue, true)
          this.triggerEvent('drag-end')
        })
      }
    },
    onClick(event: { touches: { clientX: number }[] }) {
      if (this.data.disabled) return
      const { min } = this.data
      this.getRect(this, '.mz-slider').then((rect: { top: number; left: number; height: number; width: number }) => {
        const touch = event.touches[0]
        const delta = touch.clientX - rect.left
        const total = rect.width
        const value = Number(min) + (delta / total) * this.getRange()

        this.updateValue(value, true)
      })
    },
    updateValue(value: number, end?: boolean, drag?: boolean) {
      value = this.format(value)
      this.setData({ value: value })

      this.setData({
        wrapperStyle: `
    background: ${this.data.inactiveColor || ''};
    width:${this.data.barWidth}rpx
  `,
        barStyle: `
    width: ${this.calcMainAxis()};
    left: 0;
    top: 0;
    background: ${this.data.activeColor || ''};
    ${drag ? 'transition: none;' : ''}
  `,
      })
      if (drag) {
        this.triggerEvent('drag', { value })
      }
      if (end) {
        this.triggerEvent('change', value)
      }
      if (drag || end) {
        this.setData({ value })
      }
    },
    getRange() {
      const { max, min } = this.data
      return max - min
    },
    /**
     * 计算选中条的长度百分比
     * @param current 当前值value
     * @returns
     */
    calcMainAxis() {
      const { barWidth, buttonLeft, value } = this.data
      // 避免最小值小于最小step时出现负数情况
      return `${Math.max((buttonLeft / barWidth) * 100 + value * (1 - buttonLeft / barWidth), 0)}%`
    },
    format(value: number) {
      const { max, min, step } = this.data
      return Math.round(Math.max(min, Math.min(value, max)) / step) * step
    },
  },
})
