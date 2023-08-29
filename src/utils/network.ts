import { Logger } from './log'

let isConnectStatus = true

export function networkStatusListen() {
  wx.onNetworkStatusChange(function (res) {
    isConnectStatus = res.isConnected
  })

  wx.onNetworkWeakChange(function (res) {
    Logger.debug('监听弱网状态变化事件:', res)
  })
}

export function isConnect() {
  return isConnectStatus
}
