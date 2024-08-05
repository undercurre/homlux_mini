import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../../behaviors/pageBehaviors'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {},

  computed: {},

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {},

    onShow() {},
  },
})
