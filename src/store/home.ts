import { observable, action, runInAction } from 'mobx-miniprogram'
import { getHomeList } from '../apis/index'

export const home = observable({
  homeList: [] as Home.HomeInfo[],

  get currentHomeInfo() {
    return this.homeList.find((item: Home.HomeInfo) => item.houseCreatorFlag) || {}
  },

  // actions
  updateHomeList: action(async function () {
    const res = await getHomeList()

    console.log('updateHomeList', res)

    runInAction(() => {
      home.homeList = res.result
    })
  }),
})

export const homeBinding = {
  store: home,
  fields: ['homeList', 'currentHomeInfo'],
  actions: ['updateHomeList'],
}
