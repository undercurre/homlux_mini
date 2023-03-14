import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { logout } from '../../utils/index'
import { userBinding, userStore } from '../../store/index'

Component({
  behaviors: [BehaviorWithStore({ storeBindings: [userBinding] })],
  /**
   * 页面的初始数据
   */
  data: {
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
        url: '/package-mine/member-manage/index',
      },
    ],
    urls: {
      homeControl: '/package-mine/home-manage/index',
      voiceControl: '/package-mine/voice-control/index',
      ota: '/package-mine/ota/index',
      deviceReplace: '/package-mine/device-replace/index',
      feedback: '/package-mine/feedback/index',
      about: '/pages/protocolList/index',
    },
  },
  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1,
        })
      }
    },

    toPage(e: { currentTarget: { dataset: { url: string } } }) {
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
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
    handleUserInfoTap() {
      if (!userStore.isLogin) {
        wx.navigateTo({
          url: '/pages/login/index',
        })
      }
    },
  },
})
