import { mzaioRequest } from '../utils/index'

/**
 * 设备管理-根据家庭id查询全屋的设备
 */
export async function queryAllDevice(houseId: string) {
  return await mzaioRequest.post<Device.DeviceItem[]>({
    log: false,
    loading: true,
    url: '/v1/device/queryDeviceInfoByHouseId',
    data: {
      houseId,
    },
  })
}

/**
 * 设备管理-根据家庭id房间id查询房间所有设备
 */
export async function queryDeviceList(houseId: string, roomId: string) {
  return await mzaioRequest.post<Device.DeviceItem[]>({
    log: false,
    loading: true,
    url: '/v1/device/queryDeviceInfoByRoomId',
    data: {
      houseId,
      roomId,
    },
  })
}

/**
 * 设备控制-根据家庭id房间id查询房间除了网关的子设备
 */
export async function querySubDeviceList(houseId: string, roomId: string) {
  return await mzaioRequest.post<Device.DeviceItem[]>({
    log: false,
    loading: true,
    url: '/v1/device/querySubDeviceInfoByRoomId',
    data: {
      houseId,
      roomId,
    },
  })
}

/**
 * 设备管理-根据设备Id获取设备明细
 * roomId可选，传入roomId可减少云端查询步骤
 */
export async function queryDeviceInfoByDeviceId(deviceId: string, roomId?: string) {
  return await mzaioRequest.post<Device.DeviceItem>({
    log: false,
    loading: false,
    url: '/v1/device/queryDeviceInfoByDeviceId',
    data: { deviceId, roomId },
  })
}

/**
 * 查询设备在线离线状态
 * 设备类型（1:网关 2:子设备 3:wifi
 */
export async function queryDeviceOnlineStatus(params: { deviceType: '1' | '2' | '3'; sn?: string; deviceId?: string }) {
  // 	"onlineStauts": 在线离线状态(0:离线1:在线
  return await mzaioRequest.post<{ deviceId: string; onlineStatus: number }>({
    log: false,
    loading: false,
    url: '/v1/device/queryDeviceOnlineStatus',
    data: params,
  })
}

/**
 * 根据产品id查产品信息
 * @param params
 */
export async function queryProtypeInfo(params: {
  pid?: string
  proType?: string,
  mid?: string
}) {
  return await mzaioRequest.post<{
    icon: string
    productId: string
    productName: string
    proType: string
  }>({
    log: true,
    loading: false,
    url: '/v1/device/queryProtypeInfo',
    data: params,
  })
}

/**
 * 配网-绑定
 */
export async function bindDevice(params: {
  houseId?: string
  roomId?: string
  sn?: string
  deviceId?: string
  deviceName: string
}) {
  return await mzaioRequest.post<{ deviceId: string; isBind: boolean; msg: string }>({
    log: true,
    loading: false,
    url: '/v1/device/bindDevice',
    data: params,
  })
}

/**
 * 设备控制-下发命令
 */
export async function controlDevice(
  params: {
    customJson?: IAnyObject
    deviceId: string
    method: string
    topic: string
    inputData: IAnyObject[]
  },
  option?: { loading: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: false,
    loading: option?.loading || false,
    url: '/v1/device/down',
    data: params,
  })
}

/**
 * 设备控制-下发命令
 */
export async function sendCmdAddSubdevice(params: { deviceId: string; expire: number; buzz: 0 | 1 }) {
  return await controlDevice({
    deviceId: params.deviceId,
    topic: '/subdevice/add',
    method: 'subdeviceAdd',
    inputData: [
      {
        expire: 60,
        buzz: 1,
      },
    ],
  })
}

/**
 * 检查ota版本
 */
export async function checkOtaVersion(deviceId: string) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    url: '/v1/device/checkOtaVersion',
    data: {
      deviceId,
    },
  })
}

/**
 * 设备管理-修改设备的名称、按键名称、所在房间
 * type:0 修改设备名字，传入设备名称
 * 1：修改房间
 * 2：同时修改设备名字、房间
 * 3：修改开关名字
 */
export async function editDeviceInfo(data: {
  deviceId: string
  deviceName?: string
  houseId?: string
  roomId?: string
  type?: string
  switchId?: string
  switchName?: string
}) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: true,
    url: '/v1/device/update',
    data,
  })
}

/**
 * 设备管理-删除设备
 * 网关需要传sn，子设备传子设备的deviceId代替sn
 */
export async function deleteDevice(data: { deviceId: string; deviceType: number; sn: string }) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    url: '/v1/device/delDevice',
    data,
  })
}

/**
 * 保存设备顺序
 *
 */
export async function saveDeviceOrder(data: Device.OrderSaveData) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    url: '/v1/device/saveDeviceNum',
    data,
  })
}

/**
 * deviceIds: 关联设备ID:格式 1 按键开关 deviceId-switchId 2 子设备 deviceId
 * relType: 关联类型: 0:关联灯类型 1:关联开关类型
 */
export async function createAssociated(data: { deviceIds: string[]; relType: '0' | '1' }) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    url: '/v1/device/createAssociated',
    data,
  })
}

export async function updateAssociated(data: {
  relType: '0' | '1'
  lightRelId?: string
  switchRelId?: string
  deviceIds: string[]
}) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    url: '/v1/device/updateAssociated',
    data,
  })
}

/**
 * 删除整个关联或者部分设备关联
 * 如果传入deviceIds，删除deviceIds中的关联
 * 如果不传deviceIds，删除整个lightRelId或者switchRelId关联
 */
export async function delAssociated(data: {
  relType: '0' | '1'
  lightRelId?: string
  switchRelId?: string
  deviceIds?: string[]
}) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    url: '/v1/device/delAssociated',
    data,
  })
}
