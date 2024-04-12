export function requestAnimationFrame(cb: FunctionType) {
  return setTimeout(() => {
    cb()
  }, 1000 / 30)
}
