import Toast from '../../skyline-components/mz-toast/toast'
import { login } from '../../apis/index'
import { homeStore, othersStore, sceneStore, userStore } from '../../store/index'
import { storage, showLoading, hideLoading, Logger } from '../../utils/index'
import pageBehavior from '../../behaviors/pageBehaviors'

// pages/login/index.ts
Component({
  options: {
    pureDataPattern: /^_/,
  },
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    isAgree: false,
    checkImg: '/assets/img/base/check.png',
    uncheckImg: '/assets/img/base/uncheck.png',
    marginTop: 0,
  },

  methods: {
    onLoad() {
      const navigationBarAndStatusBarHeight =
        (storage.get<number>('statusBarHeight') as number) + (storage.get<number>('navigationBarHeight') as number)
      this.setData({
        marginTop: 200 - navigationBarAndStatusBarHeight,
      })
    },

    async handleLoginTap() {
      if (!this.data.isAgree) {
        Toast('请同意协议')
        return
      }
    },

    handleLoginClick(e: { detail: { code: string } & { detail: { code: string } } }) {
      console.log('handleLoginClick', e)
      const code = e.detail.code || e.detail.detail.code // 微信bug，兼容skyline模式，返回的detail数据结构不一致

      if (!code) {
        Toast('取消登录')
        return
      }

      showLoading()

      wx.login({
        success: (res) => {
          console.log('login', res, e)
          if (res.code) {
            wx.getFuzzyLocation({
              type: 'wgs84',
              complete: async (locationRes: IAnyObject) => {
                console.log('getFuzzyLocation-complete', locationRes)
                const params = {
                  jsCode: res.code,
                  code: code,
                }

                if (!locationRes.errno) {
                  Object.assign(params, { lat: locationRes.latitude, lon: locationRes.longitude })
                }

                await this.login(params)

                hideLoading()
              },
            })
          } else {
            Toast('登录失败！')
            console.log('登录失败！' + res.errMsg)
            hideLoading()
          }
        },
        fail(err) {
          Logger.error('wx.login-error', err)
          hideLoading()
        },
      })
    },

    async login(data: { jsCode: string; code: string; lat?: number; lon?: number }) {
      const loginRes = await login(data)
      if (loginRes.success && loginRes.result) {
        Logger.log('loginRes', loginRes)
        storage.set('token', loginRes.result.token, null)
        userStore.openId = loginRes.result.openId

        await userStore.updateUserInfo()
        userStore.setIsLogin(true)
        othersStore.setIsInit(false)
        homeStore.homeInit()
        sceneStore.updateAllRoomSceneList()

        wx.switchTab({
          url: '/pages/index/index',
        })
      } else {
        Toast('登录失败！')
      }
    },

    onAgreeClick(event: { detail: boolean }) {
      console.log('onAgreeClick', event)

      this.setData({
        isAgree: event.detail,
      })
    },

    toPage(e: WechatMiniprogram.TouchEvent) {
      wx.navigateTo({
        url: '/package-about/pages/protocol-show/index?protocal=' + e.currentTarget.dataset.value,
      })
    },
  },
})
