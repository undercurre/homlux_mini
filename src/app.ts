import { setNavigationBarAndBottomBarHeight, storage } from './utils/index'
import svgs from './assets/svg/index'
import { appOnLaunchService } from './utils/service'

App<IAppOption>({
  onLaunch(options: WechatMiniprogram.App.LaunchShowOption) {
    console.log('APP打开参数：', options)
    // 加载svg数据
    this.globalData.svgs = svgs

    // 获取状态栏、顶部栏、底部栏高度
    setNavigationBarAndBottomBarHeight()

    const appAuthorizeSetting = wx.getAppAuthorizeSetting()

    console.log('appAuthorizeSetting', appAuthorizeSetting)

    // 如果用户没登陆，或者登录状态过期，需要自动跳转到登录页
    if (!storage.get<string>('token')) {
      wx.redirectTo({
        url: '/pages/login/index',
      })
      return
    }
    appOnLaunchService()
  },
  globalData: {},
})
