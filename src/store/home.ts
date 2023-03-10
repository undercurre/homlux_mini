import { observable, runInAction } from 'mobx-miniprogram'
import {
  getHomeList,
  queryUserHouseInfo,
  queryHouseUserList,
  updateHouseUserAuth,
  deleteHouseUser,
  inviteHouseUser,
  saveOrUpdateUserHouseInfo,
} from '../apis/index'
import { roomStore } from './room'

export const homeStore = observable({
  homeList: [] as Home.IHomeItem[],

  /** 当前家庭详细信息 */
  currentHomeDetail: {} as Home.IHomeDetail,

  homeMemberInfo: {} as Home.HomeMemberInfo,

  homePageInit: false,

  get currentHomeId() {
    let houseId = this.homeList.find((item: Home.IHomeItem) => item.defaultHouseFlag)?.houseId || ''

    if (!houseId && this.homeList.length) {
      houseId = this.homeList[0].houseId
    }

    return houseId
  },

  // 是否管理员权限+
  get isManager() {
    return this.currentHomeDetail.houseUserAuth === 1 || this.currentHomeDetail.houseUserAuth === 2
  },

  // actions
  /**
   * 更新家庭列表同时更新当前信息
   */
  async updateHomeInfo(options?: { loading: boolean }) {
    const res = await this.updateHomeList(options)

    if (res.success) {
      return await this.updateCurrentHomeDetail(options)
    } else {
      console.log('this.currentHomeId', this.currentHomeId, 'this.homeList', this.homeList)
      return Promise.reject('获取列表家庭失败')
    }
  },

  /**
   * 更新家庭列表数据
   */
  async updateHomeList(options?: { loading: boolean }) {
    const res = await getHomeList(options)

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
  async updateCurrentHomeDetail(options?: { loading: boolean }) {
    const res = await queryUserHouseInfo(
      {
        houseId: this.currentHomeId,
      },
      options,
    )

    if (res.success) {
      runInAction(() => {
        homeStore.currentHomeDetail = Object.assign({ houseId: this.currentHomeId }, res.result)
      })
      await roomStore.updataHomeDeviceList(options)
      await roomStore.updateRoomList(options)
      return
    } else {
      return Promise.reject('获取家庭信息失败')
    }
  },

  /**
   * 更新当前家庭房间卡片列表
   */
  async updateRoomCardList() {
    await roomStore.updataHomeDeviceList()
    await roomStore.updateRoomList()
  },

  /**
   * 更新当前家庭名字/位置
   */
  async updateHomeNameOrLocation(name?: string, location?: string) {
    const params = {
      houseId: this.currentHomeId,
      houseName: name ?? this.currentHomeDetail.houseName,
      userLocationInfo: location ?? this.currentHomeDetail.houseArea,
    }
    const res = await saveOrUpdateUserHouseInfo(params, { loading: true })
    if (res.success) {
      return await this.updateHomeInfo()
    } else {
      return Promise.reject('更新当前家庭名字/位置失败')
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
    const res = await updateHouseUserAuth({ userId, auth, houseId: this.currentHomeId })
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

  homeInitFinish() {
    runInAction(() => {
      homeStore.homePageInit = true
    })
  },
})

export const homeBinding = {
  store: homeStore,
  fields: ['homeList', 'currentHomeId', 'currentHomeDetail', 'isManager', 'homePageInit'],
  actions: [
    'updateHomeInfo',
    'updateHomeList',
    'updateCurrentHomeDetail',
    'updateHomeMemberList',
    'updateMemberAuth',
    'deleteMember',
    'updateHomeNameOrLocation',
  ],
}
