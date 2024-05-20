import pageBehavior from '../../../behaviors/pageBehaviors'
import { storage } from '../../../utils/index'
import meta from '../../../meta'

let isDebug = false
let debugTimeId = 0

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
    isDebug, // 状态缓存至小程序被销毁，通过isDebug外部变量缓存
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

    envVersion: 'release', // 当前小程序版本，体验版or 正式环境
    curEnv: 'prod', // 当前选择的云端环境
    version: '', // 生产环境版本号
    releaseTime: '', // 版本上传时间
  },

  lifetimes: {
    ready() {
      if (meta?.datetime) {
        this.setData({
          releaseTime: meta.datetime,
        })
      }
      const info = wx.getAccountInfoSync()

      this.setData({
        isDebug,
        envVersion: info.miniProgram.envVersion,
        curEnv: storage.get(`${info.miniProgram.envVersion}_env`) as string,
        version: info.miniProgram.version,
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    toTestUtil() {
      wx.navigateTo({
        url: '/package-debug/pages/test-util/index',
      })
    },

    touchVersionStart() {
      console.log('touchVersionStart')
      // 长按10s出现调试功能
      debugTimeId = setTimeout(() => {
        console.log('isDebug')
        isDebug = true
        this.setData({ isDebug })
        wx.showToast({ title: '已进入产测模式' })
      }, 5000)
    },

    touchVersionEnd() {
      console.log('touchVersionEnd')
      clearTimeout(debugTimeId)
    },

    handleTap(e: WechatMiniprogram.TouchEvent) {
      wx.navigateTo({
        url: '/package-about/pages/protocol-show/index?protocal=' + e.currentTarget.dataset.value,
      })
    },

    toDebugUtil() {
      wx.navigateTo({
        url: '/package-debug/pages/index/index',
      })
    },

    titlePress() {
      console.log('titlePress triggered, ver: ', this.data.version || this.data.releaseTime)
    },
  },
})
