interface ConfigWithEnv {
  dev: string | number | boolean
  prod: string | number | boolean
}

export { sceneMap } from './scene'

export const env: 'dev' | 'prod' = 'dev'

export const mzaiotBaseURL: ConfigWithEnv = {
  // dev: 'http://10.74.145.23:8035',
  dev: 'https://test.meizgd.com/mzaio', // sit环境
  prod: 'https://baidu.com',
}

export const storageExpire: ConfigWithEnv = {
  dev: 60 * 60 * 24 * 30,
  prod: 60 * 60 * 24 * 30,
}

// 设备通讯协议加密密钥
export const deviceKey: ConfigWithEnv = {
  dev: 'homlux@midea',
  prod: 'homlux@midea',
}
