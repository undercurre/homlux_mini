import dayjs from 'dayjs'

const log = wx.getRealtimeLogManager()

// /**
//  * 日志工具
//  */
export const Logger = {
  debug(...args: any[]) {
    console.debug(`【${dayjs().format('HH:mm:ss.SSS')}】`, ...args)
    log.warn(args)
  },
  log(...args: any[]) {
    console.log(`【${dayjs().format('HH:mm:ss.SSS')}】`, ...args)
    log.info(args)
  },
  error(...args: any[]) {
    console.error(`【${dayjs().format('HH:mm:ss.SSS')}】`, ...args)
    log.error(args)
  },
}
