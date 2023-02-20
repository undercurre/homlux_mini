import { login } from '../../apis/index'
import { homeStore } from '../../store/index'
import { storage } from '../../utils/storage'

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
        wx.showToast({
          title: '请同意协议',
          icon: 'none',
        })
        return
      }
    },

    onLoginClick(e: { detail: { code: string } }) {
      wx.login({
        success: (res) => {
          console.log('login', res, e)
          if (res.code) {
            this.handleLogin({
              jsCode: res.code,
              code: e.detail.code,
            })
          } else {
            console.log('登录失败！' + res.errMsg)
          }
        },
      })
    },

    async handleLogin(data: { jsCode: string; code: string }) {
      console.log('handleLogin', data)
      const loginRes = await login(data)
      if (loginRes.success && loginRes.result) {
        // 批量缓存返回值
        ;(['token', 'mobilePhone', 'nickName', 'headImageUrl'] as const).forEach((item) => {
          const value = (loginRes.result as User.UserLoginRes)[item]
          if (value) {
            // storage.set(item, 'f9992117fd284789bb96bd20b4782988', null)
            storage.set(item, value, null)
          }
        })
        homeStore.updateHomeInfo()
        wx.switchTab({
          url: '/pages/index/index',
        })

        homeStore.updateHomeInfo()
      }
    },

    onAgreeClick(event: { detail: boolean }) {
      console.log('onAgreeClick', event)

      this.setData({
        isAgree: event.detail,
      })
    },
  },
})
