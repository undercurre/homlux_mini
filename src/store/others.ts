import { observable, runInAction } from 'mobx-miniprogram'
import { storage } from '../utils/index'

export const others = observable({
  token: '',
  setToken: function (token: string) {
    runInAction(() => {
      others.token = token
    })
  },
  logout() {
    runInAction(() => {
      others.token = ''
    })
    storage.remove('token')
    wx.redirectTo({
      url: '/pages/login/index',
    })
  },
})

export const othersBinding = {
  store: others,
  fields: ['token'],
  actions: ['setToken', 'logout'],
}
