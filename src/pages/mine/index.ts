import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { logout, storage, strUtil } from '../../utils/index'
import { userBinding, userStore, homeBinding, homeStore } from '../../store/index'
import { defaultImgDir } from '../../config/index'
import pageBehavior from '../../behaviors/pageBehaviors'

Component({
  options: {
    pureDataPattern: /^_/,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [userBinding, homeBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
    managerList: [
      {
        icon: '/assets/img/mine/home.png',
        text: '家庭管理',
        url: '/package-mine/home-manage/index',
      },
      {
        icon: '/assets/img/mine/device.png',
        text: '设备管理',
        url: '/package-mine/device-manage/index',
      },
      {
        icon: '/assets/img/mine/member.png',
        text: '成员管理',
        url: '/package-mine/pages/member-manage/index',
      },
    ],
    urls: {
      homeControl: '/package-mine/home-manage/index',
      automation: '/package-automation/automation/index',
      voiceControl: '/package-mine/voice-control/index',
      auth: '/package-auth/pages/index/index',
      deviceReplace: '/package-mine/device-replace/index',
      feedback: '/package-mine/feedback/index',
      help: '/package-mine/help/list/index',
      about: '/package-about/pages/about/index',
      deviceCategory: '/package-mine/device-category/index',
      setting: '/package-mine/pages/setting/index',
      lab: '/package-lab/pages/index/index',
    },
    userInfo: {},
    isLogin: false,
    isManager: false,
  },
  pageLifetimes: {
    show() {
      this.setData({
        userInfo: userStore.userInfo,
        isLogin: userStore.isLogin,
        isManager: homeStore.isManager,
      })
    },
  },
  methods: {
    toPage(e: { currentTarget: { dataset: { url: string; auth: string; param: string } } }) {
      const { url, auth, param } = e.currentTarget.dataset
      console.log('[toPage]', { url, auth, param })
      // 如果用户已经登录，开始请求数据
      if (auth !== 'no' && !storage.get<string>('token')) {
        wx.navigateTo({
          url: '/pages/login/index',
        })
        return
      }
      wx.navigateTo({
        url: strUtil.getUrlWithParams(url, param === undefined ? {} : { param }),
      })
    },

    async loginOut() {
      const res = await wx.showModal({
        content: '确认退出登录？',
        confirmColor: '#27282A',
        cancelColor: '#27282A',
      })

      if (res.cancel) return

      logout()
    },

    /** 如果没登陆，点击头像去登录 */
    handleUserInfoTap() {
      if (!userStore.isLogin) {
        wx.navigateTo({
          url: '/pages/login/index',
        })
      }
    },
  },
})
