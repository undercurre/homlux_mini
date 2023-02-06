import mitt, { Emitter } from 'mitt'

type Events = {
  loginOut: undefined // 登录过期事件
}

export const emitter: Emitter<Events> = mitt<Events>()
