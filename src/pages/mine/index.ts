import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { logout, storage, setCurrentEnv, Loggger } from '../../utils/index'
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
      about: '/package-protocol/protocol-list/index',
    },
    envVersion: 'release', // 当前小程序版本，体验版or 正式环境
    curEnv: 'prod', // 当前选择的云端环境
  },
  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      const info = wx.getAccountInfoSync()

      this.setData({
        envVersion: info.miniProgram.envVersion,
        curEnv: storage.get(`${info.miniProgram.envVersion}_env`) as string,
      })

      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1,
        })
      }
    },

    toPage(e: { currentTarget: { dataset: { url: string; auth: string } } }) {
      console.log('e.currentTarget.dataset', e.currentTarget)
      const { url, auth } = e.currentTarget.dataset
      // 如果用户已经登录，开始请求数据
      if (auth !== 'no' && !storage.get<string>('token')) {
        wx.navigateTo({
          url: '/pages/login/index',
        })
        return
      }

      wx.navigateTo({
        url: url,
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

    toggleEnv() {
      const envList = ['dev', 'sit', 'prod']
      wx.showActionSheet({
        itemList: envList,
        success: (res) => {
          console.log('showActionSheet', res)
          const env = envList[res.tapIndex] as 'dev' | 'sit' | 'prod'

          if (this.data.curEnv === env) {
            return
          }
          setCurrentEnv(env)

          wx.reLaunch({
            url: '/pages/index/index',
            complete(res) {
              Loggger.log('reLaunch', res)
            },
          })
        },
        fail(res) {
          console.log(res.errMsg)
        },
      })
    },
  },
})
