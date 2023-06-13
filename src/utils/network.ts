import { Logger } from './log'

let isConnectStatus = true

export function networkStatusListen() {
  wx.onNetworkStatusChange(function (res) {
    Logger.log('监听网络状态变化事件:', res)
    isConnectStatus = res.isConnected
  })

  wx.onNetworkWeakChange(function (res) {
    console.warn('监听弱网状态变化事件:', res)
  })
}

export function isConnect() {
  return isConnectStatus
}
