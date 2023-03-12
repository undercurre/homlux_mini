import { login } from '../../apis/index'
import { homeStore } from '../../store/index'
import { loadUserInfo } from '../../utils/index'
import { storage } from '../../utils/storage'
import Toast from '@vant/weapp/toast/toast'

// pages/login/index.ts
Component({
  /**
   * 页面的初始数据
   */
  data: {
    isAgree: false,
    checkImg: '/assets/img/base/check.png',
    uncheckImg: '/assets/img/base/uncheck.png',
  },

  methods: {
    onLoginTap() {
      if (!this.data.isAgree) {
        Toast('请同意协议')
        return
      }
    },

    onLoginClick(e: { detail: { code: string } }) {
      if (!e.detail.code) {
        Toast('取消登录')
        return
      }
      wx.login({
        success: (res) => {
          console.log('login', res, e)
          if (res.code) {
            this.handleLogin({
              jsCode: res.code,
              code: e.detail.code,
            })
          } else {
            Toast('登录失败！')
            console.log('登录失败！' + res.errMsg)
          }
        },
      })
    },

    async handleLogin(data: { jsCode: string; code: string }) {
      const loginRes = await login(data)
      if (loginRes.success && loginRes.result) {
        console.log('loginRes', loginRes)
        // 批量缓存返回值
        ;(['token', 'mobilePhone', 'nickName', 'headImageUrl'] as const).forEach((item) => {
          const value = (loginRes.result as User.UserLoginRes)[item]
          if (value) {
            // storage.set(item, 'f9992117fd284789bb96bd20b4782988', null)
            storage.set(item, value, null)
          }
        })
        loadUserInfo()
        await homeStore.updateHomeInfo()
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

    handlePrivacyPolicyTap() {
      wx.navigateTo({
        url: '/pages/protocolShow/index?protocal=privacyPolicy'
      })
    },
    handleUserServicePolicyTap() {
      wx.navigateTo({
        url: '/pages/protocolShow/index?protocal=userService'
      })
    }
  },
})
