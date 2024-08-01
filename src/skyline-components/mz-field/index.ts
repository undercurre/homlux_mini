import { commonProps, inputProps, textareaProps } from './props'
import { InputDetails } from './types'

Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
  },
  externalClasses: ['input-class', 'right-icon-class', 'label-class', 'custom-class'],
  /**
   * 组件的属性列表
   */
  properties: {
    ...commonProps,
    ...inputProps,
    ...textareaProps,
    size: String,
    icon: String,
    label: String,
    error: Boolean,
    center: Boolean,
    isLink: Boolean,
    leftIcon: String,
    rightIcon: String,
    autosize: null,
    required: Boolean,
    iconClass: String,
    clickable: Boolean,
    inputAlign: String,
    customStyle: String,
    errorMessage: String,
    arrowDirection: String,
    showWordLimit: Boolean,
    errorMessageAlign: String,
    readonly: {
      type: Boolean,
    },
    clearable: {
      type: Boolean,
    },
    clearTrigger: {
      type: String,
      value: 'focus',
    },
    border: {
      type: Boolean,
      value: true,
    },
    clearIcon: {
      type: String,
      value: 'clear',
    },
    extraEventParams: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    focused: false,
    innerValue: '',
    showClear: false,
  },

  observers: {
    value: function (value) {
      if (value !== this.data.innerValue) {
        this.setData({ innerValue: value })
      }
    },

    'readonly, clearable': function () {
      this.setShowClear()
    },
  },

  lifetimes: {
    ready() {
      // @ts-ignore
      this.setData({ innerValue: this.data.value as string })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    formatValue(value: string) {
      // @ts-ignore
      const { maxlength } = this.data

      if (maxlength !== -1 && value.length > maxlength) {
        return value.slice(0, maxlength)
      }

      return value
    },

    onInput(event: WechatMiniprogram.Input | WechatMiniprogram.TextareaInput) {
      const { value = '' } = event.detail || {}

      const formatValue = this.formatValue(value)

      this.setShowClear()

      return this.emitChange({
        ...event.detail,
        value: formatValue,
      })
    },

    onFocus(event: WechatMiniprogram.InputFocus | WechatMiniprogram.TextareaFocus) {
      this.data.focused = true
      this.setShowClear()
      this.triggerEvent('focus', event.detail)
    },

    onBlur(event: WechatMiniprogram.InputBlur | WechatMiniprogram.TextareaBlur) {
      this.data.focused = false
      this.setShowClear()
      this.triggerEvent('blur', event.detail)
    },

    onClickIcon() {
      this.triggerEvent('click-icon')
    },

    onClickInput(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('click-input', event.detail)
    },

    refocus() {
      // IOS必须先置为false再变true才生效
      // @ts-ignore
      this.data.focus = false

      setTimeout(() => {
        this.setData({
          focus: true,
        })
      }, 600)
    },

    onClear() {
      this.setData({ innerValue: '' })
      this.setShowClear()
      this.refocus() // 重新聚焦，解决点击清空按钮后键盘自动收起，失焦的问题

      wx.nextTick(() => {
        this.emitChange({ value: '' })
        this.triggerEvent('clear', '')
      })
    },

    onConfirm(event: WechatMiniprogram.InputConfirm | WechatMiniprogram.TextareaConfirm) {
      const { value = '' } = event.detail || {}
      this.setShowClear()
      this.triggerEvent('confirm', value)
    },

    setValue(value: string) {
      this.setShowClear()

      if (value === '') {
        this.setData({ innerValue: '' })
      }

      this.emitChange({ value })
    },

    onLineChange(event: WechatMiniprogram.TextareaLineChange) {
      this.triggerEvent('linechange', event.detail)
    },

    onKeyboardHeightChange(
      event: WechatMiniprogram.InputKeyboardHeightChange | WechatMiniprogram.TextareaKeyboardHeightChange,
    ) {
      this.triggerEvent('keyboardheightchange', event.detail)
    },

    emitChange(detail: InputDetails) {
      const { extraEventParams } = this.data

      this.setData({ value: detail.value })

      let result: InputDetails | undefined

      const data = extraEventParams
        ? {
            ...detail,
            callback: (data: InputDetails) => {
              result = data
            },
          }
        : detail.value

      this.triggerEvent('input', data)
      this.triggerEvent('change', data)

      return result
    },

    setShowClear() {
      // @ts-ignore
      const { clearable, readonly, clearTrigger, focused, innerValue } = this.data

      let showClear = false

      if (clearable && !readonly) {
        const hasValue = !!innerValue
        const trigger = clearTrigger === 'always' || (clearTrigger === 'focus' && focused)

        showClear = hasValue && trigger
      }

      this.setData({ showClear })
    },

    noop() {},
  },
})
