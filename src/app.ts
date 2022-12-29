// app.js
import { setNavigationBarHeight } from './utils/index'
import { global } from './store/global'

type require = (url: string, cb: (module: IAnyObject) => void) => void

App<IAppOption>({
  onLaunch() {
    // 加载svg，这里不能使用import进行导入，使用import导入会导致报错
    const req = require as require
    req('./assets/svg/svgs.js', (module) => {
      this.globalData.svgs = module.default
      global.setIsLoadSvg()
    })

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
