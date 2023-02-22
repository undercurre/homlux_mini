import mitt, { Emitter } from 'mitt'

type Events = {
  wsReceive: {
    result: {
      eventData: string | IAnyObject
      eventType: keyof typeof WSEventType
    }
  } // 从websocket接受到信息
}

export const WSEventType = {
  device_property: 'device_property',
  device_online_status: 'device_online_status',
  device_del: 'device_del',
  room_del: 'room_del',
}

export const emitter: Emitter<Events> = mitt<Events>()
