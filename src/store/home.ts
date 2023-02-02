import { observable } from 'mobx-miniprogram'

export const home = observable({
  currentHomeId: '111',
  homeList: [
    {
      home_id: '111',
      home_name: '7071的家',
      master_uid: '7071',
      memberList: [1, 2],
    },
    {
      home_id: '112',
      home_name: '4321的家',
      master_uid: '4321',
      memberList: [1, 2],
    },
    {
      home_id: '113',
      home_name: '2314的家',
      master_uid: '2314',
      memberList: [1, 2],
    },
  ] as Home.HomeInfo[],

  get currentHomeInfo() {
    const home = this.homeList.find((item: Home.HomeInfo) => item.home_id === this.currentHomeId)

    return home
  },
})

export const homeBinding = {
  store: home,
  fields: ['homeList', 'currentHomeId', 'currentHomeInfo'],
  actions: [],
}
