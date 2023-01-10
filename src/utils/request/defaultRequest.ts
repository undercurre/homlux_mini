import config from '../../config'

type AnyResType = string | IAnyObject | ArrayBuffer

// 后端默认返回格式
type ResponseRowData<T extends AnyResType = AnyResType> = {
  code: number
  msg: string
  success: boolean
  result?: T
}

// 可以传入是否展示loading，自定义成功或者失败回调
export type DefaultRequestOptions<T extends AnyResType = AnyResType> = WechatMiniprogram.RequestOption<T> & {
  loading?: boolean
  successHandler?: (result: WechatMiniprogram.RequestSuccessCallbackResult<T>) => ResponseRowData<T>
  failHandler?: (result: WechatMiniprogram.GeneralCallbackResult) => ResponseRowData<T>
}

// 基本的请求方法实例
type BaseRequest = <T extends AnyResType = AnyResType, U extends ResponseRowData<T> = ResponseRowData<T>>(
  requestConfig: DefaultRequestOptions<T>,
) => Promise<U>

// 封装好http method的请求实例
type DefaultRequest = BaseRequest & {
  get: BaseRequest
  post: BaseRequest
  put: BaseRequest
  delete: BaseRequest
}

const baseRequest: BaseRequest = function <
  T extends AnyResType = AnyResType,
  U extends ResponseRowData<T> = ResponseRowData<T>,
>(requestOption: DefaultRequestOptions<T>) {
  return new Promise<U>((resolve) => {
    // 这里配置自定义的header
    const header = {}
    if (requestOption.header) {
      requestOption.header = {
        ...requestOption,
        header,
      }
    } else {
      requestOption.header = header
    }
    // 是否显示loading，显示mask用于阻止用户多次点击
    if (requestOption.loading) {
      wx.showLoading &&
        wx.showLoading({
          title: '加载中...',
          mask: true,
        })
    }
    // 请求前这里可以再次对requestOption进行处理
    requestOption.url = config.defaultApiServer[config.env] + requestOption.url

    // 请求成功回调处理
    if (requestOption.successHandler) {
      const handler = requestOption.successHandler
      requestOption.success = (result) => {
        const afterProcessResult = handler(result)
        resolve(afterProcessResult as U)
      }
    } else {
      requestOption.success = (result) => {
        resolve(result.data as ResponseRowData<T> as U)
      }
    }

    // 请求失败回调处理
    if (requestOption.failHandler) {
      const handler = requestOption.failHandler
      requestOption.fail = (err) => {
        resolve(handler(err) as U)
      }
    } else {
      requestOption.fail = (result) => {
        resolve({
          success: false,
          code: -1,
          msg: result.errMsg,
        } as U)
      }
    }
    wx.request({
      ...requestOption,
      complete() {
        wx.hideLoading && wx.hideLoading()
      },
    })
  })
}

const defaultRequest = baseRequest as unknown as DefaultRequest

// 仿照axios，添加get post put delete方法
;(['get', 'post', 'put', 'delete'] as const).forEach((method) => {
  defaultRequest[method] = (requestConfig) => {
    return baseRequest({
      ...requestConfig,
      method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE',
    })
  }
})

export { defaultRequest }
