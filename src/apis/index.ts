import { mzaioRequest } from '../utils/index'
export * from './home'
export * from './device'
export * from './room'
export * from './user'
export * from './ota'
export * from './scene'
export * from './meiju'
export * from './wechat'
export * from './mi'

export async function login(data: object) {
  return await mzaioRequest.post<User.UserLoginRes>({
    log: true,
    loading: false,
    url: '/v1/mzgdApi/auth/mzgd/login',
    data,
  })
}

// 测试网络连接状态用
export async function peekNetwork() {
  return await mzaioRequest.post({
    log: false,
    loading: false,
    isDefaultErrorTips: false,
    url: '/',
    timeout: 2000,
  })
}
