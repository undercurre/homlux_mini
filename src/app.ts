import {
  setNavigationBarAndBottomBarHeight,
  storage,
  appOnLaunchService,
  startWebsocketService,
  closeWebSocket,
  setCurrentEnv,
  Logger,
  isConnect,
  initHomeOs
} from './utils/index'
import svgs from './assets/svg/index'
import { deviceStore, homeStore, othersStore } from './store/index'
import { reaction } from 'mobx-miniprogram'
import homOs from 'js-homos'
import mqtt from './lib/mqtt.min.js'

// TODO 统一配置和管理 storage key
App<IAppOption>({
  async onLaunch() {
    // 加载svg数据
    this.globalData.svgs = svgs

    // 设备运行环境
    setCurrentEnv()

    // 获取状态栏、顶部栏、底部栏高度
    setNavigationBarAndBottomBarHeight()

    // 监控是否存在onNeedPrivacyAuthorization，暂时没有业务需求，后期可删除
    if (wx.canIUse('onNeedPrivacyAuthorization')) {
      wx.onNeedPrivacyAuthorization(() => {
        console.error('onNeedPrivacyAuthorization')
      })
    }

    homOs.init({ mqttLib: mqtt })

    // 从缓存中读取默认首页
    const defaultPage = (storage.get<string>('defaultPage') ?? '') as string
    console.log({ defaultPage })
    if (defaultPage) {
      othersStore.setDefaultPage(defaultPage)
    }

    // 如果用户已经登录，开始请求数据
    if (storage.get<string>('token')) {
      appOnLaunchService()
    } else {
      othersStore.setIsInit(false)
    }

    // 监听houseId变化，切换websocket连接,切换成对应家庭的sock连接
    reaction(
      () => homeStore.currentHomeDetail.houseId,
      async () => {
        console.debug('监听houseId变化', homeStore.currentHomeDetail.houseId)
        closeWebSocket()
        startWebsocketService()

        await homeStore.updateLocalKey()
        initHomeOs()
      },
    )

    // 如果用户已经登录，开始请求数据
    if (storage.get<string>('token')) {
      appOnLaunchService()
    } else {
      othersStore.setIsInit(false)
    }

    // 监听内存不足告警事件
    wx.onMemoryWarning(function () {
      Logger.error('onMemoryWarningReceive')
    })
  },

  onShow() {
    // 用户热启动app，建立ws连接，并且再更新一次数据
    Logger.log('app-onShow, isConnect:', isConnect(), homeStore.currentHomeId)
    if (homeStore.currentHomeId && storage.get<string>('token') && isConnect()) {
      deviceStore.updateSubDeviceList()
      homeStore.updateHomeInfo()
      startWebsocketService()

      initHomeOs()
    }
  },

  onHide() {
    Logger.log('app-onHide')
    // 用户最小化app，断开ws连接
    closeWebSocket()

    // 退出HomOS sdk登录态，断开局域网连接
    homOs.logout()
  },

  onError(msg: string) {
    Logger.error('app-onError', msg)
  },

  globalData: {
    firstOnShow: true,
  },
})
