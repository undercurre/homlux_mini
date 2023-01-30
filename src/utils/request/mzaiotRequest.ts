import { baseRequest, BaseRequestOptions } from './baseRequest'
// 后端默认返回格式
type MzaiotResponseRowData<T extends AnyResType = AnyResType> = {
  code: number
  msg: string
  success: boolean
  result?: T
}

type MzaiotRequest = <T extends AnyResType>(options: BaseRequestOptions<T>) => Promise<MzaiotResponseRowData<T>>

// 封装好http method的请求实例
type MzaiotRequestWithMethod = MzaiotRequest & {
  get: MzaiotRequest
  post: MzaiotRequest
  put: MzaiotRequest
  delete: MzaiotRequest
}

const mzaiotRequest: MzaiotRequest = function <T extends AnyResType>(
  options: BaseRequestOptions<T>,
) {
  return baseRequest<T>({
    ...options,
    generalSuccessHandler: (result) => result.data,
    generalFailHandler: (error) =>
      ({
        code: -1,
        msg: error.errMsg,
        success: false,
      }) as unknown as T,
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
