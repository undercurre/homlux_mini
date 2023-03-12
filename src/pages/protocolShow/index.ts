import { storage } from '../../utils/index'
import { userServiceProtocol, privacyPolicy } from './protocolDoc'
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
          title: '用户隐私协议',
          doc: privacyPolicy,
        })
      } else if (e.protocal === 'userService') {
        this.setData({
          title: '用户服务协议',
          doc: userServiceProtocol,
        })
      }
    },
  },
})
