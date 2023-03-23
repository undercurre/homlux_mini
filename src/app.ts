import { setNavigationBarAndBottomBarHeight, storage, appOnLaunchService, startWebsocketService } from './utils/index'
import svgs from './assets/svg/index'
import { deviceStore, homeStore, othersStore } from './store/index'
import { socketTask, socketIsConnect } from './utils/index'

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

    const systemInfo = wx.getSystemInfoSync()

    console.log('systemInfo', systemInfo)

    wx.onNetworkStatusChange(function (res) {
      console.log('监听网络状态变化事件:', res, Date().toString())
    })

    wx.onNetworkWeakChange(function (res) {
      console.warn('监听弱网状态变化事件:', res)
    })
  },

  onShow() {
    console.log('app-onShow')
    // 用户热启动app，建立ws连接，并且再更新一次数据
    if (homeStore.currentHomeId) {
      deviceStore.updateDeviceList()
      homeStore.updateHomeInfo()
      if (!socketTask || !socketIsConnect) {
        startWebsocketService()
      }
    }
  },

  onHide() {
    console.log('app-onHide')
    storage.remove('isTryInvite')
    // 用户最小化app，断开ws连接
    if (socketTask) {
      socketTask.close({ code: 1000 })
    }
  },

  globalData: {},
})
