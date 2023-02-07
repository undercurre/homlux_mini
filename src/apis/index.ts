import { mzaiotRequest } from '../utils/index'
export * from './home'

export async function login(data: object) {
  return await mzaiotRequest.post<User.UserLoginRes>({
    log: true,
    loading: true,
    url: '/v1/mzgdApi/auth/mzgd/login',
    data,
  })
}
