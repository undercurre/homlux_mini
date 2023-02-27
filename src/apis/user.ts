import { mzaioRequest } from '../utils/index'

/**
 * 查询用户信息
 */
export async function queryUserInfo() {
  return await mzaioRequest.post<User.UserInfo>({
    log: false,
    loading: false,
    url: '/v1/mzgd/user/queryWxUserInfo',
  })
}
