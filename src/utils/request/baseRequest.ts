import { showLoading, hideLoading } from '../index'
import { Logger } from '../log'

export type BaseRequestOptions<T extends AnyResType> = WechatMiniprogram.RequestOption<T> & {
  /**
   * 可以传入是否展示loading，自定义成功或者失败回调
   */
  loading?: boolean
  /**
   * 是否打印请求和响应
   */
  log?: boolean
  /**
   * 单独接口请求成功处理
   */
  successHandler?: (result: WechatMiniprogram.RequestSuccessCallbackResult<T>) => T
  /**
   * 单独接口请求失败处理
   */
  failHandler?: (result: WechatMiniprogram.GeneralCallbackResult) => T
  /**
   * 通用接口请求成功处理
   */
  generalSuccessHandler?: (result: WechatMiniprogram.RequestSuccessCallbackResult<T>) => T
  /**
   * 通用接口请求失败处理
   */
  generalFailHandler?: (result: WechatMiniprogram.GeneralCallbackResult) => T
}

// 基本的请求方法实例
type BaseRequest = <T extends AnyResType>(requestOption: BaseRequestOptions<T>) => Promise<T>

// 封装好http method的请求实例
type BaseRequestWithMethod = BaseRequest & {
  get: BaseRequest
  post: BaseRequest
  put: BaseRequest
  delete: BaseRequest
}

const baseRequest: BaseRequest = function <T extends AnyResType = AnyResType>(requestOption: BaseRequestOptions<T>) {
  return new Promise<T>((resolve) => {
    // 这里配置自定义的header
    const header = {}
    if (requestOption.header) {
      requestOption.header = {
        ...header,
        ...requestOption.header,
      }
    } else {
      requestOption.header = header
    }
    // 是否显示loading，显示mask用于阻止用户多次点击
    if (requestOption.loading) {
      showLoading()
    }

    const start = Date.now()
    // 请求成功回调处理
    if (requestOption.successHandler) {
      // 如果有传入successHandler，就只使用successHandler进行特殊处理
      const handler = requestOption.successHandler
      requestOption.success = (result) => {
        // 是否打印请求结果
        if (requestOption.log) {
          Logger.console(
            '请求URL:' + requestOption.url + ' 成功，参数：',
            requestOption.data,
            '，请求结果：',
            result.data,
            '\n请求用时:',
            Date.now() - start,
          )
        }
        const afterProcessResult = handler(result)
        resolve(afterProcessResult)
      }
    } else {
      // 否则就只使用generalSuccessHandler进行通用处理或者generalSuccessHandler不存在则不处理直接返回
      requestOption.success = (result) => {
        const cost_time = Date.now() - start

        if (requestOption.log) {
          Logger.console(`✔ ${requestOption.url} 用时 ${cost_time} ms\n`, result.data)
        }

        const data = requestOption.generalSuccessHandler ? requestOption.generalSuccessHandler(result) : result.data
        resolve(data)
      }
    }

    // 请求失败回调处理
    if (requestOption.failHandler) {
      const handler = requestOption.failHandler
      requestOption.fail = (err) => {
        if (requestOption.log) {
          Logger.error('✘请求URL:' + requestOption.url + ' 失败，原因：' + err.errMsg, requestOption.data)
        }
        resolve(handler(err))
      }
    } else {
      requestOption.fail = (err) => {
        if (requestOption.log) {
          Logger.error('✘请求URL:' + requestOption.url + ' 失败，失败原因：' + err.errMsg, requestOption.data)
        }
        const data = requestOption.generalFailHandler ? requestOption.generalFailHandler(err) : (err as unknown as T)
        resolve(data)
      }
    }

    // 请求发起时的提示
    if (requestOption.log) {
      Logger.console(`» 发起请求 ${requestOption.url} 参数：\n`, requestOption.data)
    }

    wx.request({
      ...requestOption,
      complete() {
        if (requestOption.loading) {
          hideLoading()
        }
      },
    })
  })
}

const baseRequestWithMethod = baseRequest as BaseRequestWithMethod

// 仿照axios，添加get post put delete方法
;(['get', 'post', 'put', 'delete'] as const).forEach((method) => {
  baseRequestWithMethod[method] = (requestOption) => {
    return baseRequest({
      ...requestOption,
      method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE',
    })
  }
})

export { baseRequestWithMethod as baseRequest }
