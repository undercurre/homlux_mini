import { observable, runInAction } from 'mobx-miniprogram'
import { getHomeList, queryUserHouseInfo, queryHouseUserList } from '../apis/index'
import { roomStore } from './room'

export const homeStore = observable({
  homeList: [] as Home.IHomeItem[],

  // 当前家庭详细信息
  currentHomeDetail: {} as Home.IHomeDetail,

  homeMemberInfo: {} as Home.HomeMemberInfo,

  get currentHomeId() {
    return this.homeList.find((item: Home.IHomeItem) => item.defaultHouseFlag)?.houseId || ''
  },

  // actions
  /**
   * 更新家庭列表同时更新当前信息
   */
  async updateHomeInfo() {
    const res = await this.updateHomeList()

    if (res.success) {
      return await this.updateCurrentHomeDetail(this.currentHomeId)
    } else {
      return Promise.reject('获取列表家庭失败')
    }
  },

  /**
   * 更新家庭列表数据
   */
  async updateHomeList() {
    const res = await getHomeList()

    if (res.success) {
      runInAction(() => {
        homeStore.homeList = res.result
      })
    }

    return res
  },

  /**
   * 更新当前家庭详细信息
   */
  async updateCurrentHomeDetail(houseId: string) {
    const res = await queryUserHouseInfo({
      houseId,
    })

    console.log('updateHomeList', res)

    if (res.success) {
      runInAction(() => {
        homeStore.currentHomeDetail = Object.assign({ houseId }, res.result)
      })
      roomStore.updateRoomList()
      return
    } else {
      return Promise.reject('获取家庭信息失败')
    }
  },

  /**
   * 更新家庭成员列表
   */
  async updateHomeMemberList() {
    const res = await queryHouseUserList(this.currentHomeId)
    if (res.success) {
      runInAction(() => {
        homeStore.homeMemberInfo = res.result
      })
      return
    } else {
      return Promise.reject('获取成员信息失败')
    }
  }
})

export const homeBinding = {
  store: homeStore,
  fields: ['homeList', 'currentHomeId', 'currentHomeDetail'],
  actions: ['updateHomeInfo', 'updateHomeList', 'updateCurrentHomeDetail', 'updateHomeMemberList'],
}
