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
import { deviceStore, homeStore, othersStore } from './store/index'
import { reaction } from 'mobx-miniprogram'
import homOs, { getDeviceList } from 'homlux-sdk'
import { getEnv } from './config/index'

App<IAppOption>({
  async onLaunch() {
    // 加载svg数据
    this.globalData.svgs = svgs

    wx.onNeedPrivacyAuthorization(() => {
      console.debug('onNeedPrivacyAuthorization')
      // 需要用户同意隐私授权时
      // 弹出开发者自定义的隐私授权弹窗
    })

    // 设备运行环境
    setCurrentEnv()

    // 获取状态栏、顶部栏、底部栏高度
    setNavigationBarAndBottomBarHeight()

    // 监听houseId变化，切换websocket连接,切换成对应家庭的sock连接
    reaction(
      () => homeStore.currentHomeDetail.houseId,
      () => {
        closeWebSocket()
        startWebsocketService()

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
    if (this.globalData.firstOnShow) {
      this.globalData.firstOnShow = false
      return
    }

    // 用户热启动app，建立ws连接，并且再更新一次数据
    Logger.log('app-onShow, isConnect:', isConnect(), homeStore.currentHomeId)
    if (homeStore.currentHomeId && storage.get<string>('token') && isConnect()) {
      deviceStore.updateSubDeviceList()
      homeStore.updateHomeInfo()
      startWebsocketService()
    }

    this.initHomeOs()
  },

  onHide() {
    Logger.log('app-onHide')
    // 用户最小化app，断开ws连接
    closeWebSocket()

    homOs.destory()
  },

  onError(msg: string) {
    Logger.error('app-onError', msg)
  },

  async initHomeOs() {
    if (!homeStore.currentHomeId) {
      return
    }

    const token = storage.get('token', '') as string

    homOs.init({ token, homeId: homeStore.currentHomeDetail.houseId, env: getEnv() })

    getDeviceList()
  },

  globalData: {
    firstOnShow: true,
  },
})
