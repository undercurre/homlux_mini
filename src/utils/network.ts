import { closeWebSocket, startWebsocketService } from "./service"

let isConnectStatus = true

export function networkStatusListen() {
  wx.onNetworkStatusChange(function (res) {
    console.log('监听网络状态变化事件:', res, Date().toString())
    isConnectStatus = res.isConnected
    if (isConnectStatus) {
      startWebsocketService()
    } else {
      closeWebSocket()
    }
  })

  wx.onNetworkWeakChange(function (res) {
    console.warn('监听弱网状态变化事件:', res)
  })
}

export function isConnect() {
  return isConnect
}