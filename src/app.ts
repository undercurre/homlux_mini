// app.js
import { setNavigationBarHeight, storage } from './utils/index'
import svgs from './assets/svg/index'
import { others } from './store/others'

App<IAppOption>({
  onLaunch() {
    // 加载svg，这里不能使用import进行导入，使用import导入会导致报错
    this.globalData.svgs = svgs

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

    // 如果用户没登陆，或者登录状态过期，需要自动跳转到登录页
    if (storage.get<string>('token')) {
      others.setToken(storage.get<string>('token') as string)
    } else {
      wx.redirectTo({
        url: '/pages/login/index',
      })
    }
  },
  globalData: {},
})
