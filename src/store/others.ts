import { observable, runInAction } from 'mobx-miniprogram'

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
