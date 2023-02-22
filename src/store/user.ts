import { observable, runInAction } from 'mobx-miniprogram'
import { queryUserInfo } from '../apis/index'

export const userStore = observable({
  userInfo: {
    userId: '',
    nickName: '',
    mobilePhone: '',
    headImageUrl: '',
    name: '',
    wxId: '',
    sex: 0,
  } as User.UserInfo,

  async updateUserInfo() {
    const res = await queryUserInfo()
    if (res.success) {
      runInAction(() => {
        userStore.userInfo = res.result
      })
      return
    } else {
      return Promise.reject('获取用户信息失败')
    }
  },
})

export const userBinding = {
  store: userStore,
  fields: ['userInfo'],
  actions: ['updateUserInfo'],
}
