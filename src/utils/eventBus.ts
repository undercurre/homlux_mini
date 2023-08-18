import mitt, { Emitter } from 'mitt'

type Events = {
  // 从websocket接受到信息 start
  bind_device: {
    deviceId: string
    proType: string
  } // 绑定子设备
  wsReceive: {
    result: {
      eventData: IAnyObject
      eventType: keyof typeof WSEventType
    }
  }
  group_device_result_status: {
    devId: string
    modelName: string
    errCode: number
  }
  // 从websocket接受到信息 end
  deviceEdit: void
  sceneEdit: void
  homeInfoEdit: void
  invite_user_house: void
  scene_device_result_status: {
    devId: string
    modelName: string
    sceneId: string
    errCode: number // 0 成功，1-失败
  }
  scene_upt: {
    eventType: keyof typeof WSEventType
  }
  scene_add: {
    eventType: keyof typeof WSEventType
  }
  scene_del: {
    eventType: keyof typeof WSEventType
  }
  scene_enabled: {
    eventType: keyof typeof WSEventType
  }

  // 用户退出
  del_house_user: {
    userId: string
  }
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
  scene_device_result_status: 'scene_device_result_status ', // 创建、编辑场景结果
  group_device_result_status: 'group_device_result_status', // 移动房间、创建分组结果
  screen_online_status_sub_device: 'screen_online_status_sub_device', // 子设备在线状态更新
  screen_online_status_wifi_device: 'screen_online_status_wifi_device', // wifi 设备在线状态更新
  screen_move_sub_device: 'screen_move_sub_device', // 智慧屏设备变更
  project_change_house: 'project_change_house', // 工程移交
  change_house: 'change_house', // 家庭转让
  scene_add: 'scene_add', // 场景更新
  scene_upt: 'scene_upt', // 创建场景
  scene_del: 'scene_del', // 场景删除
  scene_enabled: 'scene_enabled', //场景使能切换
}

export const emitter: Emitter<Events> = mitt<Events>()
