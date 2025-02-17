import {
  setNavigationBarAndBottomBarHeight,
  storage,
  startWebsocketService,
  closeWebSocket,
  setCurrentEnv,
  Logger,
  isConnect,
  initHomeOs,
  networkStatusListen,
  removeNetworkStatusListen,
  verifyNetwork,
  isLogon,
  getCurrentPageUrl,
  showLoading,
  hideLoading,
} from './utils/index'
import svgs from './assets/svg/index'
import { homeStore, othersStore, sceneStore, userStore } from './store/index'
import { reaction } from 'mobx-miniprogram'
import homOs from 'js-homos'
import mqtt from './lib/mqtt.min.js' // 暂时只能使用4.2.1版本，高版本有bug，判断错运行环境

// TODO 统一配置和管理 storage key
App<IAppOption>({
  async onLaunch() {
    // DESERTED 加载svg数据
    this.globalData.svgs = svgs

    // 设备云端运行环境
    setCurrentEnv()

    // 获取状态栏、顶部栏、底部栏高度
    setNavigationBarAndBottomBarHeight()

    homOs.init({ mqttLib: mqtt, isDebug: true })

    // 从缓存中读取默认首页
    const defaultPage = (storage.get<string>('defaultPage') ?? '') as string
    console.log({ defaultPage })
    if (defaultPage) {
      othersStore.setDefaultPage(defaultPage)
    }

    // 监听houseId变化(需要优先初始化监听，否则无法及时监听变化),切换成对应家庭的websocket连接
    reaction(
      () => homeStore.currentHomeDetail.houseId,
      async () => {
        Logger.log('reaction -> homeStore.currentHomeDetail.houseId', homeStore.currentHomeDetail.houseId)
        await closeWebSocket()
        startWebsocketService()

        homeStore.key = '' // 清空旧家庭的homOS的key
        initHomeOs()
      },
    )

    // 监听网络状态
    networkStatusListen()
    verifyNetwork() // 先主动查一次

    // 如果用户已经登录，开始请求数据[用户][家庭列表、全屋房间、全屋设备]
    if (isLogon()) {
      try {
        showLoading()
        userStore.setIsLogin(true)
        const start = Date.now()
        Logger.trace('[数据初始化开始]')
        await Promise.all([userStore.updateUserInfo(), homeStore.homeInit(), sceneStore.updateAllRoomSceneList()])
        Logger.trace('[数据初始化完成] 耗时', `${Date.now() - start}ms`)
      } catch (e) {
        Logger.error('appOnLaunch-err:', e)
      }
      hideLoading()
    } else {
      othersStore.setIsInit(false)
    }

    // 监听内存不足告警事件
    wx.onMemoryWarning(function () {
      Logger.debug('onMemoryWarningReceive')
    })
  },

  async onShow() {
    const { firstOnShow } = this.globalData
    this.globalData.firstOnShow = false

    // 用户热启动app，建立ws连接，并且再更新一次数据
    console.log(
      'app-onShow, isConnect:',
      isConnect(),
      'isLogon',
      isLogon(),
      'homeStore.currentHomeId',
      homeStore.currentHomeId,
      'firstOnShow',
      firstOnShow,
    )

    // 非登录状态，终止下面逻辑，且发现当前非主包页面（当前主包页面均可不需要登录访问），强制跳转登录
    if (!isLogon()) {
      return
    }

    // 首次进入有onLaunch不必加载
    !firstOnShow && initHomeOs()

    // 以下逻辑需要网络连接
    if (!isConnect()) {
      return
    }

    startWebsocketService()

    // 全屋场景数据加载（其余数据刷新放在 Index.onShow） // Hack 预加载场景数据，避免进入场景页面时异常
    sceneStore.updateAllRoomSceneList(homeStore.currentHomeId, { isDefaultErrorTips: false })
  },

  onHide() {
    Logger.log('app-onHide')
    // 用户最小化app，断开ws连接
    closeWebSocket()

    // 退出HomOS sdk登录态，断开局域网连接
    homOs.logout()

    // 取消监听网络状态
    removeNetworkStatusListen()
  },

  onError(msg: string) {
    const pageUrl = getCurrentPageUrl()

    Logger.error(`【${pageUrl}】app-onError`, msg)
  },

  globalData: {
    firstOnShow: true,
  },
})
