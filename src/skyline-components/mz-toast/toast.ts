import { isObj } from '../common/validator'

type ToastMessage = string | number
type ToastContext = WechatMiniprogram.Component.TrivialInstance | WechatMiniprogram.Page.TrivialInstance

interface ToastOptions {
  show?: boolean
  type?: string
  mask?: boolean
  zIndex?: number
  context?: (() => ToastContext) | ToastContext
  position?: string
  duration?: number
  selector?: string
  forbidClick?: boolean
  loadingType?: string
  message?: ToastMessage
  onClose?: () => void
}

const defaultOptions = {
  type: 'text',
  mask: false,
  message: '',
  show: true,
  zIndex: 1000,
  duration: 2000,
  position: 'middle',
  forbidClick: false,
  loadingType: 'circular',
  selector: '#mz-toast',
}

let queue: WechatMiniprogram.Component.TrivialInstance[] = []
let currentOptions: ToastOptions = { ...defaultOptions }

function parseOptions(message: unknown): ToastOptions {
  return isObj(message) ? message : { message }
}

function getContext() {
  const pages = getCurrentPages()
  return pages[pages.length - 1]
}

function Toast(toastOptions: ToastOptions | ToastMessage) {
  const options = {
    ...currentOptions,
    ...parseOptions(toastOptions),
  } as ToastOptions

  const context = (typeof options.context === 'function' ? options.context() : options.context) || getContext()
  const toast = context.selectComponent(options.selector as string)

  if (!toast) {
    console.warn('未找到 mz-toast 节点，请确认 selector 及 context 是否正确')
    return
  }

  delete options.context
  delete options.selector

  toast.clear = () => {
    toast.setData({ show: false })

    if (options.onClose) {
      options.onClose()
    }
  }

  queue.push(toast)
  toast.setData(options)
  clearTimeout(toast.timer)

  if (options.duration != null && options.duration > 0) {
    toast.timer = setTimeout(() => {
      toast.clear()
      queue = queue.filter((item) => item !== toast)
    }, options.duration)
  }

  return toast
}

const createMethod = (type: string) => (options: ToastOptions | ToastMessage) =>
  Toast({
    type,
    ...parseOptions(options),
  })

Toast.loading = createMethod('loading')
Toast.success = createMethod('success')
Toast.fail = createMethod('fail')

Toast.clear = () => {
  queue.forEach((toast) => {
    toast.clear()
  })
  queue = []
}

Toast.setDefaultOptions = (options: ToastOptions) => {
  Object.assign(currentOptions, options)
}

Toast.resetDefaultOptions = () => {
  currentOptions = { ...defaultOptions }
}

export default Toast
