import { baseRequest, BaseRequestOptions } from './baseRequest'
import storage from '../storage'
import { env, mzaioBaseURL, TOKEN_EXPIRED } from '../../config/index'
import { userStore } from '../../store/index'

// 后端默认返回格式
type mzaioResponseRowData<T extends AnyResType = AnyResType> = {
  code: number
  msg: string
  success: boolean
  result: T
}

type mzaioRequest = <T extends AnyResType>(options: BaseRequestOptions<T>) => Promise<mzaioResponseRowData<T>>

// 封装好http method的请求实例
type mzaioRequestWithMethod = mzaioRequest & {
  get: mzaioRequest
  post: mzaioRequest
  put: mzaioRequest
  delete: mzaioRequest
}

const mzaioRequest: mzaioRequest = function <T extends AnyResType>(options: BaseRequestOptions<T>) {
  // 按需添加header
  const header = {
    Authorization: 'Bearer ' + storage.get('token', ''),
  }

  if (options.header) {
    options.header = {
      ...header,
      ...options.header,
    }
  } else {
    options.header = header
  }

  // 拼接上美智云的基础地址
  options.url = mzaioBaseURL[env] + options.url

  // 后续考虑选择用nanoid生成reqId，但是微信小程序不支持浏览器的crypto API，无法使用nanoid和uuid包。
  const reqId = Date.now()
  options.data = Object.assign(
    {
      reqId,
      frontendType: 'WeApp',
      systemSource: storage.get<string>('system'),
      timestamp: reqId,
    },
    options.data,
  )

  // 调整请求超时时间，默认10秒
  if (!options.timeout) {
    options.timeout = 10000
  }

  return baseRequest<T>({
    ...options,
    generalSuccessHandler: (result) => {
      // token过期，跳转到登录
      if ((result.data as unknown as { code: number }).code === TOKEN_EXPIRED) {
        userStore.setIsLogin(false)
        wx.switchTab({
          url: '/pages/index/index',
        })
        return result.data
      }
      return result.data
    },
    generalFailHandler: (error) =>
      ({
        code: -1,
        msg: error.errMsg,
        success: false,
      } as unknown as T),
  }) as unknown as Promise<mzaioResponseRowData<T>>
}

const mzaioRequestWithMethod = mzaioRequest as mzaioRequestWithMethod

// 仿照axios，添加get post put delete方法
;(['get', 'post', 'put', 'delete'] as const).forEach((method) => {
  mzaioRequestWithMethod[method] = (options) => {
    return mzaioRequest({
      ...options,
      method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE',
    })
  }
})

export { mzaioRequestWithMethod as mzaioRequest }
