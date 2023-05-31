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

/**
 * 根据面板ID和面板开关获取主动、被动的面板开关
 */
export async function getRelDeviceInfo(
  data: { primaryDeviceId: string; primarySwitchId: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<{
    primaryRelDeviceInfo: Device.IMzgdRelGetDTO[]
    secondRelDeviceInfo: Device.IMzgdRelGetDTO[]
  }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/getRelDeviceInfo',
    data,
  })
}

/**
 * 编辑面板和灯关联
 * @param lampDevices 关联设备ID:格式 deviceId, 灯Id,逗号分隔 )
 * @param primaryDeviceId
 * @param primarySwitchId
 */
export async function editLampAndSwitchAssociated(
  data: { lampDevices: string; primaryDeviceId: string; primarySwitchId: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/editLampAndSwitchAssociated',
    data,
  })
}

/**
 * 删除面板和灯关联
 */
export async function delLampAndSwitchAssociated(
  data: { deviceId: string; switchId: string; relIds: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/delLampAndSwitchAssociated',
    data,
  })
}

/**
 * 编辑面板和面板关联
 * @param secondSwitchs 关联设备ID:格式 deviceId-switch, 逗号分隔
 */
export async function editSwitchAndSwitchAssociated(
  data: { primaryDeviceId: string; primarySwitchId: string; secondSwitchs: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/editSwitchAndSwitchAssociated',
    data,
  })
}

/**
 * 删除面板和面板关联
 * @param relIds 面板关联Id,逗号分隔 )
 */
export async function delSwitchAndSwitchAssociated(data: { relIds: string }, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/delSwitchAndSwitchAssociated',
    data,
  })
}

/**
 * 根据家庭id获取面板是否已经关联过灯
 */
export async function getLampDeviceByHouseId(data: { houseId: string }, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Array<Device.IMzgdLampDeviceInfoDTO>>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/device/getLampDeviceByHouseId',
    data,
  })
}
