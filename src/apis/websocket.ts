import { mzaioWSURL, getEnv } from '../config/index'
import { storage } from '../utils/storage'

/**
 * 建立某个房间的webSocket连接
 * @param houseId 家庭id
 */
export function connectHouseSocket(houseId: string) {
  return wx.connectSocket({
    url: mzaioWSURL[getEnv()] + houseId,
    protocols: [storage.get<string>('token') as string],
  })
}
