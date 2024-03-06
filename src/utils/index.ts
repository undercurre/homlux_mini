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

import { PRO_TYPE, getModelName } from '../config/index'
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
 * @description 设备数量统计
 * @param ButtonMode 0 普通面板或者关联开关 2 场景 3 关联灯
 * @returns {
 *  lightOnCount: 统计多少灯打开（多开开关仍分别计数）（取代云端deviceLightOnNum）
 *  lightCount: 灯与面板总数量（不排除关联，面板按拆分设备计数）
 * }
 */
export function deviceCount(list: Device.DeviceItem[]): Record<string, number> {
  let lightOnCount = 0
  let lightCount = 0

  list?.forEach((device) => {
    switch (device.proType) {
      case PRO_TYPE.light:
        // 灯数及亮灯数不计算灯组
        if (device.deviceType === 4) {
          return
        }
        lightCount++
        if (!device.onLineStatus) break
        if (device.mzgdPropertyDTOList['light'].power) {
          lightOnCount++
        }
        break
      case PRO_TYPE.switch:
        device.switchInfoDTOList.forEach((switchItem) => {
          lightCount++
          if (
              device.onLineStatus &&
              device.mzgdPropertyDTOList && // 避免个别设备未上报数据导致的整个页面异常
              device.mzgdPropertyDTOList[switchItem.switchId]?.power &&
              !device.mzgdPropertyDTOList[switchItem.switchId].ButtonMode
          ) {
            lightOnCount++
          }
        })
        break
        // 网关及其他类型，不作统计
      case PRO_TYPE.gateway:
      default:
    }
  })

  return {
    lightOnCount,
    lightCount,
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

export const deviceFlatten = function (originList: Device.DeviceItem[]) {
  const list = [] as Device.DeviceItem[]
  originList.forEach((device) => {
    // 过滤属性数据不完整的数据
    // WIFI设备可以不过滤此条件
    const noProps = isNullOrUnDef(device.mzgdPropertyDTOList) || isEmptyObject(device.mzgdPropertyDTOList)
    if (noProps && device.deviceType !== 3) {
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
    // 所有非网关、可显示的设备都用这种方案插值
    else if (device.proType !== PRO_TYPE.gateway) {
      const modelName = getModelName(device.proType, device.productId)
      const property = noProps ? ({} as Device.mzgdPropertyDTO) : device.mzgdPropertyDTOList[modelName]
      const onLineStatus = device.mzgdPropertyDTOList ? device.onLineStatus : 0 // 如果没有设备属性，则直接置为0 // ! WIFI设备，较低机率出现设备在线但属性为空的情况
      list.push({
        ...device,
        onLineStatus,
        uniId: device.deviceId,
        property,
        mzgdPropertyDTOList: { [modelName]: property },
      })
    }
  })

  // 排序算法：灯组类型靠前；再按orderNum升序；再按设备id升序
  return list.sort((a, b) => {
    if (a.deviceType === 4 && b.deviceType !== 4) {
      return -1
    } else if (a.deviceType !== 4 && b.deviceType === 4) {
      return 1
    } else {
      return a.orderNum !== b.orderNum ? a.orderNum - b.orderNum : parseInt(a.deviceId) - parseInt(b.deviceId)
    }
  })
}

// 计算范围约束值
export const rangeValue = (_val: number, _min: number, _max: number) => {
  return Math.min(Math.max(_val, _min), _max)
}

/**
 * 检查数据有没有重复项
 * @param data 需要比对的数据
 * @returns 若有则返回首个发现的重复项，没有则返回false
 */
export const hasRepeat = (data: (number | string)[]) => {
  const list = [...data].sort() // sort 会改变源数据，需要先复制再处理
  for (let i = 0; i < list.length - 1; ++i) {
    if (list[i] === list[i + 1]) {
      return list[i]
    }
  }
  return false
}

export const deviceFlatten = function (originList: Device.DeviceItem[]) {
  const list = [] as Device.DeviceItem[]
  originList.forEach((device) => {
    // 过滤属性数据不完整的数据
    // WIFI设备可以不过滤此条件
    const noProps = isNullOrUnDef(device.mzgdPropertyDTOList) || isEmptyObject(device.mzgdPropertyDTOList)
    if (noProps && device.deviceType !== 3) {
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
    // 所有非网关、可显示的设备都用这种方案插值
    else if (device.proType !== PRO_TYPE.gateway) {
      const modelName = getModelName(device.proType, device.productId)
      const property = noProps ? ({} as Device.mzgdPropertyDTO) : device.mzgdPropertyDTOList[modelName]
      const onLineStatus = device.mzgdPropertyDTOList ? device.onLineStatus : 0 // 如果没有设备属性，则直接置为0 // ! WIFI设备，较低机率出现设备在线但属性为空的情况
      list.push({
        ...device,
        onLineStatus,
        uniId: device.deviceId,
        property,
        mzgdPropertyDTOList: { [modelName]: property },
      })
    }
  })

  // 排序算法：灯组类型靠前；再按orderNum升序；再按设备id升序
  return list.sort((a, b) => {
    if (a.deviceType === 4 && b.deviceType !== 4) {
      return -1
    } else if (a.deviceType !== 4 && b.deviceType === 4) {
      return 1
    } else {
      return a.orderNum !== b.orderNum ? a.orderNum - b.orderNum : parseInt(a.deviceId) - parseInt(b.deviceId)
    }
  })
}
