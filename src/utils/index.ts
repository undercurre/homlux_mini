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
export * from './log'
export * from './deviceModel'

import { PRO_TYPE } from '../config/index'

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

/**
 * 判断两个数组是否相等，元素顺序可以不同
 * @param a
 * @param b
 */
export function isArrEqual(a: Array<unknown>, b: Array<unknown>) {
  const m = new Map()
  a.forEach((o) => m.set(o, (m.get(o) || 0) + 1))
  b.forEach((o) => m.set(o, (m.get(o) || 0) - 1))
  for (const value of m.values()) {
    if (value !== 0) {
      return false
    }
  }
  return true
}

export function rpx2px(rpx: number) {
  return Math.ceil((rpx / 750) * wx.getSystemInfoSync().windowWidth)
}

/**
 * 节流函数
 * @param fn 要执行的函数
 * @param wait 延迟的时间
 * @param immediate 第一次是否立即执行
 * FIXME 实际引用时，this类型无法推导，暂时直接在参数中指定为 any
 */
export function throttle<T extends (...args: any[]) => unknown>(fn: T, wait = 500, immediate = true) {
  let lastInvoke = 0
  let timeId = 0

  return function (this: IAnyObject, ...args: unknown[]) {
    const current = Date.now()

    if ((immediate && lastInvoke === 0) || current - lastInvoke > wait) {
      fn.apply(this, args)
      lastInvoke = current
    } else {
      clearTimeout(timeId)
      timeId = setTimeout(() => {
        fn.apply(this, args)
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

  return formatPath.reduce((o: IAnyObject, k) => (o ?? {})[k], obj) ?? defaultVal
}

/**
 * @description 设备数量统计
 * @param ButtonMode 0 普通面板或者关联开关 2 场景 3 关联灯
 * @returns {
 *  deviceLightOnNum: 统计多少灯打开（开关不关联灯或者关联场景都算进去）
 *  subDeviceNum: 子设备数; 统计多少个子设备
 *  lightNum: 灯设备数
 * }
 */
export function deviceCount(list: Device.DeviceItem[]): Record<string, number> {
  let deviceLightOnNum = 0
  let subDeviceNum = 0
  let lightNum = 0

  list?.forEach((device) => {
    if (device.proType !== PRO_TYPE.gateway) {
      subDeviceNum++
    }
    if (device.proType === PRO_TYPE.light || device.proType === PRO_TYPE.switch) {
      lightNum++
    }
    if (!device.onLineStatus) return
    if (device.proType === PRO_TYPE.light) {
      if (
        (device.deviceType === 2 && device.mzgdPropertyDTOList['1'].OnOff) ||
        (device.deviceType === 3 && device.mzgdPropertyDTOList['1'].power === 'on')
      ) {
        deviceLightOnNum++
      }
    } else if (device.proType === PRO_TYPE.switch) {
      device.switchInfoDTOList.forEach((switchItem) => {
        if (
          device.mzgdPropertyDTOList && // 避免个别设备未上报数据导致的整个页面异常
          device.mzgdPropertyDTOList[switchItem.switchId]?.OnOff &&
          !device.mzgdPropertyDTOList[switchItem.switchId].ButtonMode
        ) {
          deviceLightOnNum++
        }
      })
    }
  })

  return {
    deviceLightOnNum,
    subDeviceNum,
    lightNum,
  }
}

export const getRect = function (context: any, selector: string, needAll = false) {
  return new Promise<any>((resolve, reject) => {
    wx.createSelectorQuery()
      .in(context)
      [needAll ? 'selectAll' : 'select'](selector)
      .boundingClientRect((rect) => {
        if (rect) {
          resolve(rect)
        } else {
          reject(rect)
        }
      })
      .exec()
  })
}
