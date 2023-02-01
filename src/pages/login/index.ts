import { login } from '../../apis/index'
import { storage } from '../../utils/storage'

// pages/login/index.ts
Component({
  /**
   * 页面的初始数据
   */
  data: {
    isAgree: false,
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
      const loginRes = await login(data)
      if (loginRes.success && loginRes.result) {
        // 保证下面的res不会出现undefined
        const res = loginRes.result
        // 批量缓存返回值
        ;(['token', 'mobilePhone', 'nickName', 'headImageUrl'] as const).forEach((item) => {
          // 同样去除undefined
          const value = res[item]
          if (value) {
            storage.set(item, value, null)
          }
        })
        console.log('去首页')
        wx.switchTab({
          url: '/pages/index/index',
        })
      }
    },

    onAgreeClick(event: { detail: boolean }) {
      this.setData({
        isAgree: event.detail,
      })
    },
  },
})
