import { mzaiotWSURL, env } from '../config/index'

/**
 * 建立某个房间的webSocket连接
 * @param houseId 家庭id
 */
export function connectHouseSocket(houseId: string) {
  return wx.connectSocket({
    url: mzaiotWSURL[env] + houseId,
    protocols: ['123456'],
  })
}
