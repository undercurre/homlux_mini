import { isPromise } from './validator'

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
