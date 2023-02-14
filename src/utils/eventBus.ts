import mitt, { Emitter } from 'mitt'

type Events = {
  wsReceive: string // 从websocket接受到信息
}

export const emitter: Emitter<Events> = mitt<Events>()
