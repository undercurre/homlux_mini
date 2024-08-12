import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../../behaviors/pageBehaviors'

type StatusType = 'init' | 'generated'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    expired: 10,
    timerSetVal: 10, // picker设置值
    isShowPicker: false,
    pickerTitle: '密码有效期',
    pickerColumns: [
      {
        values: Array.from({ length: 30 }, (_, i) => i + 1),
        defaultIndex: 9,
      },
    ],
    status: 'init' as StatusType,
  },

  computed: {},

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {},

    onShow() {},

    showPicker() {
      this.setData({ isShowPicker: true })
    },
    handleClose() {
      this.setData({ isShowPicker: false })
    },
    handlePickerConfirm() {
      this.setData({
        isShowPicker: false,
        expired: this.data.timerSetVal,
      })
    },
    timeChange(e: { detail: { value: string[] } }) {
      const timerSetVal = Number(e.detail.value[0])
      this.setData({ timerSetVal })
    },
    generatePsw() {
      this.setData({ status: 'generated' })
    },
  },
})
