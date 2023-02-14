import Dialog from '@vant/weapp/dialog/dialog'
import { logout } from '../../utils/index'

Component({
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
      voiceControl: '/package-mine/voice-control/index',
      ota: '/package-mine/ota/index',
      deviceReplace: '/package-mine/device-replace/index',
      feedback: '/package-mine/feedback/index',
      about: '/package-mine/about/index',
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
      const res = await Dialog.confirm({
        message: '确认退出登录？',
      }).catch(() => {
        // on cancel
        return 'cancel'
      })

      if (res === 'cancel') return

      logout()
    },
  },
})
