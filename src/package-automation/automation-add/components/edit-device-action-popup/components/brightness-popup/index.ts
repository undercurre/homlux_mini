import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
    },
    value: {
      type: Number,
    },
    show: {
      type: Boolean,
      observer(value) {
        if (value) {
          this.setData({
            brightness: this.data.value ?? 1,
            _brightness: this.data.value ?? 1,
          })
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    brightness: 1,
    //由于mz-slider组件不能修改原传入值，否则造成跳动，所以只能多做一个备份值
    _brightness: 1,
  },

  computed: {
    levelShow(data) {
      return data._brightness
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm', { value: this.data._brightness })
    },

    handleLevelDrag(e: { detail: number }) {
      this.setData({
        _brightness: e.detail,
      })
    },
    handleLevelChange(e: { detail: number }) {
      this.setData({
        _brightness: e.detail,
        brightness: e.detail,
      })
    },
  },
})
