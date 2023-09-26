// service模块存放项目的相关业务代码
import { storage } from './storage'
import { connectHouseSocket } from '../apis/websocket'
import { homeStore, userStore } from '../store/index'
import { emitter } from './eventBus'
import { Logger } from './log'
import homos from 'js-homos'

export function logout() {
  storage.remove('mobilePhone')
  storage.remove('token')
  userStore.logout()
  homos.logout()
  closeWebSocket()

  wx.switchTab({
    url: '/pages/index/index',
  })
}

// WS连接
let socketTask: WechatMiniprogram.SocketTask | null = null
let socketIsConnect = false // socket是否处于连接状态
let connectTimeId = 0 // 连接socket的延时器

// socket心跳缓存数据
const heartbeatInfo = {
  timeId: 0, // 计时器
  lastMsgId: 0, // 上一次的心跳包消息Id
}

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

    // 30秒发一次心跳
    heartbeatInfo.timeId = setInterval(() => {
      const msgId = Date.now().valueOf()

      socketTask?.send({
        data: JSON.stringify({
          topic: 'heartbeatTopic',
          message: {
            msgId,
          },
        }),
        success() {
          setTimeout(() => {
            // 根据onMessage监听topic === 'heartbeatTopic'消息，判断是否收到心跳回复，3s超时
            if (msgId !== heartbeatInfo.lastMsgId) {
              // 3s内没有收到发出的心跳回复，认为socket断开需要重连
              Logger.error('socket心跳回复超时，重连')
              startWebsocketService()
            }
          }, 3000)
        },
        fail(res) {
          Logger.error('socket心跳包-fail', res)
        },
      })
    }, 30000)
  })
  socketTask.onMessage((e) => {
    try {
      const res = JSON.parse(e.data as string)

      // Logger.console('Ⓦ 收到ws信息：', res)

      const { topic, message, eventData } = res.result

      if (topic === 'heartbeatTopic') {
        // 缓存上一次收到的心跳包id
        heartbeatInfo.lastMsgId = message.msgId
      } else {
        emitter.emit('msgPush', {
          source: 'ws',
          reqId: eventData.reqId,
          result: res.result,
        })
      }
    } catch (err) {
      Logger.error('接收到socket信息：', e.data)
      Logger.error('转json失败：', err)
    }
  })
  socketTask.onError((err) => {
    Logger.error('socket错误onError：', err)
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
    },
  })
}

function onSocketClose(e: WechatMiniprogram.SocketTaskOnCloseCallbackResult) {
  Logger.log('socket关闭连接', e)
  socketIsConnect = false
  clearInterval(heartbeatInfo.timeId)
  // 4001: token校验不通过
  if (e.code !== 1000 && e.code !== 4001) {
    Logger.error('socket异常关闭连接', e)
    clearTimeout(connectTimeId)
    connectTimeId = setTimeout(() => {
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
  } catch (e) {
    Logger.error('appOnLaunchService-err:', e)
  }
}
