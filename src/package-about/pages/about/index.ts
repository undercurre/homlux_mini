import pageBehavior from '../../../behaviors/pageBehaviors'
import { storage } from '../../../utils/index'
import meta from '../../../meta'
import { homluxOssUrl } from '../../../config/index'
import { wxOpenDocs } from '../../../apis/index'

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
        url: 'downloadFile/%E7%BE%8E%E7%9A%84%E7%85%A7%E6%98%8EHomlux%E9%9A%90%E7%A7%81%E5%8D%8F%E8%AE%AE.docx',
        value: 'privacyPolicy',
      },
      {
        title: '美的智能门锁隐私协议',
        url: 'downloadFile/%E7%BE%8E%E7%9A%84%E6%99%BA%E8%83%BD%E9%97%A8%E9%94%81%E9%9A%90%E7%A7%81%E5%8D%8F%E8%AE%AE.doc',
        value: 'privacyPolicy',
      },
      {
        title: '美的照明权限列表',
        url: 'downloadFile/%E5%B7%B2%E6%94%B6%E9%9B%86%E4%B8%AA%E4%BA%BA%E4%BF%A1%E6%81%AF%E6%B8%85%E5%8D%95-%E7%BE%8E%E7%9A%84%E7%85%A7%E6%98%8E.xlsx',
        value: 'authList',
      },
      {
        title: '软件许可及用户服务协议',
        url: 'downloadFile/%E5%B7%B2%E6%94%B6%E9%9B%86%E4%B8%AA%E4%BA%BA%E4%BF%A1%E6%81%AF%E6%B8%85%E5%8D%95-%E7%BE%8E%E7%9A%84%E7%85%A7%E6%98%8E.xlsx',
        value: 'userService',
      },
      {
        title: '已收集个人信息清单',
        url: 'downloadFile/%E5%B7%B2%E6%94%B6%E9%9B%86%E4%B8%AA%E4%BA%BA%E4%BF%A1%E6%81%AF%E6%B8%85%E5%8D%95-%E7%BE%8E%E7%9A%84%E7%85%A7%E6%98%8E.xlsx',
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
      const { url } = e.currentTarget.dataset

      wxOpenDocs(`${homluxOssUrl}/${url}`)

      // wx.navigateTo({
      //   url: '/package-about/pages/protocol-show/index?protocal=' + e.currentTarget.dataset.value,
      // })
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
