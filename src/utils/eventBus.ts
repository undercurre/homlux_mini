import mitt, { Emitter } from 'mitt'

type Events = {
  // 从websocket接受到信息 start
  bind_device: {
    deviceId: string
  } // 绑定子设备
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
  invite_user_house: void
}

export const WSEventType = {
  device_property: 'device_property', // 设备状态更新
  device_online_status: 'device_online_status',
  device_offline_status: 'device_offline_status', // 设备强绑后离线事件
  device_del: 'device_del',
  room_del: 'room_del',
  device_replace: 'device_replace', // 设备替换
  connect_success_status: 'connect_success_status', // webSocket连接已建立成功?
  bind_device: 'bind_device',
  invite_user_house: 'invite_user_house', // 用户加入家庭
  control_fail: 'control_fail', // 控制失败 TODO 未发现使用逻辑，预留？
  scene_device_result_status : 'scene_device_result_status ', // 创建、编辑场景结果（成功或失败）
  group_device_result_status: 'group_device_result_status', // 移动房间结果（成功或失败）
}

export const emitter: Emitter<Events> = mitt<Events>()
