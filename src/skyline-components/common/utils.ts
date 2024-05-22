import { isPromise } from './validator'
import { canIUseNextTick, canIUseGroupSetData } from './version'

export function requestAnimationFrame(cb: FunctionType) {
  return setTimeout(() => {
    cb()
  }, 1000 / 30)
}

export function toPromise(promiseLike: Promise<unknown> | unknown) {
  if (isPromise(promiseLike)) {
    return promiseLike
  }

  return Promise.resolve(promiseLike)
}

export function nextTick(cb: (...args: unknown[]) => unknown) {
  if (canIUseNextTick()) {
    wx.nextTick(cb)
  } else {
    setTimeout(function () {
      cb()
    }, 1000 / 30)
  }
}
export function groupSetData(
  context: WechatMiniprogram.Page.TrivialInstance | WechatMiniprogram.Component.TrivialInstance,
  cb: FunctionType,
) {
  if (canIUseGroupSetData()) {
    context.groupSetData(cb)
  } else {
    cb()
  }
}
export function getAllRect(
  context: WechatMiniprogram.Page.TrivialInstance | WechatMiniprogram.Component.TrivialInstance,
  selector: string,
) {
  return new Promise(function (resolve) {
    context
      .createSelectorQuery()
      .selectAll(selector)
      .boundingClientRect()
      .exec(function (rect) {
        if (rect === void 0) {
          rect = []
        }
        return resolve(rect[0])
      })
  })
}
export function getRect(
  context: WechatMiniprogram.Page.TrivialInstance | WechatMiniprogram.Component.TrivialInstance,
  selector: string,
) {
  return new Promise(function (resolve) {
    context
      .createSelectorQuery()
      .select(selector)
      .boundingClientRect()
      .exec(function (rect) {
        if (rect === void 0) {
          rect = []
        }
        return resolve(rect[0])
      })
  })
}

export function range(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max)
}
