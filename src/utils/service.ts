// service模块存放项目的相关业务代码
import { storage } from './storage'
// import { mzaiotWSURL, env } from '../config/index'

export function logout() {
  storage.remove('token')
  wx.redirectTo({
    url: '/pages/login/index',
  })
}
//
// export function connectHouseSocket(houseId: string) {
//   // const socketObject = {
//   //   socketStatus: 'close' as 'close' | 'open' | 'error',
//   //   socketTask: wx.connectSocket({
//   //     url: mzaiotWSURL[env] + houseId,
//   //     protocols: ['123456']
//   //   }),
//   // }
//   // socketObject.socketTask.onClose((e) => {
//   //   console.log(e)
//   // })
//   // socketObject.socketTask.onOpen(e=>{
//   //   socketObject.socketTask.send({
//   //     data: `{
//   //       deviceId: '${houseId}',
//   //       topic: 'wss_push',
//   //       message: '123',
//   //     }`
//   //   })
//   // })
// }
