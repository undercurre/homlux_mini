import { mzaioRequest } from '../utils/index'

/**
 * 查询用户信息
 */
export async function queryUserInfo() {
  return await mzaioRequest.post<User.UserInfo>({
    log: false,
    loading: false,
    url: '/v1/mzgd/user/queryWxUserInfo',
  })
}

/**
 * 解析微信二维码接口
 */
export async function queryWxImgQrCode(file: ArrayBuffer | string) {
  console.log('111', file)
  return await mzaioRequest.post<{ qrCodeUrl: string }>({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/queryWxImgQrCode',
    header: {
      'content-type': 'multipart/form-data',
    },
    data: {
      file,
    },
  })
}

/**
 * 获取oss上传地址接口
 */
export async function getUploadFileForOssInfo(fileName: string) {
  return await mzaioRequest.post<{ certification: string; downloadUrl: string; uploadUrl: string }>({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/uploadFileForOss',
    data: {
      fileName,
    },
  })
}
