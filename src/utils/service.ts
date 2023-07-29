// service模块存放项目的相关业务代码
import { storage } from './storage'
import { connectHouseSocket } from '../apis/websocket'
import { homeStore, userStore } from '../store/index'
import { emitter } from './eventBus'
import { Logger } from './log'
import { goHome } from './app'

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
let socketIsConnect = false // socket是否处于连接状态
let connectTimeId = 0 // 连接socket的延时器

export async function startWebsocketService() {
  if (!storage.get<string>('token')) {
    return
  }
  if (socketIsConnect) {
    const closeRes = await socketTask?.close({ code: 1000 })

    Logger.log('closeRes', closeRes)
  }
  socketTask = connectHouseSocket(homeStore.currentHomeDetail.houseId)
  socketTask.onClose(onSocketClose)
  socketTask.onOpen((res) => {
    socketIsConnect = true
    Logger.log('socket连接成功', res)
  })
  socketTask.onMessage((e) => {
    try {
      const res = JSON.parse(e.data as string)
      const { eventType, eventData } = res.result
      Logger.console('☄ 接收到socket信息：', eventType, eventData)
      emitter.emit('wsReceive', res)
      emitter.emit(eventType, eventData)

      // 全局加上进入家庭的消息提示（暂时方案）
      if (eventType === 'invite_user_house' && eventData) {
        wx.showToast({
          title: eventData,
          icon: 'none',
        })
      } else if (eventType === 'del_house_user' && userStore.userInfo.userId === eventData.userId) {
        // 仅家庭创建者触发监听，监听家庭移交是否成功
        wx.showModal({
          content: `你已被退出“${homeStore.currentHomeDetail.houseName}”家庭`,
          showCancel: false,
          confirmText: '我知道了',
          confirmColor: '#488FFF',
          complete() {
            homeStore.updateHomeInfo()
            goHome()
          },
        })
      } else if (eventType === 'change_house_user_auth' && userStore.userInfo.userId === eventData.userId) {
        homeStore.updateHomeInfo()
      }
    } catch (err) {
      Logger.error('接收到socket信息：', e.data)
      Logger.error('转json失败：', err)
    }
  })
  socketTask.onError((err) => {
    Logger.error('socket错误onError：', err)
    // 防止重复收到error事件，重复触发重连
    connectTimeId = setTimeout(() => {
      clearTimeout(connectTimeId)
      Logger.log('socket重连')
      startWebsocketService()
    }, 10000)
  })
}

export function socketSend(data: string | ArrayBuffer) {
  if (!socketTask) {
    Logger.error('[socketSend] socketTask 未正常连接')
    return
  }
  socketTask.send({
    data,
    success(res) {
      Logger.console('发送成功', res)
    },
    fail(res) {
      Logger.error(res)
    }
  })
}

function onSocketClose(e: WechatMiniprogram.SocketTaskOnCloseCallbackResult) {
  Logger.log('socket关闭连接', e)
  socketIsConnect = false
  // 4001: token校验不通过
  if (e.code !== 1000 && e.code !== 4001) {
    Logger.error('socket异常关闭连接', e)
    connectTimeId = setTimeout(() => {
      clearTimeout(connectTimeId)
      Logger.log('socket重连')
      startWebsocketService()
    }, 5000)
  }
}

export function closeWebSocket() {
  if (socketTask && socketIsConnect) {
    socketTask.close({ code: 1000 })
    socketIsConnect = false
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
    Logger.error('appOnLaunchService-err:', e)
  }
}
