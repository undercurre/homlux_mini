import { observable, runInAction } from 'mobx-miniprogram'
import {
  getHomeList,
  queryUserHouseInfo,
  queryHouseUserList,
  updateHouseUserAuth,
  deleteHouseUser,
  inviteHouseUser
} from '../apis/index'
import { roomStore } from './room'

export const homeStore = observable({
  homeList: [] as Home.IHomeItem[],

  /** 当前家庭详细信息 */
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
      console.log('this.currentHomeId', this.currentHomeId, 'this.homeList', this.homeList)
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

    if (res.success) {
      runInAction(() => {
        homeStore.currentHomeDetail = Object.assign({ houseId }, res.result)
      })
      await roomStore.updataHomeDeviceList()
      await roomStore.updateRoomList()
      return
    } else {
      return Promise.reject('获取家庭信息失败')
    }
  },

  /**
   * 更新家庭成员列表
   */
  async updateHomeMemberList() {
    const res = await queryHouseUserList({ houseId: this.currentHomeId })
    if (res.success) {
      runInAction(() => {
        homeStore.homeMemberInfo = res.result
      })
      return
    } else {
      return Promise.reject('获取成员信息失败')
    }
  },

  /**
   * 更改家庭成员权限
   * 家庭成员权限，创建者：1 管理员：2 游客：3
   */
  async updateMemberAuth(userId: string, auth: number) {
    const res = await updateHouseUserAuth({userId, auth, houseId: this.currentHomeId})
    if (res.success) {
      runInAction(() => {
        for (let i = 0; i < homeStore.homeMemberInfo.houseUserList.length; i++) {
          if (userId === homeStore.homeMemberInfo.houseUserList[i].userId) {
            const map = ['', '创建者', '管理员', '游客']
            homeStore.homeMemberInfo.houseUserList[i].userHouseAuth = auth
            homeStore.homeMemberInfo.houseUserList[i].userHouseAuthName = map[auth]
            break
          }
        }
      })
      return
    } else {
      return Promise.reject('设置权限失败')
    }
  },

  /**
   * 删除家庭成员
   */
  async deleteMember(userId: string) {
    const res = await deleteHouseUser({ houseId: this.currentHomeId, userId })
    if (res.success) {
      runInAction(() => {
        for (let i = 0; i < homeStore.homeMemberInfo.houseUserList.length; i++) {
          if (userId === homeStore.homeMemberInfo.houseUserList[i].userId) {
            homeStore.homeMemberInfo.houseUserList.splice(i, 1)
            break
          }
        }
      })
      return
    } else {
      return Promise.reject('删除家庭成员失败')
    }
  },

    /**
   * 邀请家庭成员
   */
  async inviteMember(houseId: string, auth: number) {
    const res = await inviteHouseUser({ houseId, auth })
    if (res.success) {
      return
    } else {
      return Promise.reject('邀请家庭成员失败')
    }
  },
})

export const homeBinding = {
  store: homeStore,
  fields: ['homeList', 'currentHomeId', 'currentHomeDetail'],
  actions: [
    'updateHomeInfo',
    'updateHomeList',
    'updateCurrentHomeDetail',
    'updateHomeMemberList',
    'updateMemberAuth',
    'deleteMember',
  ],
}
