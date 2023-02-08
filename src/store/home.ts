import { observable, action, runInAction } from 'mobx-miniprogram'
import { getHomeList, queryUserHouseInfo } from '../apis/index'

export const homeStore = observable({
  homeList: [] as Home.HomeInfo[],

  get currentHomeId() {
    return this.homeList.find((item: Home.HomeInfo) => item.defaultHouseFlag)?.houseId || ''
  },

  // 当前家庭详细信息
  currentHomeDetail: {} as Home.HomeDetail,

  async updateHomeInfo() {
    const res = await this.updateHomeList()

    if (res.success) {
      this.updateCurrentHomeDetail(this.currentHomeId)
    }
  },

  // actions
  /**
   * 更新家庭列表数据
   */
  updateHomeList: action(async function () {
    const res = await getHomeList()

    console.log('updateHomeList', res)

    if (res.success) {
      runInAction(() => {
        console.log('runInAction')
        homeStore.homeList = res.result
      })
    }

    return res
  }),

  /**
   * 更新当前家庭详细信息
   */
  updateCurrentHomeDetail: action(async function (houseId: string) {
    const res = await queryUserHouseInfo({
      houseId,
    })

    console.log('updateHomeList', res)

    if (res.success) {
      runInAction(() => {
        homeStore.currentHomeDetail = Object.assign({ houseId }, res.result)
      })
    }
  }),
})

export const homeBinding = {
  store: homeStore,
  fields: ['homeList', 'currentHomeId', 'currentHomeDetail'],
  actions: ['updateHomeInfo', 'updateHomeList', 'updateCurrentHomeDetail'],
}
