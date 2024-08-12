import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../../behaviors/pageBehaviors'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    typeList: [
      { name: '密码', amount: 0 },
      { name: '指纹', amount: 20 },
      { name: '人脸', amount: 0 },
      { name: '门卡', amount: 0 },
    ],
  },

  computed: {
    typeTabs(data) {
      return data.typeList.map((item, index) => ({
        title: `${item.name}·${item.amount}`,
        id: index + 1,
      }))
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {},

    onShow() {},
  },
})
