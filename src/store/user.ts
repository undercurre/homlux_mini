import { observable, runInAction } from 'mobx-miniprogram'

export const user = observable({
  userInfo: {
    id: '7071',
    nickname: '7071',
    phone: '12345678901',
    avatar: 'https://dummyimage.com/200x200/4A7BF7/FFFFFF&text=7071',
  } as User.UserInfo,

  numA: 1000,
  numB: 1000,

  get sum() {
    return this.numA + this.numB
  },

  update_user: function () {
    runInAction(() => {
      const sum = this.sum
      this.numA = this.numB
      this.numB = sum
    })
  },
})
