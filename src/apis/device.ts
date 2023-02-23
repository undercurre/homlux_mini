import { mzaiotRequest } from '../utils/index'

/**
 * 设备管理-根据家庭id查询全屋的设备
 */
export async function queryAllDevice(houseId: string) {
  return await mzaiotRequest.post<Device.DeviceItem[]>({
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
  return await mzaiotRequest.post<Device.DeviceItem[]>({
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
  return await mzaiotRequest.post<Device.DeviceItem[]>({
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
 */
export async function queryDeviceInfoByDeviceId(deviceId: string) {
  // 	"onlineStauts": 在线离线状态(0:离线1:在线
  return await mzaiotRequest.post<Device.DeviceItem>({
    log: false,
    loading: true,
    url: '/v1/device/queryDeviceInfoByDeviceId',
    data: { deviceId },
  })
}

/**
 * 查询设备在线离线状态
 * 设备类型（1:网关 2:子设备 3:wifi
 */
export async function queryDeviceOnlineStatus(params: { deviceType: '1' | '2' | '3'; sn?: string; deviceId?: string }) {
  // 	"onlineStauts": 在线离线状态(0:离线1:在线
  return await mzaiotRequest.post<{ deviceId: string; onlineStatus: number }>({
    log: false,
    loading: false,
    url: '/v1/device/queryDeviceOnlineStatus',
    data: params,
  })
}

/**
 * 配网-校验子设备mac或productId的合法性并返回品类信息
 * @param params
 */
export async function checkDevice(params: {
  mac?: string
  productId: string
  productIdType: 1 | 2 // 产品id类型，1：扫码配网的pid 2：蓝牙配网的pid
}) {
  return await mzaiotRequest.post<{
    icon: string
    isValid: boolean
    mac: string
    modelId: string
    proType: string
    productName: string
    sn: string
  }>({
    log: true,
    loading: false,
    url: '/v1/device/checkDevice',
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
  return await mzaiotRequest.post<{ deviceId: string; isBind: boolean; msg: string }>({
    log: false,
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
  return await mzaiotRequest.post<IAnyObject>({
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
  return await mzaiotRequest.post<IAnyObject>({
    log: true,
    url: '/v1/device/checkOtaVersion',
    data: {
      deviceId,
    },
  })
}

/**
 * 设备管理-修改设备的名称、所在房间
 * isSwitch: true => 编辑开关的名字
 * isSwitch: false => 编辑设备名字
 */
export async function editDeviceInfo(data: {
  deviceId: string
  deviceName: string
  houseId: string
  roomId: string
  isSwitch: boolean
  switchId?: string
  switchName?: string
}) {
  return await mzaiotRequest.post<IAnyObject>({
    log: true,
    loading: true,
    url: '/v1/device/update',
    data,
  })
}

/**
 * 设备管理-删除设备
 */
export async function deleteDevice(data: { deviceId: string; deviceType: string; sn: string; userId: string }) {
  return await mzaiotRequest.post<IAnyObject>({
    log: true,
    url: '/v1/device/delDevice',
    data,
  })
}
