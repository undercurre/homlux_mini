import { strUtil } from './index'

const toString = Object.prototype.toString

/**
 * @description: 判断值是否未某个类型
 */
export function is(val: unknown, type: string) {
  return toString.call(val) === `[object ${type}]`
}

/**
 * @description:  是否为函数
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function isFunction<T = Function>(val: unknown): val is T {
  return is(val, 'Function')
}

/**
 * @description: 是否已定义
 */
export const isDef = <T = unknown>(val?: T): val is T => {
  return typeof val !== 'undefined'
}

export const isUnDef = <T = unknown>(val?: T): val is T => {
  return !isDef(val)
}
/**
 * @description: 是否为对象
 */
export const isObject = <T = IAnyObject>(val: unknown): val is T => {
  return is(val, 'Object')
}

/**
 * @description:  是否为时间
 */
export function isDate(val: unknown): val is Date {
  return is(val, 'Date')
}

/**
 * @description:  是否为数值
 */
export function isNumber(val: unknown): val is number {
  return is(val, 'Number')
}

/**
 * @description:  是否为AsyncFunction
 */
export function isAsyncFunction<T = unknown, U = unknown>(val: unknown): val is (...args: U[]) => Promise<T> {
  return is(val, 'AsyncFunction')
}

/**
 * @description:  是否为promise
 */
export function isPromise<T = unknown>(val: unknown): val is Promise<T> {
  return is(val, 'Promise') && isObject(val) && isFunction(val.then) && isFunction(val.catch)
}

/**
 * @description:  是否为字符串
 */
export function isString(val: unknown): val is string {
  return is(val, 'String')
}

/**
 * @description:  是否为boolean类型
 */
export function isBoolean(val: unknown): val is boolean {
  return is(val, 'Boolean')
}

/**
 * @description:  是否为数组
 */
export function isArray<T = unknown>(val: unknown): val is Array<T> {
  return Array.isArray(val)
}

export function isNull(val: unknown): val is null {
  return val === null
}

export function isNullOrUnDef(val: unknown): val is null | undefined {
  return isUnDef(val) || isNull(val)
}

export function isNotExist(val: unknown): val is null | undefined {
  return isNullOrUnDef(val) || Number.isNaN(val)
}

// 是否空对象
export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

/**
 * 检查是否有效的Homlux二维码链接
 * @param url
 */
export function isValidHomluxLink(url: string) {
  const pageParams = strUtil.getUrlParams(url) as IAnyObject

  return url.includes('meizgd.com/homlux/qrCode.html') && ['01', '02', '10'].includes(pageParams.mode)
}
