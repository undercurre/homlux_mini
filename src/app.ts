import { setNavigationBarAndBottomBarHeight, storage } from './utils/index'
import svgs from './assets/svg/index'
import { appOnLaunchService } from './utils/service'
import { othersStore } from './store/index'

App<IAppOption>({
  async onLaunch(options: WechatMiniprogram.App.LaunchShowOption) {
    wx.setEnableDebug({
      enableDebug: true,
    }).catch((err) => err)

    console.log('APP打开参数：', options)
    // 加载svg数据
    this.globalData.svgs = svgs

    // 获取状态栏、顶部栏、底部栏高度
    setNavigationBarAndBottomBarHeight()

    // 如果用户已经登录，开始请求数据
    if (storage.get<string>('token')) {
      appOnLaunchService()
    } else {
      othersStore.setIsInit(false)
    }

    console.log('APP打开参数：', options)

    const systemInfo = wx.getSystemInfoSync()

    console.log('systemInfo', systemInfo)

    const appAuthorizeSetting = wx.getAppAuthorizeSetting()

    console.log('appAuthorizeSetting', appAuthorizeSetting)

    wx.onNetworkStatusChange(function (res) {
      console.log('监听网络状态变化事件:', res, Date().toString())
    })

    wx.onNetworkWeakChange(function (res) {
      console.log('监听弱网状态变化事件:', res, Date().toString())
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
