export * from './request/index'
export * from './is'
export * from './storage'
export * from './service'
export * from './aesUtil'
export * from './strUtil'
export * from './eventBus'
export * from './host'
export * from './validate'
export * from './system'
export * from './log'
export * from './deviceModel'
export * from './network'
export * from './capacity'
export * from './sort'
export * from './nameFormater'

import { PRO_TYPE, SCREEN_PID, getModelName } from '../config/index'
import { isEmptyObject, isNullOrUnDef } from './is'

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
export function unique<T = IAnyObject>(arr: Array<T>, key: keyof T) {
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
 * @param end 距离上次执行时间小于wait时，是否延时执行并确保执行最后一次
 * FIXME 实际引用时，this类型无法推导，暂时直接在参数中指定为 any
 */
export function throttle<T extends (...args: any[]) => unknown>(fn: T, wait = 500, immediate = true, end = true) {
  let lastInvoke = 0
  let timeId = 0

  return function (this: IAnyObject, ...args: unknown[]) {
    const current = Date.now()

    if ((immediate && lastInvoke === 0) || current - lastInvoke > wait) {
      fn.apply(this, args)
      lastInvoke = current
      clearTimeout(timeId) // 清除历史的定时器
    } else if (end) {
      clearTimeout(timeId)
      timeId = setTimeout(() => {
        fn.apply(this, args)
      }, wait)
    }
  }
}

/**
 * 防抖函数
 * @param fn
 * @param delay
 */
export function debounce<T extends (...args: any[]) => unknown>(fn: T, delay = 500) {
  let timer = 0

  return function (...args: unknown[]) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn(args)
    }, delay)
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
 * @description 类似 lodash.isEqual()
 * 比较对象是否相等
 */
export function isEqual(a: IAnyObject, b: IAnyObject) {
  // 如果两个值是同一个对象，返回true
  if (a === b) return true

  // 如果其中一个值是undefined，而另一个不是，返回false
  if (a === undefined || b === undefined) return false

  // 检查类型是否相同
  const typeA = typeof a
  const typeB = typeof b
  if (typeA !== typeB) return false

  // 如果是引用类型，进行深入比较
  if (typeA === 'object') {
    // 如果是数组
    if (Array.isArray(a)) {
      if (!Array.isArray(b)) return false
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (!isEqual(a[i], b[i])) return false
      }
      return true
    }

    // 如果是普通对象
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    for (const key of keysA) {
      if (!isEqual(a[key], b[key])) return false
    }
    return true
  }

  // 如果是函数，直接比较函数字符串
  if (typeA === 'function') {
    return a.toString() === b.toString()
  }

  // 对于其他类型，使用===比较
  return a === b
}

/**
 * @description 判断某扁平设备，是否亮灯设备
 * !! ButtonMode 0 普通面板或者关联开关 2 场景 3 关联灯
 */
export function isLightOn(device: Device.DeviceItem): boolean {
  // 网关、灯组、离线设备直接排除
  if (device.deviceType === 1 || device.deviceType === 4 || !device.onLineStatus) {
    return false
  }
  // 灯
  if (device.proType === PRO_TYPE.light) {
    return !!device.mzgdPropertyDTOList['light'].power
  }

  // 面板 // !! 多开开关的各路开关分别计数
  const modelName = device?.switchInfoDTOList && device.switchInfoDTOList[0]?.switchId

  return !!(
    (
      modelName &&
      device.proType === PRO_TYPE.switch &&
      device.mzgdPropertyDTOList[modelName]?.power &&
      !device.mzgdPropertyDTOList[modelName]?.ButtonMode
    ) // 2和3不计数
  )
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

/**
 * 将设备列表扁平化，开关面板各个按键作为独立的设备
 * @param originList 源列表
 * @returns 扁平化的列表
 */
export const deviceFlatten = function (originList: Device.DeviceItem[]) {
  const list = [] as Device.DeviceItem[]
  originList.forEach((device) => {
    // 过滤属性数据不完整的数据
    // WIFI设备可以不过滤此条件
    const noProps = isNullOrUnDef(device.mzgdPropertyDTOList) || isEmptyObject(device.mzgdPropertyDTOList)
    if (noProps && device.deviceType !== 3 && device.proType !== PRO_TYPE.gateway) {
      return
    }
    // 开关面板需要前端拆分处理
    if (device.proType === PRO_TYPE.switch) {
      device.switchInfoDTOList?.forEach((switchItem) => {
        list.push({
          ...device,
          property: device.mzgdPropertyDTOList[switchItem.switchId],
          mzgdPropertyDTOList: {
            [switchItem.switchId]: device.mzgdPropertyDTOList[switchItem.switchId],
          },
          switchInfoDTOList: [switchItem],
          uniId: `${device.deviceId}:${switchItem.switchId}`,
          orderNum: switchItem.orderNum,
        })
      })
    }
    // 所有可显示的设备都用这种方案插值
    else if (device.proType !== PRO_TYPE.gateway || !SCREEN_PID.includes(device.productId)) {
      const modelName = getModelName(device.proType, device.productId)
      const property = noProps ? ({} as Device.mzgdPropertyDTO) : device.mzgdPropertyDTOList[modelName]
      // 如果没有设备属性（网关暂除外），则直接置为0
      // ! WIFI设备，较低机率出现设备在线但属性为空的情况
      const onLineStatus = device.proType === PRO_TYPE.gateway || device.mzgdPropertyDTOList ? device.onLineStatus : 0
      list.push({
        ...device,
        onLineStatus,
        uniId: device.deviceId,
        property,
        mzgdPropertyDTOList: { [modelName]: property },
      })
    }
  })

  // 排序算法：灯组类型靠前；orderNum为0时置末端；再按orderNum升序；再按入网时间createdTime升序
  return list.sort((a, b) => {
    if (a.deviceType === 4 && b.deviceType !== 4) {
      return -1
    } else if (a.deviceType !== 4 && b.deviceType === 4) {
      return 1
    } else if (a.orderNum === 0 && b.orderNum !== 0) {
      return 1
    } else if (a.orderNum !== 0 && b.orderNum === 0) {
      return -1
    } else if (a.orderNum !== b.orderNum) {
      return a.orderNum - b.orderNum
    } else if (a.createdTime !== b.createdTime) {
      return a.createdTime?.localeCompare(b.createdTime)
    } else {
      return a.uniId?.localeCompare(b.uniId)
    }
  })
}

/**
 * 生成随机数
 */
export const getRandomNum = function (min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min
}
