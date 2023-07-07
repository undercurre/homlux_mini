import { mzaioRequest } from '../utils/index'

/**
 * 查询美居家庭列表
 * @param code，美居登录后返回的授权码，正常授权流程必传，因为暂没有二次获取家庭列表的路径
 */
export async function getMeijuHomeList(code?: string) {
  return await mzaioRequest.post<{ mideaHouseList: Auth.MeijuHome[] }>({
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
export async function bindMeiju({ houseId, mideaHouseId }: { houseId: string; mideaHouseId: string }) {
  return await mzaioRequest.post<Auth.MeijuDevice[]>({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/bindHouseRoom',
    data: { houseId, mideaHouseId },
  })
}

/**
 * 获取美居设备列表（已授权）
 */
export async function getMeijuDeviceList() {
  return await mzaioRequest.post<Auth.MeijuDevice[]>({
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
  return await mzaioRequest.post<Auth.MeijuDevice[]>({
    log: true,
    loading: true,
    url: '/v1/thirdparty/midea/device/syncMideaDevice',
    data: { houseId },
  })
}

/**
 * 查询第三方授权
 * @param houseId Homlux 家庭id
 */
export async function queryUserThirdPartyInfo(houseId: string) {
  return await mzaioRequest.post<Auth.AuthItem[]>({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/queryUserThirdPartyInfo',
    data: { houseId },
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
    data: { houseId },
  })
}
