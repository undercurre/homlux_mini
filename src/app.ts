// app.js
import { setNavigationBarHeight, storage, emitter } from './utils/index'
import { others } from './store/index'

type require = (url: string, cb: (module: IAnyObject) => void) => void

App<IAppOption>({
  onLaunch() {
    // 监听退出登录事件通知
    emitter.on('loginOut', (e) => {
      console.log('login-event', e)
      storage.remove('TOKEN')

      wx.navigateTo({ url: '/pages/login/index' })
    })
    // 加载svg，这里不能使用import进行导入，使用import导入会导致报错
    const req = require as require
    req('./assets/svg/svgs.js', (module) => {
      this.globalData.svgs = module.default
      others.setIsLoadSvg()
    })

    // 获取状态栏和顶部栏高度
    setNavigationBarHeight()

    // 获取rpx和px转换比例、底部bar高度
    // px转rpx: px / divideRpxByPx,rpx转px：divideRpxByPx * rpx
    wx.getSystemInfo({
      success: (result) => {
        storage.set('divideRpxByPx', result.windowWidth / 750, null)
        storage.set('bottomBarHeight', result.windowHeight - result.safeArea.bottom, null)
      },
      fail: (err) => {
        console.log(err)
      },
    })
  },
  globalData: {},
})
