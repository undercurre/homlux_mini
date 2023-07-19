import dayjs from 'dayjs'

const log = wx.getRealtimeLogManager()

// /**
//  * 日志工具
//  */
export const Logger = {
  debug(...args: unknown[]) {
    console.warn(`【${dayjs().format('HH:mm:ss.SSS')}】`, ...args)
    log.warn(args)
  },
  log(...args: unknown[]) {
    console.log(`【${dayjs().format('HH:mm:ss.SSS')}】`, ...args)
    log.info(args)
  },
  error(...args: unknown[]) {
    console.error(`【${dayjs().format('HH:mm:ss.SSS')}】`, ...args)
    log.error(args)
  },
}
