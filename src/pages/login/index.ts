import { login } from '../../apis/index'
import { homeStore, othersStore, userStore } from '../../store/index'
import { storage } from '../../utils/storage'
import Toast from '@vant/weapp/toast/toast'
import pageBehavior from '../../behaviors/pageBehaviors'

// pages/login/index.ts
Component({
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

    handleLoginTap() {
      if (!this.data.isAgree) {
        Toast('请同意协议')
        return
      }
    },

    handleLoginClick(e: { detail: { code: string } }) {
      if (!e.detail.code) {
        Toast('取消登录')
        return
      }
      wx.login({
        success: (res) => {
          console.log('login', res, e)
          if (res.code) {
            wx.getFuzzyLocation({
              type: 'wgs84',
              success: (loc) => {
                console.log('getFuzzyLocation', loc)
                this.login({
                  jsCode: res.code,
                  code: e.detail.code,
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                })
              },
              fail: (msg) => {
                console.log(msg)
                // if (msg.errMsg.indexOf('deny') !== -1) {
                //   Toast('地理位置访问失败，请手动设置\n系统访问地理位置的权限')
                // }
                this.login({
                  jsCode: res.code,
                  code: e.detail.code,
                })
              },
            })
          } else {
            Toast('登录失败！')
            console.log('登录失败！' + res.errMsg)
          }
        },
      })
    },

    async login(data: { jsCode: string; code: string; latitude?: number; longitude?: number }) {
      const loginRes = await login(data)
      if (loginRes.success && loginRes.result) {
        console.log('loginRes', loginRes)
        storage.set('token', loginRes.result.token, null)

        await userStore.updateUserInfo()
        userStore.setIsLogin(true)
        othersStore.setIsInit(false)
        homeStore.homeInit()
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
        url: '/package-protocol/protocol-show/index?protocal=' + e.currentTarget.dataset.value,
      })
    },
  },
})
