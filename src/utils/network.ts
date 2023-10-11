import { Logger } from './log'
import { peekNetwork } from '../apis/index'

let isConnectStatus = true
let networkType = 'unknown'
let weakNet = false

const networkListener = (res: WechatMiniprogram.OnNetworkStatusChangeListenerResult) => {
  Logger.debug('网络状态变化:', res)

  networkType = res.networkType

  // WIFI 状态下不变更连接状态，需要手动调用 verifyNetwork()
  if (networkType !== 'wifi' && networkType !== 'unknown') {
    isConnectStatus = res.isConnected
  }
}

const networkWeakListener = (res: WechatMiniprogram.OnNetworkWeakChangeListenerResult) => {
  Logger.debug('弱网状态变化:', res)
  weakNet = res.weakNet
  networkType = res.networkType
}

// 监听网络状态，但无法判断WIFI是否可以访问外网
export function networkStatusListen() {
  wx.onNetworkStatusChange(networkListener)
  wx.onNetworkWeakChange(networkWeakListener)
}

export function removeNetworkStatusListen() {
  wx.offNetworkStatusChange(networkListener)
  wx.offNetworkWeakChange(networkWeakListener)
}

/**
 * @description 访问云端服务根地址，以判断网络是否畅通
 * !! 非WIFI状态，直接根据监听结果判断即可
 */
export async function verifyNetwork() {
  const res = await peekNetwork()
  Logger.debug('连网状态检测:', res)

  isConnectStatus = res.msg.indexOf('time out') === -1 && res.msg.indexOf('UNREACHABLE') === -1
}

export function isConnect() {
  return isConnectStatus
}

export function getNetworkType() {
  return networkType
}

export function isWeakNet() {
  return weakNet
}
