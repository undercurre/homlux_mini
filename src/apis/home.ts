import { mzaioRequest } from '../utils/index'
import { userBinding } from '../store/index'

/**
 * 查询家庭列表
 */
export async function getHomeList() {
  return await mzaioRequest.post<Home.IHomeItem[]>({
    log: true,
    loading: true,
    url: '/v1/mzgd/user/house/queryHouseList',
  })
}

/**
 * 查询美智用户家庭信息
 */
export async function queryUserHouseInfo({ houseId = '', defaultHouseFlag = true }) {
  return await mzaioRequest.post<Home.IHomeDetail>({
    log: true,
    loading: true,
    url: '/v1/mzgd/user/queryUserHouseInfo',
    data: {
      houseId,
      defaultHouseFlag,
    },
  })
}

/**
 * 新增美智用户家庭
 */
export async function saveOrUpdateUserHouseInfo(params: {
  houseId?: string
  houseName: string
  userLocationInfo: string
}) {
  if (params.houseId === '') {
    delete params.houseId
  }

  return await mzaioRequest.post<Home.IHomeDetail>({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/saveOrUpdateUserHouseInfo',
    data: params,
  })
}

/**
 * 更新默认家庭
 */
export async function updateDefaultHouse(houseId: string) {
  return await mzaioRequest.post<Home.IHomeDetail>({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/updateDefaultHouse',
    data: {
      houseId,
      defaultHouseFlag: true,
    },
  })
}

/**
 * 删除或解散家庭
 */
export async function delUserHouse(houseId: string) {
  return await mzaioRequest.post({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/house/delUserHouse',
    data: {
      houseId,
    },
  })
}

/**
 * 退出家庭
 */
export async function quitUserHouse(houseId: string) {
  return await mzaioRequest.post({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/house/quitUserHouse',
    data: {
      houseId,
      userId: userBinding.store.userInfo.userId,
    },
  })
}

/**
 * 转让家庭
 */
export async function changeUserHouse(params: { houseId: string; changeUserId: string }) {
  return await mzaioRequest.post({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/house/changeUserHouse',
    data: {
      ...params,
      creatorUserId: userBinding.store.userInfo.userId,
    },
  })
}

/**
 * 查询家庭成员列表
 */
export async function queryHouseUserList({ houseId = '' }) {
  return await mzaioRequest.post<Home.HomeMemberInfo>({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/house/queryHouseUserList',
    data: {
      houseId,
      pageSize: 50,
    },
  })
}

/**
 * 更新家庭成员权限
 * 家庭成员权限，创建者：1 管理员：2 游客：3
 */
export async function updateHouseUserAuth({ userId = '', auth = 3, houseId = '' }) {
  return await mzaioRequest.post({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/house/updateHouseUserAuth',
    data: {
      userId,
      houseUserAuth: auth,
      houseId,
    },
  })
}

/**
 * 删除家庭成员
 */
export async function deleteHouseUser({ houseId = '', userId = '' }) {
  return await mzaioRequest.post({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/house/delHouseUser',
    data: {
      houseId,
      userId,
    },
  })
}

/**
 * 邀请家庭成员
 */
export async function inviteHouseUser({ houseId = '', auth = 3 }) {
  return await mzaioRequest.post({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/inviteHouseUser',
    data: {
      houseId,
      houseUserAuth: auth,
    },
  })
}
