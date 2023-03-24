// pages/protocalList/index.ts
import pageBehavior from '../../behaviors/pageBehaviors'
Component({
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    list: [
      {
        title: '美的照明隐私协议',
        value: 'privacyPolicy',
      },
      {
        title: '美的照明权限列表',
        value: 'authList',
      },
      {
        title: '软件许可及用户服务协议',
        value: 'userService',
      },
      {
        title: '已收集个人信息清单',
        value: 'userInfoList',
      },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleTap(e: WechatMiniprogram.TouchEvent) {
      wx.navigateTo({
        url: '/package-protocol/protocol-show/index?protocal=' + e.currentTarget.dataset.value,
      })
    },
  },
})
