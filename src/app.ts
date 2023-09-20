import {
  setNavigationBarAndBottomBarHeight,
  storage,
  appOnLaunchService,
  startWebsocketService,
  closeWebSocket,
  setCurrentEnv,
  Logger,
  isConnect,
} from './utils/index'
import svgs from './assets/svg/index'
import { deviceStore, homeStore, othersStore, sceneStore } from './store/index'
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

    // 如果用户是首次进入，则选择默认首页
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
        this.initHomeOs()
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

      this.initHomeOs()
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

  async initHomeOs() {
    await Promise.all([homeStore.initLocalKey(), sceneStore.updateAllRoomSceneList()])

    // 调试阶段可写死传递host参数，PC模拟调试
    // host {"ip": "192.168.1.121", "devId": "1689839011110674", SSID: 'test'}
    // host {"ip": "192.168.1.123", "devId": "1693906973627831", SSID: 'test'}
    homOs.login({
      homeId: homeStore.currentHomeDetail.houseId,
      key: homeStore.key,
      host: { ip: '192.168.1.129', devId: '1694499802565103', SSID: 'test' },
    })

    homOs.onMessage((res: IAnyObject) => {
      Logger.log('homOs.onMessage', res)
    })
  },

  globalData: {
    firstOnShow: true,
  },
})
