import { mzaiotRequest } from '../utils/index'

export async function getHomeList(data: object) {
  return await mzaiotRequest.post<User.UserLoginRes>({
    log: true,
    loading: true,
    url: '/mzgd/user/house/queryHouseList',
    data,
  })
}
