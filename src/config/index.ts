interface ConfigWithEnv<T> {
  dev: T
  prod: T
}

export { sceneMap, sceneList } from './scene'

export const env: 'dev' | 'prod' = 'dev'

export const mzaiotBaseURL: ConfigWithEnv<string> = {
  // dev: 'http://10.74.145.23:8035',
  dev: 'https://test.meizgd.com/mzaio', // sit环境
  prod: 'https://baidu.com',
}

export const storageExpire: ConfigWithEnv<number> = {
  dev: 60 * 60 * 24 * 30,
  prod: 60 * 60 * 24 * 30,
}

/**
 * 美智云后端websocket地址
 */
export const mzaiotWSURL: ConfigWithEnv<string> = {
  dev: 'wss://test.meizgd.com/mzaio/v1/wss/',
  prod: 'https://baidu.com',
}
