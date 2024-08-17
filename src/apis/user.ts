import { IApiRequestOption, mzaioRequest } from '../utils/index'

/**
 * 查询用户信息
 */
export async function queryUserInfo() {
  return await mzaioRequest.post<User.UserInfo>({
    log: true,
    loading: false,
    url: '/v1/mzgd/user/queryWxUserInfo',
  })
}

/**
 * 解析微信二维码接口
 */
export async function queryWxImgQrCode(imgUrl: string) {
  return await mzaioRequest.post<{ qrCodeUrl: string }>({
    log: true,
    loading: true,
    url: '/v1/mzgd/user/queryWxImgQrCode',
    data: {
      qrCodeDownloadUrl: imgUrl,
    },
  })
}

/**
 * 获取oss上传地址接口
 */
export async function getUploadFileForOssInfo(fileName: string) {
  return await mzaioRequest.post<{ certification: string; downloadUrl: string; uploadUrl: string }>({
    log: false,
    loading: false,
    url: '/v1/mzgd/user/uploadFileForOss',
    data: {
      fileName,
    },
  })
}

/**
 * 美智用户二维码确认授权接口
 */
export async function authQrcode(qrcode: string) {
  return await mzaioRequest.post({
    log: true,
    loading: false,
    url: '/v1/mzgd/user/mzgdUserQrcodeAuthorize',
    data: {
      qrcode,
    },
  })
}

/**
 * 保存用户消息订阅
 */
export async function saveWxSubscribe(params: { openId: string; templateIdList: string[] }) {
  return await mzaioRequest.post({
    log: true,
    loading: false,
    url: '/v1/mzgdApi/mzgdUserWxSubscribe',
    data: params,
  })
}

/**
 * 邀请家庭成员（手机号邀请）
 */
export async function inviteHouseUserForMobile(
  params: {
    houseId: string // 家庭id
    houseUserAuth: number // 家庭成员权限id，创建者：1 管理员：2 游客：3
    mobilePhone: string // 手机号
    subscribeType: number // 订阅类型 1：邀请家庭
  },
  options?: IApiRequestOption,
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/inviteHouseUserForMobile',
    data: params,
  })
}

/**
 * 用户注销账号
 */
export async function logoutWxUserInfo(
  params: {
    confirm: boolean // 是否第二次确认删除,是否强制删除
  },
  options?: IApiRequestOption,
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/logoutWxUserInfo',
    data: params,
  })
}

/**
 * 用户订阅小程序通知
 */
export async function queryUserSubscribeInfo(
  data: {
    deviceId: string
  },
  options?: IApiRequestOption,
) {
  return await mzaioRequest.post<{
    subscribeStatus: Record<string, number>
  }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/queryUserDeviceSubscribeNotifyInfo',
    data,
  })
}
