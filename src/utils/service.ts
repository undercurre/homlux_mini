// service模块存放项目的相关业务代码
import { storage } from './storage'
import { reaction, runInAction } from 'mobx-miniprogram'
import { connectHouseSocket } from '../apis/websocket'
import { homeStore, othersStore, userStore } from '../store/index'
import { emitter } from './eventBus'

export function logout() {
  storage.remove('mobilePhone')
  storage.remove('token')
  wx.redirectTo({
    url: '/pages/login/index',
  })
}

// WS连接
let socketTask: WechatMiniprogram.SocketTask | null = null

function createConnect() {
  socketTask = connectHouseSocket(homeStore.currentHomeDetail.houseId)
  socketTask.onClose(onSocketClose)
  socketTask.onOpen(() => {
    console.log('socket连接成功')
  })
  socketTask.onMessage((e) => {
    try {
      console.log('接收到Socket信息：', JSON.parse(e.data as string))
      const res = JSON.parse(e.data as string)
      emitter.emit('wsReceive', res)
    } catch (err) {
      console.log('接收到Socket信息：', e.data)
      console.log('转json失败：', err)
    }
  })
}

function onSocketClose(e: WechatMiniprogram.SocketTaskOnCloseCallbackResult) {
  console.log('socket关闭连接', e)
  if (e.code !== 1000) {
    setTimeout(() => {
      console.log('socket重连')
      createConnect()
    }, 5000)
  }
}

/**
 * 开始连接ws，并根据houseId的切换自动断开并重连
 */
export function startWebsocketService() {
  createConnect()
  reaction(
    () => homeStore.currentHomeDetail.houseId,
    () => {
      socketTask?.close({ code: 1000 })
      createConnect()
    },
  )
}

export function loadUserInfo() {
  let nickName = '',
    avatar = ''
  if (storage.get<string>('nickName')) {
    nickName = storage.get<string>('nickName') as string
  } else {
    nickName = (storage.get<string>('mobilePhone') as string).slice(-4)
  }
  if (storage.get<string>('headImageUrl')) {
    avatar = storage.get<string>('headImageUrl') as string
  }
  runInAction(() => {
    userStore.userInfo.nickName = nickName
    userStore.userInfo.headImageUrl = avatar
    userStore.userInfo.mobilePhone = storage.get<string>('mobilePhone') as string
  })
}

/**
 * 进入小程序时的业务逻辑
 */
export async function appOnLaunchService() {
  try {
    userStore.setIsLogin(true)
    loadUserInfo()
    const start = Date.now()
    console.log('开始时间', start / 1000)
    await homeStore.updateHomeInfo()
    console.log('加载完成时间', Date.now() / 1000, '用时', (Date.now() - start) / 1000 + 's')
    othersStore.setIsInit()
    startWebsocketService()
  } catch (e) {
    console.log('appOnLaunchService-err:', e)
  } finally {
    homeStore.homeInitFinish()
  }
}
