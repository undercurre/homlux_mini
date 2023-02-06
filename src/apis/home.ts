import { mzaiotRequest } from '../utils/index'

export async function getHomeList() {
  return await mzaiotRequest.post<Home.HomeInfo[]>({
    log: true,
    loading: true,
    url: '/v1/mzgd/user/house/queryHouseList',
  })
}
