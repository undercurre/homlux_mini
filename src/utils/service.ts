// service模块存放项目的相关业务代码
import { storage } from './storage'
import { reaction } from 'mobx-miniprogram'
import { connectHouseSocket } from '../apis/wsbsocket'
import { homeStore } from '../store/index'

export function logout() {
  storage.remove('token')
  wx.redirectTo({
    url: '/pages/login/index',
  })
}

let socketTask: WechatMiniprogram.SocketTask | null = null

function createConnect() {
  socketTask = connectHouseSocket(homeStore.currentHomeDetail.houseId)
  socketTask.onClose(onSocketClose)
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

/**
 * 进入小程序时的业务逻辑
 */
export async function appOnLaunchService() {
  try {
    await homeStore.updateHomeInfo()
    startWebsocketService()
  } catch (e) {
    console.log('appOnLaunchService-err:', e)
  }
}
