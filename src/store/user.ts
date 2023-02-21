import { observable } from 'mobx-miniprogram'

export const userStore = observable({
  userInfo: {} as User.UserInfo,
})

export const userBinding = {
  store: userStore,
  fields: ['userInfo'],
  actions: [],
}
