// app.js
import { setNavigationBarHeight } from './utils/index'
App<IAppOption>({
  onLaunch() {
    // 获取状态栏和顶部栏高度
    setNavigationBarHeight()

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: (res) => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log(res)
      },
    })
  },
  globalData: {},
})
