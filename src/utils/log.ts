import dayjs from 'dayjs'

const log = wx.getRealtimeLogManager()

/**
 * @name 日志工具
 * @description
 * Logger.debug Logger.error Logger.log 同时上报到We分析
 * Logger.debug Logger.error Logger.trace 带时间戳
 */
export const Logger = {
  // 普通日志，仅在各端本地输出
  console(...args: unknown[]) {
    console.log(...args)
  },

  // 带时间的日志，仅在各端本地输出
  trace(...args: unknown[]) {
    console.log(`${dayjs().format('HH:mm:ss.SSS')} |`, ...args)
  },

  // 普通日志，同时上报到 We
  log(...args: unknown[]) {
    console.log(...args)
    log.info(args)
  },

  // 特殊调试信息，同时上报到 We // ! 开发工具不支持 console.debug
  debug(...args: unknown[]) {
    console.warn(`${dayjs().format('HH:mm:ss.SSS')} |`, ...args)
    log.warn(args)
  },

  // 重点调试信息，同时上报到 We
  error(...args: unknown[]) {
    console.error(`${dayjs().format('HH:mm:ss.SSS')} |`, ...args)
    log.error(args)
  },

  // 设置We中的过滤标签，便于检索
  setFilter(msg: string) {
    log.setFilterMsg(msg)
  },
  addFilter(msg: string) {
    log.addFilterMsg(msg)
  },
}
