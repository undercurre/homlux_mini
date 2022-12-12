import { defaultRequest } from '../utils/index';

export async function testApi() {
  return await defaultRequest({
    url: '/test',
  });
}

export async function login(js_code: string) {
  return await defaultRequest<User.UserLoginRes>({
    url: '/login',
    data: {
      js_code,
    }
  });
}
