// service模块存放项目的相关业务代码
import { storage } from './storage'

export function logout() {
  storage.remove('token')
  wx.redirectTo({
    url: '/pages/login/index',
  })
}
