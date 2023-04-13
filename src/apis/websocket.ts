import { mzaioWSURL, getEnv } from '../config/index'
import { storage } from '../utils/storage'
import { homeStore } from '../store/index'

/**
 * 建立某个房间的webSocket连接
 * @param houseId 家庭id
 */
export function connectHouseSocket(houseId: string) {
  console.info('连接家庭socket: ', houseId, homeStore.currentHomeDetail)
  return wx.connectSocket({
    url: mzaioWSURL[getEnv()] + houseId,
    protocols: [storage.get<string>('token') as string],
    success(res) {
      console.log('connectSocket-success', res);
    },
    fail(res) {
      console.error('connectSocket-fail', res);
    }
  })
}
