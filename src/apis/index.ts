import { mzaioRequest } from '../utils/index'
export * from './home'
export * from './device'
export * from './room'
export * from './device'
export * from './user'
export * from './ota'

export async function login(data: object) {
  return await mzaioRequest.post<User.UserLoginRes>({
    log: true,
    loading: true,
    url: '/v1/mzgdApi/auth/mzgd/login',
    data,
  })
}
