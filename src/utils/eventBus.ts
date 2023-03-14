import mitt, { Emitter } from 'mitt'

type Events = {
  wsReceive: {
    result: {
      eventData: IAnyObject
      eventType: keyof typeof WSEventType
    }
  } // 从websocket接受到信息
  deviceEdit: void
  sceneEdit: void
}

export const WSEventType = {
  device_property: 'device_property',
  device_online_status: 'device_online_status',
  device_offline_status: 'device_offline_status', // 设备强绑后离线事件
  device_del: 'device_del',
  room_del: 'room_del',
  device_replace: 'device_replace'
}

export const emitter: Emitter<Events> = mitt<Events>()
