import { observable } from 'mobx-miniprogram'

export const home = observable({
  currentHomeId: '111',
  homeList: [
    {
      home_id: '111',
      home_name: '7071的家',
      master_uid: '7071',
    },
    {
      home_id: '112',
      home_name: '4321的家',
      master_uid: '4321',
    },
    {
      home_id: '113',
      home_name: '2314的家',
      master_uid: '2314',
    },
  ] as Home.HomeInfo[],
})

export const homeBinding = {
  store: home,
  fields: ['homeList', 'currentHomeId'],
  actions: [],
}
