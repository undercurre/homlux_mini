export * from './request/index'
export * from './is'
export * from './storage'
export * from './service'
export * from './aesUtil'
export * from './strUtil'
export * from './wifiProtocol'
export * from './bleProtocol'
export * from './eventBus'
export * from './validate'
export * from './app'

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

/**
 * 根据数组其中某一个对象的key值来去重
 * @param arr
 * @param key 唯一key
 */
export function unique(arr: Array<IAnyObject>, key: string) {
  const res = new Map()

  return arr.filter((item) => !res.has(item[key]) && res.set(item[key], 1))
}

export function rpx2px(rpx: number) {
  return Math.ceil((rpx / 750) * wx.getSystemInfoSync().windowWidth)
}

/**
 * 节流函数
 * @param fn  要执行的函数
 * @param delay 延迟的时间
 */
export function throttle<T extends (...args: any) => any>(func: T, wait: number) {
  let lastInvokeTime = 0
  let timeId = 0

  return function () {
    const nowTime = Date.now()

    if (nowTime - lastInvokeTime > wait) {
      func()
      lastInvokeTime = nowTime
    } else {
      clearTimeout(timeId)
      timeId = setTimeout(() => {
        func()
      }, wait)
    }
  }
}

/**
 * @description 类似 lodash.get()
 * @param obj 引用对象
 * @param path 路径，可使用[]或.
 * @param defaultVal 可选，默认为 undefined
 * @returns 根据对象的字符串路径取值，如果该值不存在则返回默认值defaultVal
 */
export function _get(obj: object, path: string, defaultVal = undefined) {
  // path 处理成统一的.链式格式，并分割成key数组
  let formatPath = [] as string[]
  if (Array.isArray(path)) {
    formatPath = path
  } else {
    formatPath = path.replace(/\[/g, '.').replace(/\]/g, '').split('.')
  }

  return formatPath.reduce((o: any, k) => (o ?? {})[k], obj) ?? defaultVal
}
