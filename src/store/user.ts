import { observable } from 'mobx-miniprogram'

export const user = observable({
  userInfo: {
    id: '7071',
    nickname: '7071',
    phone: '12345678901',
    avatar: 'https://dummyimage.com/200x200/4A7BF7/FFFFFF&text=7071',
  } as User.UserInfo,
})
