import { setNavigationBarAndBottomBarHeight, storage } from './utils/index'
import svgs from './assets/svg/index'
import { appOnLaunchService } from './utils/service'

App<IAppOption>({
  async onLaunch(options: WechatMiniprogram.App.LaunchShowOption) {
    wx.setEnableDebug({
      enableDebug: true,
    })

    console.log('APP打开参数：', options)
    if (options.query.type) storage.set('inviteType', options.query.type)
    if (options.query.houseId) storage.set('inviteHouseId', options.query.houseId)
    if (options.query.time) storage.set('inviteTime', options.query.time)
    // 加载svg数据
    this.globalData.svgs = svgs

    // 获取状态栏、顶部栏、底部栏高度
    setNavigationBarAndBottomBarHeight()

    // 如果用户没登陆，或者登录状态过期，需要自动跳转到登录页
    if (!storage.get<string>('token')) {
      // todo: 保存打开参数，登陆后重定向到参数目录
      wx.redirectTo({
        url: '/pages/login/index',
      })
      return
    }
    appOnLaunchService()

    console.log('APP打开参数：', options)

    const systemInfo = wx.getSystemInfoSync()

    console.log('systemInfo', systemInfo)

    const appAuthorizeSetting = wx.getAppAuthorizeSetting()

    console.log('appAuthorizeSetting', appAuthorizeSetting)

    wx.onNetworkStatusChange(function (res) {
      console.log('监听网络状态变化事件:', res)
    })

    wx.onNetworkWeakChange(function (res) {
      console.log('监听弱网状态变化事件:', res)
    })
  },

  onShow() {
    console.log('app-onShow')
  },

  onHide() {
    console.log('app-onHide')
  },

  globalData: {},
})
