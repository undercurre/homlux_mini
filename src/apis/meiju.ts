import {mzaioRequest} from '../utils/index'

/**
 * 查询美居家庭列表
 * @param code，美居登录后返回的授权码，正常授权流程必传，因为暂没有二次获取家庭列表的路径
 */
export async function getMeijuHomeList(code?: string) {
  return await mzaioRequest.post<{ mideaHouseList: Meiju.MeijuHome[] }>({
    log: true,
    loading: false,
    url: '/v1/mzgd/user/queryMideaUserHouseInfo',
    data: {
      code,
    },
  })
}

/**
 * 美居用户设备授权（同时返回美居设备列表）
 * @param mideaHouseId 美居家庭id
 * @param houseId Homlux 家庭id
 */
export async function bindMeiju({houseId, mideaHouseId}: { houseId: string; mideaHouseId: string }) {
  return await mzaioRequest.post<Meiju.MeijuDevice[]>({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/bindHouseRoom',
    data: {houseId, mideaHouseId},
  })
}

/**
 * 获取美居设备列表（已授权）
 */
export async function getMeijuDeviceList() {
  return await mzaioRequest.post<Meiju.MeijuDevice[]>({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/list',
    data: {},
  })
}

/**
 * 同步美居设备列表
 * @param houseId Homlux 家庭id
 */
export async function syncMeijuDeviceList(houseId: string) {
  return await mzaioRequest.post<Meiju.MeijuDevice[]>({
    log: true,
    loading: true,
    url: '/v1/thirdparty/midea/device/syncMideaDevice',
    data: {houseId},
  })
}

/**
 * 查询第三方授权
 * @param houseId Homlux 家庭id
 */
export async function queryUserThirdPartyInfo(houseId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Meiju.AuthItem[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/thirdparty/midea/device/queryUserThirdPartyInfo',
    data: {houseId},
  })
}

/**
 * 取消第三方授权
 * @param houseId Homlux 家庭id
 */
export async function delDeviceSubscribe(houseId: string) {
  return await mzaioRequest.post({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/delDeviceSubscribe',
    data: {houseId},
  })
}

/**
 * 查询设备配网指引
 * @param params.mode 配网模式 （0:AP，1:快连，2:声波，3:蓝牙，4:零配，5:WIFI,6:ZigBee）
 * @param params.sn8 设备型号
 * @param params.modelNumber 特殊设备型号（A0），如果存在则必传
 * @param params.type 设备品类(格式如AC)
 */
export async function queryGuideInfo(params: { mode: string, modelNumber?: string, sn8?: string, type: string }) {
  return await mzaioRequest.post<{
    isAutoConnect: string // 上电默认连接模式(0 不启动，1 AP，2 WIFI零配)
    mainConnectTypeDesc: string // 配网介绍
    mainConnectTypeUrlList: string[] // 主配网图列表 ["http://midea-file.oss-cn-hangzhou.aliyuncs.com/2023/7/21/9/ChjOZnQUgWmtBEMMYQjf.gif"]
    modelCode: string // 设备型号（SN8）或特殊设备型号（A0）的值
    modelType: string // modelCode类型 0:A0设备型号（SN8）,1:特殊设备型号（A0）的值
    wifiFrequencyBand: string // WIFI频段：1:2.4G，2:2.4G/5G
  }>({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/queryGuideInfo',
    data: params,
  })
}
