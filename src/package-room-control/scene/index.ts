import { behavior as computedBehavior } from 'miniprogram-computed'
import { mobxBehavior } from './behavior'
Page({
  behaviors: [mobxBehavior, computedBehavior],
  /**
   * 页面的初始数据
   */
  data: {},

  computed: {},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {},

  back() {
    wx.navigateBack()
  },
})
