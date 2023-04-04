// service模块存放项目的相关业务代码
import { storage } from './storage'
import { reaction } from 'mobx-miniprogram'
import { connectHouseSocket } from '../apis/websocket'
import { homeStore, userStore } from '../store/index'
import { emitter } from './eventBus'

export function logout() {
  storage.remove('mobilePhone')
  storage.remove('token')
  userStore.logout()
  wx.switchTab({
    url: '/pages/index/index',
  })
}

// WS连接
let socketTask: WechatMiniprogram.SocketTask | null = null
let socketIsConnect = 0

function createConnect() {
  if (!storage.get<string>('token')) {
    return
  }
  if (socketIsConnect) {
    socketTask?.close({ code: 1000 })
  }
  socketTask = connectHouseSocket(homeStore.currentHomeDetail.houseId)
  socketTask.onClose(onSocketClose)
  socketTask.onOpen(() => {
    socketIsConnect = 1
    console.log('socket连接成功')
  })
  socketTask.onMessage((e) => {
    try {
      const res = JSON.parse(e.data as string)
      console.log('接收到Socket信息：', res, res.result.eventType)
      emitter.emit('wsReceive', res)
      emitter.emit(res.result.eventType, res.result.eventData)
    } catch (err) {
      console.log('接收到Socket信息：', e.data)
      console.log('转json失败：', err)
    }
  })
}

function onSocketClose(e: WechatMiniprogram.SocketTaskOnCloseCallbackResult) {
  console.log('socket关闭连接', e)
  socketIsConnect = 0
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

export function closeWebSocket() {
  if (socketTask && socketIsConnect) {
    socketTask.close({ code: 1000 })
  }
}

/**
 * 进入小程序时的业务逻辑
 */
export async function appOnLaunchService() {
  try {
    userStore.setIsLogin(true)
    const start = Date.now()
    console.log('开始时间', start / 1000)
    await Promise.all([userStore.updateUserInfo(), homeStore.homeInit()])
    console.log('加载完成时间', Date.now() / 1000, '用时', (Date.now() - start) / 1000 + 's')
    startWebsocketService()
  } catch (e) {
    console.log('appOnLaunchService-err:', e)
  }
}
