import { storage } from '../../utils/index'
import { userService, privacyPolicy, userInfoList, authList } from './protocolDoc'
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
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    doc: '',
    title: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onLoad(e: { protocal: string }) {
      console.log(e)
      if (e.protocal === 'privacyPolicy') {
        this.setData({
          title: '美的照明隐私协议',
          doc: privacyPolicy,
        })
      } else if (e.protocal === 'userService') {
        this.setData({
          title: '软件许可及用户服务协议',
          doc: userService,
        })
      } else if (e.protocal === 'userInfoList') {
        this.setData({
          title: '已收集个人信息清单',
          doc: userInfoList,
        })
      } else if (e.protocal === 'authList') {
        this.setData({
          title: '美的照明权限列表',
          doc: authList,
        })
      }
    },
  },
})
