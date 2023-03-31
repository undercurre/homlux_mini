import { observable, runInAction } from 'mobx-miniprogram'
import {
  getHomeList,
  queryUserHouseInfo,
  queryHouseUserList,
  updateHouseUserAuth,
  deleteHouseUser,
  inviteHouseUser,
  saveOrUpdateUserHouseInfo,
  getRoomList,
  updateDefaultHouse,
} from '../apis/index'
import { proType } from '../config/index'
import { asyncStorage, storage } from '../utils/index'
import { deviceStore } from './device'
import { othersStore } from './others'
import { roomStore } from './room'
import { sceneStore } from './scene'
import { userStore } from './user'

export const homeStore = observable({
  homeList: [] as Home.IHomeItem[],

  /** 当前家庭详细信息 */
  currentHomeDetail: {} as Home.IHomeDetail,

  homeMemberInfo: {} as Home.HomeMemberInfo,

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
   * 首页加载逻辑
   */
  async homeInit() {
    const success = this.loadHomeDataFromStorage()
    if (success) {
      runInAction(() => {
        othersStore.isInit = true
      })
    }
    const res = await this.updateHomeList()
    if (res.success) {
      queryUserHouseInfo({ houseId: this.currentHomeId }).then((res) => {
        if (res.success) {
          runInAction(() => {
            homeStore.currentHomeDetail = Object.assign({ houseId: this.currentHomeId }, res.result)
          })
        }
      })
      // 全屋房间、设备加载完成，开始渲染
      const res = await Promise.all([getRoomList(homeStore.currentHomeId), deviceStore.updateAllRoomDeviceList()])
      if (res[0].success) {
        res[0].result.roomInfoList.forEach((roomInfo) => {
          const roomDeviceList = roomStore.roomDeviceList[roomInfo.roomInfo.roomId]
          // 过滤一下默认场景，没灯过滤明亮柔和，没灯没开关全部过滤
          const hasSwitch = roomDeviceList?.some((device) => device.proType === proType.switch) ?? false
          const hasLight = roomDeviceList?.some((device) => device.proType === proType.light) ?? false
          if (!hasSwitch && !hasLight) {
            // 四个默认场景都去掉
            roomInfo.roomSceneList = roomInfo.roomSceneList.filter((scene) => scene.isDefault === '0')
          } else if (hasSwitch && !hasLight) {
            // 只有开关，去掉默认的明亮、柔和
            roomInfo.roomSceneList = roomInfo.roomSceneList.filter((scene) => !['2', '3'].includes(scene.defaultType))
          }
          // 统计多少灯打开（开关不关联灯或者关联场景都算进去）
          let deviceLightOnNum = 0
          // 统计多少个子设备
          let subDeviceNum = 0
          roomDeviceList?.forEach((device) => {
            if (device.proType !== proType.gateway) {
              subDeviceNum++
            }
            if (!device.onLineStatus) return
            if (device.proType === proType.light && device.mzgdPropertyDTOList['1'].OnOff) {
              deviceLightOnNum++
            } else if (device.proType === proType.switch) {
              device.switchInfoDTOList.forEach((switchItem) => {
                if (
                  !switchItem.lightRelId &&
                  device.mzgdPropertyDTOList[switchItem.switchId].OnOff &&
                  !device.mzgdPropertyDTOList[switchItem.switchId].ButtonMode
                ) {
                  deviceLightOnNum++
                }
              })
            }
          })
          roomInfo.roomInfo.deviceLightOnNum = deviceLightOnNum
          roomInfo.roomInfo.subDeviceNum = subDeviceNum
        })
        runInAction(() => {
          roomStore.roomList = res[0].result.roomInfoList.map((room) => ({
            roomId: room.roomInfo.roomId,
            roomIcon: room.roomInfo.roomIcon || 'drawing-room',
            roomName: room.roomInfo.roomName,
            deviceLightOnNum: room.roomInfo.deviceLightOnNum,
            sceneList: room.roomSceneList,
            deviceNum: room.roomInfo.deviceNum,
            subDeviceNum: room.roomInfo.subDeviceNum,
          }))
          othersStore.isInit = true
        })
        this.homeDataPersistence()
      }
    }
  },

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
        console.log('updateHomeList store', res.result)

        const houseId = homeStore.homeList.find((item: Home.IHomeItem) => item.defaultHouseFlag)?.houseId || ''
        // 首次进入或删除了默认家庭时，默认选中第0个
        if (!houseId && homeStore.homeList.length) {
          updateDefaultHouse(homeStore.homeList[0].houseId)
          homeStore.homeList[0].defaultHouseFlag = true
        }
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
      await deviceStore.updateAllRoomDeviceList(undefined, options)
      await roomStore.updateRoomList(options)
      this.homeDataPersistence()
      return
    } else {
      console.error('获取家庭信息失败', res)
      return Promise.reject('获取家庭信息失败')
    }
  },

  /**
   * 更新当前家庭房间卡片列表
   */
  async updateRoomCardList() {
    await deviceStore.updateAllRoomDeviceList()
    await roomStore.updateRoomList()
    await sceneStore.updateAllRoomSceneList()
    this.homeDataPersistence()
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
  async updateMemberAuth(userId: string, auth: Home.UserRole) {
    const res = await updateHouseUserAuth({ userId, auth, houseId: this.currentHomeId })
    if (res.success) {
      runInAction(() => {
        for (let i = 0; i < homeStore.homeMemberInfo.houseUserList.length; i++) {
          if (userId === homeStore.homeMemberInfo.houseUserList[i].userId) {
            if (homeStore.homeMemberInfo.houseUserList[i].userHouseAuth === 1) continue
            const map = ['', '创建者', '管理员', '访客']
            homeStore.homeMemberInfo.houseUserList[i].userHouseAuth = auth
            homeStore.homeMemberInfo.houseUserList[i].userHouseAuthName = map[auth]
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

  /**
   * 缓存主要的初始数据
   */
  async homeDataPersistence() {
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
    'updateCurrentHomeDetail',
    'updateHomeMemberList',
    'updateMemberAuth',
    'deleteMember',
    'updateHomeNameOrLocation',
  ],
}
