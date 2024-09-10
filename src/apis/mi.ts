import { MI_APP_ID, MI_APP_SECRET, getH5BaseUrl } from '../config/index'
import { baseRequest } from '../utils/request/baseRequest'

/**
 * 获取访问令牌接口
 */
export async function getToken(code: string) {
  return await baseRequest<{
    access_token: string
    expires_in: number
    refresh_token: string
    scope: string
    mac_key: string
    mac_algorithm: string
    openId: string
  }>({
    header: { 'content-type': 'application/x-www-form-urlencoded' },
    url: 'https://account.xiaomi.com/oauth2/token',
    method: 'POST',
    timeout: 10000,
    data: {
      client_id: MI_APP_ID,
      redirect_uri: `${getH5BaseUrl()}/index.html`,
      client_secret: MI_APP_SECRET,
      grant_type: 'authorization_code',
      code,
    },
  })
}
