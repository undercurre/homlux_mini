import { observable, runInAction } from 'mobx-miniprogram'
import {
  getHomeList,
  queryUserHouseInfo,
  queryHouseUserList,
  deleteHouseUser,
  inviteHouseUser,
  saveOrUpdateUserHouseInfo,
  updateDefaultHouse,
  queryLocalKey,
} from '../apis/index'
import { asyncStorage, storage, Logger, IApiRequestOption, isConnect } from '../utils/index'
import { deviceStore } from './device'
import { othersStore } from './others'
import { roomStore } from './room'
import { userStore } from './user'
import { userRole } from '../config/home'

export const homeStore = observable({
  key: '', // 局域网本地场景key

  homeList: [] as Home.IHomeItem[],

  /** 当前家庭详细信息 */
  currentHomeDetail: {} as Home.IHomeDetail,

  homeMemberInfo: {} as Home.HomeMemberInfo,

  /**
   * 退出登录时清空数据
   */
  reset() {
    runInAction(() => {
      this.key = ''
      this.homeList = []
      this.currentHomeDetail = {
        houseId: '',
        houseName: '',
        houseUserAuth: 3,
        deviceCount: 0,
        userCount: 0,
        houseArea: '',
        roomCount: 0,
      }

      storage.remove('homeData')
    })
  },

  get currentHomeId(): string {
    let houseId = this.homeList.find((item: Home.IHomeItem) => item.defaultHouseFlag)?.houseId || ''

    if (!houseId && this.homeList.length) {
      houseId = this.homeList[0].houseId
    }

    return houseId
  },

  // 是否创建者
  get isCreator() {
    if (this.currentHomeDetail) {
      return this.currentHomeDetail.houseUserAuth === userRole.creator
    }
    return false
  },

  // 是否管理员权限+
  get isManager() {
    return this.currentHomeDetail.houseUserAuth === 1 || this.currentHomeDetail.houseUserAuth === 2
  },

  /**
   * 首页加载逻辑
   */
  async homeInit() {
    // 加载本地缓存数据，以便页面快速呈现
    const success = this.loadHomeDataFromStorage()
    if (success) {
      othersStore.setIsInit(true)
    } else {
      Logger.log('[无本地缓存，或缓存已过期]')
    }
    if (isConnect()) {
      await this.updateHomeInfo({ isInit: true })
      othersStore.setIsInit(true)
    }
  },

  /**
   * 更新家庭列表，同时更新当前家庭详情信息、房间列表
   * @param params.isInit 是否用于家庭数据更新
   */
  async updateHomeInfo(params = { isInit: false }, options?: IApiRequestOption) {
    const homeList = await this.updateHomeList(options)
    if (!homeList.success) {
      return Promise.reject()
    }

    const homeInfo = await this.updateHomeDetail(options)
    if (!homeInfo.success) {
      return Promise.reject()
    }

    if (params.isInit) {
      await deviceStore.updateAllRoomDeviceList()
    }
    await roomStore.updateRoomList(options)

    this.saveHomeDate()

    return
  },

  /**
   * 更新家庭列表数据，如无默认家庭则默认选中第0个
   */
  async updateHomeList(options?: IApiRequestOption) {
    const res = await getHomeList(options)

    if (!res.success) {
      console.log('this.currentHomeId', this.currentHomeId, 'this.homeList', res.result)
      return Promise.reject('获取列表家庭失败')
    }

    const houseId = res.result.find((item: Home.IHomeItem) => item.defaultHouseFlag)?.houseId || ''
    // 首次进入或删除了默认家庭
    if (!houseId && res.result.length) {
      Logger.error('默认家庭为空，设置默认家庭')
      updateDefaultHouse(res.result[0].houseId)
      res.result[0].defaultHouseFlag = true
    }

    runInAction(() => {
      this.homeList = res.result
    })

    return res
  },

  /**
   * 更新家庭详情
   */
  async updateHomeDetail(options?: IApiRequestOption) {
    const res = await queryUserHouseInfo({ houseId: this.currentHomeId }, options)
    if (!res.success) {
      console.error('获取家庭信息失败', res)
      return Promise.reject('获取家庭信息失败')
    }

    runInAction(() => {
      homeStore.currentHomeDetail = Object.assign({ houseId: this.currentHomeId }, res.result)
    })

    return res
  },

  /**
   * 更新当前家庭房间卡片列表
   */
  async updateRoomCardList() {
    await deviceStore.updateAllRoomDeviceList()
    await roomStore.updateRoomList() // 最后刷新
    this.saveHomeDate()
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
   * 删除家庭成员
   */
  async deleteMember(userId: string) {
    const res = await deleteHouseUser({ houseId: this.currentHomeId, userId }, { loading: true })
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
  async inviteMember(houseId: string, auth: number, shareId: string) {
    const res = await inviteHouseUser({ houseId, auth, shareId })
    if (res.success) {
      return
    } else {
      return Promise.reject(res)
    }
  },

  /**
   * 缓存token及初始数据（家庭列表，当前家庭详情，房间列表，全屋设备列表）
   */
  async saveHomeDate() {
    if (!userStore.isLogin) {
      return
    }
    const token = await asyncStorage.get<string>('token')
    const data = {
      token,
      homeData: {
        homeList: this.homeList,
        currentHomeDetail: this.currentHomeDetail,
        roomList: roomStore.roomList,
        allRoomDeviceList: deviceStore.allRoomDeviceList,
      },
    }
    await asyncStorage.set('homeData', data, 60 * 60 * 24) // 缓存有效期一天
  },

  /**
   * 更新homos通信key，由于无法host端无法通知客户端key是否过期，只能每次请求云端刷新
   */
  async initLocalKey() {
    // key为空时才查询云端接口，避免反复查询
    if (isConnect() && !this.key) {
      await this.updateLocalKey()
    }

    if (!this.key) {
      const localKey = storage.get('localKey') as string

      if (localKey) {
        this.key = localKey
      } else {
        Logger.debug('没有本地Key')
      }
    }
  },

  async updateLocalKey() {
    const res = await queryLocalKey({ houseId: this.currentHomeId })

    if (res.success) {
      this.key = res.result
      // key的有效期是30天，设置缓存过期时间25天
      storage.set('localKey', this.key, Date.now() + 1000 * 60 * 60 * 24 * 20)
    }
  },

  /**
   * 从缓存加载数据，如果成功加载返回true，否则false
   */
  loadHomeDataFromStorage() {
    const token = storage.get<string>('token')
    if (!token) {
      return false
    }
    const data = storage.get('homeData') as IAnyObject
    if (!data) {
      return false
    } else if (data.token != token) {
      storage.remove('homeData')
      return false
    }
    runInAction(() => {
      this.homeList = data.homeData.homeList
      this.currentHomeDetail = data.homeData.currentHomeDetail
      roomStore.roomList = data.homeData.roomList
      deviceStore.allRoomDeviceList = data.homeData.allRoomDeviceList
    })
    return true
  },
})

export const homeBinding = {
  store: homeStore,
  fields: ['homeList', 'currentHomeId', 'currentHomeDetail', 'isManager'],
  actions: [
    'updateHomeInfo',
    'updateHomeList',
    // 'updateCurrentHomeDetail',
    'updateHomeMemberList',
    'deleteMember',
    'updateHomeNameOrLocation',
  ],
}
