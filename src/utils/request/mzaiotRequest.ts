import { baseRequest, BaseRequestOptions } from './baseRequest'
import storage from '../storage'
import config from '../../config'

// 后端默认返回格式
type MzaiotResponseRowData<T extends AnyResType = AnyResType> = {
  code: number
  msg: string
  success: boolean
  result: T
}

type MzaiotRequest = <T extends AnyResType>(options: BaseRequestOptions<T>) => Promise<MzaiotResponseRowData<T>>

// 封装好http method的请求实例
type MzaiotRequestWithMethod = MzaiotRequest & {
  get: MzaiotRequest
  post: MzaiotRequest
  put: MzaiotRequest
  delete: MzaiotRequest
}

const mzaiotRequest: MzaiotRequest = function <T extends AnyResType>(options: BaseRequestOptions<T>) {
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
  options.url = config.mzaiotBaseURL[config.env] + options.url

  // 后续考虑选择用nanoid生成reqId，但是微信小程序不支持浏览器的crypto API，无法使用nanoid和uuid包。
  const reqId = Date.now()
  options.data = Object.assign(
    {
      reqId,
      frontendType: '',
      systemSource: '',
      timestamp: reqId,
    },
    options.data,
  )

  return baseRequest<T>({
    ...options,
    generalSuccessHandler: (result) => result.data,
    generalFailHandler: (error) =>
      ({
        code: -1,
        msg: error.errMsg,
        success: false,
      } as unknown as T),
  }) as unknown as Promise<MzaiotResponseRowData<T>>
}

const mzaiotRequestWithMethod = mzaiotRequest as MzaiotRequestWithMethod

// 仿照axios，添加get post put delete方法
;(['get', 'post', 'put', 'delete'] as const).forEach((method) => {
  mzaiotRequestWithMethod[method] = (options) => {
    return mzaiotRequest({
      ...options,
      method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE',
    })
  }
})

export { mzaiotRequestWithMethod as mzaiotRequest }
