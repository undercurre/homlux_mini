// service模块存放项目的相关业务代码
import { storage } from './storage'
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

export function startWebsocketService() {
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
    console.info('socket连接成功')
  })
  socketTask.onMessage((e) => {
    try {
      const res = JSON.parse(e.data as string)
      console.log('接收到Socket信息：', res, res.result.eventType)
      emitter.emit('wsReceive', res)
      emitter.emit(res.result.eventType, res.result.eventData)

      // 全局加上进入家庭的消息提示（暂时方案）
      if (res.result.eventType === 'invite_user_house' && res.result.eventData) {
        wx.showToast({
          title: res.result.eventData,
          icon: 'none'
        })
      }
    } catch (err) {
      console.log('接收到Socket信息：', e.data)
      console.log('转json失败：', err)
    }
  })
  socketTask.onError((err) => {
    console.error('Socket错误：', err)
    socketIsConnect = 0
  })
}

function onSocketClose(e: WechatMiniprogram.SocketTaskOnCloseCallbackResult) {
  console.log('socket关闭连接', e)
  socketIsConnect = 0
  if (e.code !== 1000) {
    console.error('socket异常关闭连接', e)
    setTimeout(() => {
      console.log('socket重连')
      startWebsocketService()
    }, 5000)
  }
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
