import { delay, mzaioRequest } from '../utils/index'

/**
 * 设备管理-根据家庭id查询全屋的设备
 */
export async function queryAllDevice(houseId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Device.DeviceItem[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/queryDeviceInfoByHouseId',
    data: {
      houseId,
    },
  })
}

/**
 * 全屋设备开或者关
 * 1：开 0：关
 */
export async function allDevicePowerControl(data: { houseId: string; onOff: number }, options?: { loading?: boolean }) {
  return await mzaioRequest.post<IAnyObject>({
    log: false,
    loading: options?.loading ?? false,
    url: '/v1/device/deviceControlByHouseId',
    data: data,
  })
}

/**
 * 设备管理-根据家庭id房间id查询房间所有设备
 */
export async function queryDeviceList(data: { houseId: string; roomId: string }, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Device.DeviceItem[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/queryDeviceInfoByRoomId',
    data,
  })
}

/**
 * 设备控制-根据家庭id房间id查询房间除了网关的子设备
 */
export async function querySubDeviceList(data: { houseId: string; roomId: string }, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Device.DeviceItem[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/querySubDeviceInfoByRoomId',
    data,
  })
}

/**
 * 设备管理-根据设备Id获取设备明细
 * roomId可选，传入roomId可减少云端查询步骤
 */
export async function queryDeviceInfoByDeviceId(
  data: { deviceId: string; roomId?: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<Device.DeviceItem>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/queryDeviceInfoByDeviceId',
    data,
  })
}

/**
 * 查询设备在线离线状态
 * 设备类型（1:网关 2:子设备 3:wifi
 */
export async function queryDeviceOnlineStatus(
  data: { deviceType: '1' | '2' | '3'; sn?: string; deviceId?: string },
  options?: { loading?: boolean },
) {
  // 	"onlineStauts": 在线离线状态(0:离线1:在线
  return await mzaioRequest.post<{ deviceId: string; onlineStatus: number }>({
    log: false,
    loading: options?.loading ?? false,
    url: '/v1/device/queryDeviceOnlineStatus',
    data,
  })
}

/**
 * 根据产品id查网关产品信息
 */
export async function queryProtypeInfo(
  data: { pid?: string; proType?: string; mid?: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<{
    icon: string
    productId: string
    productName: string
    proType: string
    switchNum: number
  }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/queryProtypeInfo',
    data,
  })
}

/**
 * 配网-绑定
 */
export async function bindDevice(
  data: {
    houseId?: string
    roomId?: string
    sn?: string
    deviceId?: string
    deviceName: string
  },
  options?: { loading?: boolean },
) {
  const res = await mzaioRequest.post<{ deviceId: string; isBind: boolean; msg: string }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/bindDevice',
    data,
  })

  await delay(1500) // 延迟1.5s，防止绑定后台逻辑还没执行完毕

  return res
}

/**
 * 设备控制-下发命令
 */
export async function controlDevice(
  data: {
    customJson?: IAnyObject
    deviceId: string
    method: string
    topic: string
    inputData: IAnyObject[]
  },
  option?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: option?.loading || false,
    url: '/v1/device/down',
    data: data,
  })
}

/**
 * 设备控制-下发命令
 */
export async function sendCmdAddSubdevice(
  data: { deviceId: string; expire: number; buzz: 0 | 1 },
  options?: { loading?: boolean },
) {
  return await controlDevice(
    {
      deviceId: data.deviceId,
      topic: '/subdevice/add',
      method: 'subdeviceAdd',
      inputData: [
        {
          expire: data.expire,
          buzz: data.buzz,
        },
      ],
    },
    options,
  )
}

/**
 * 云端找一找接口
 * Identify 闪多少秒
 */
export async function findDevice(
  { gatewayId, devId, ep = 1, Identify = 3 }: { gatewayId: string; devId: string; ep?: number; Identify?: number },
  options?: { loading?: boolean },
) {
  return await controlDevice(
    {
      topic: '/subdevice/control',
      deviceId: gatewayId,
      method: 'deviceFind',
      inputData: [
        {
          devId,
          ep,
          Identify,
        },
      ],
    },
    options,
  )
}

/**
 * 检查ota版本
 */
export async function checkOtaVersion(deviceId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
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
export async function editDeviceInfo(
  data: {
    deviceId: string
    deviceName?: string
    houseId?: string
    roomId?: string
    type?: string
    switchId?: string
    switchName?: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/update',
    data,
  })
}

/**
 * 批量编辑设备(开关)
 * @param data
 * @param options
 */
export async function batchUpdate(
  data: {
    deviceInfoUpdateVoList: Device.DeviceInfoUpdateVo[]
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<{ isSuccess: boolean }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/batchUpdate',
    data,
  })
}

/**
 * 设备管理-删除设备
 * 网关需要传sn，子设备传子设备的deviceId代替sn
 */
export async function deleteDevice(
  data: { deviceId: string; deviceType: number; sn: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/delDevice',
    data,
  })
}

/**
 * 批量编辑设备(开关)
 * @param data
 * @param options
 */
export async function batchDeleteDevice(
  data: {
    deviceBaseDeviceVoList: Device.DeviceBaseDeviceVo[]
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<{ isSuccess: boolean }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/batchDelDevice',
    data,
  })
}

/**
 * 保存设备顺序
 *
 */
export async function saveDeviceOrder(data: Device.OrderSaveData, options?: { loading?: boolean }) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/saveDeviceNum',
    data,
  })
}

/**
 * deviceIds: 关联设备ID:格式 1 按键开关 deviceId-switchId 2 子设备 deviceId
 * relType: 关联类型: 0:关联灯类型 1:关联开关类型
 */
export async function createAssociated(
  data: { deviceIds: string[]; relType: '0' | '1' },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/createAssociated',
    data,
  })
}

export async function updateAssociated(
  data: {
    relType: '0' | '1'
    lightRelId?: string
    switchRelId?: string
    deviceIds: string[]
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/updateAssociated',
    data,
  })
}

/**
 * 删除整个关联或者部分设备关联
 * 如果传入deviceIds，删除deviceIds中的关联
 * 如果不传deviceIds，删除整个lightRelId或者switchRelId关联
 */
export async function delAssociated(
  data: {
    relType: '0' | '1'
    lightRelId?: string
    switchRelId?: string
    deviceIds?: string[]
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/delAssociated',
    data,
  })
}

/**
 * 设备替换
 * 需要在前端验证设备是否可替换
 */
export async function deviceReplace(
  data: {
    newDevId: string
    oldDevId: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/deviceReplace',
    data,
  })
}

/**
 * 根据sn去查设备的mac、图片、品类
 */
export async function checkDevice(
  data: { dsn?: string; mac?: string; productId?: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<Device.MzgdProTypeDTO>({
    log: false,
    loading: options?.loading ?? false,
    url: '/v1/device/checkDevice',
    data,
  })
}

/**
 * 根据面板ID和面板开关获取关联的灯
 */
export async function getRelLampInfo(
  data: { primaryDeviceId: string; primarySwitchId: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<{ lampRelList: Device.IMzgdLampRelGetDTO[] }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/getRelLampInfo',
    data,
  })
}
