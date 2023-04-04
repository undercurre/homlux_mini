import mitt, { Emitter } from 'mitt'

type Events = {
  // 从websocket接受到信息 start 
  bind_device: {
    deviceId: string
  }, // 绑定子设备
  wsReceive: {
    result: {
      eventData: IAnyObject
      eventType: keyof typeof WSEventType
    }
  } 
  // 从websocket接受到信息 end
  deviceEdit: void
  sceneEdit: void
  homeInfoEdit: void
}

export const WSEventType = {
  device_property: 'device_property',
  device_online_status: 'device_online_status',
  device_offline_status: 'device_offline_status', // 设备强绑后离线事件
  device_del: 'device_del',
  room_del: 'room_del',
  device_replace: 'device_replace',
  connect_success_status: 'connect_success_status',
  bind_device: 'bind_device'
}

export const emitter: Emitter<Events> = mitt<Events>()
