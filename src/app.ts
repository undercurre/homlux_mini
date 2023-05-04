import {
  setNavigationBarAndBottomBarHeight,
  storage,
  appOnLaunchService,
  startWebsocketService,
  closeWebSocket,
  setCurrentEnv,
} from './utils/index'
import svgs from './assets/svg/index'
import { deviceStore, homeStore, othersStore } from './store/index'
import { isConnect, networkStatusListen } from './utils/network'
import { reaction } from 'mobx-miniprogram'

App<IAppOption>({
  async onLaunch() {
    // wx.setEnableDebug({
    //   enableDebug: true,
    // }).catch((err) => err)

    // 加载svg数据
    this.globalData.svgs = svgs

    // 设备运行环境
    setCurrentEnv()

    // 获取状态栏、顶部栏、底部栏高度
    setNavigationBarAndBottomBarHeight()

    // 如果用户已经登录，开始请求数据
    if (storage.get<string>('token')) {
      appOnLaunchService()
    } else {
      othersStore.setIsInit(false)
    }

    // 监听houseId变化，切换websocket连接
    reaction(
      () => homeStore.currentHomeDetail.houseId,
      () => {
        closeWebSocket()
        startWebsocketService()
      },
    )

    // 网络监听
    networkStatusListen()
  },

  onShow() {
    console.log('app-onShow', this.globalData)
    if (this.globalData.firstOnShow) {
      this.globalData.firstOnShow = false
      return
    }
    // 用户热启动app，建立ws连接，并且再更新一次数据
    if (homeStore.currentHomeId && storage.get<string>('token') && isConnect()) {
      deviceStore.updateDeviceList()
      homeStore.updateHomeInfo()
      startWebsocketService()
    }
  },

  onHide() {
    console.log('app-onHide')
    // 用户最小化app，断开ws连接
    closeWebSocket()
  },

  globalData: {
    firstOnShow: true,
  },
})
