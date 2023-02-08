import { mzaiotRequest } from '../utils/index'

/**
 * 查询家庭列表
 */
export async function getHomeList() {
  return await mzaiotRequest.post<Home.HomeInfo[]>({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/house/queryHouseList',
  })
}

/**
 * 查询美智用户家庭信息
 */
export async function queryUserHouseInfo({ houseId = '', defaultHouseFlag = true }) {
  return await mzaiotRequest.post<Home.HomeDetail>({
    log: false,
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

  return await mzaiotRequest.post<Home.HomeDetail>({
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
  return await mzaiotRequest.post<Home.HomeDetail>({
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
  return await mzaiotRequest.post({
    log: false,
    loading: true,
    url: '/v1/mzgd/user/house/delUserHouse',
    data: {
      houseId,
    },
  })
}
