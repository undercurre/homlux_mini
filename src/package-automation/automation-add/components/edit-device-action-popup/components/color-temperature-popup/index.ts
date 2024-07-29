import { ComponentWithComputed } from 'miniprogram-computed'
import { getColorTempText } from '../../../../../../utils/index'

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
            colorTemperature: this.data.value ?? 0,
            _colorTemperature: this.data.value ?? 0,
          })
        }
      },
    },
    option: {
      type: Object,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    colorTemperature: 0,
    //由于mz-slider组件不能修改原传入值，否则造成跳动，所以只能多做一个备份值
    _colorTemperature: 0,
  },

  computed: {
    colorTempShow(data) {
      const { maxColorTemp, minColorTemp } = data.option || {
        maxColorTemp: 6500,
        minColorTemp: 2700,
      }

      return getColorTempText({
        colorTemp: data._colorTemperature,
        maxColorTemp,
        minColorTemp,
      })
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
      this.triggerEvent('confirm', {
        value: this.data._colorTemperature,
      })
    },

    handleColorTempChange(e: { detail: number }) {
      this.setData({
        _colorTemperature: e.detail,
        colorTemperature: e.detail,
      })
    },
    handleColorTempDrag(e: { detail: number }) {
      this.setData({
        _colorTemperature: e.detail,
      })
    },
  },
})
