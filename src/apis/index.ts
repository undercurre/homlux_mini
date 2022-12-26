import { defaultRequest } from '../utils/index'

export async function testApi() {
  return await defaultRequest({
    url: '/test',
  })
}

export async function login(data: object) {
  return await defaultRequest.post<User.UserLoginRes>({
    url: '/login',
    data,
  })
}
