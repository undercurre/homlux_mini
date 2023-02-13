interface ConfigWithEnv {
  dev: string | number | boolean
  prod: string | number | boolean
}

export { sceneMap, sceneList } from './scene'

export const env: 'dev' | 'prod' = 'dev'

/**
 * 美智云后端接口地址
 */
export const mzaiotBaseURL: ConfigWithEnv = {
  // dev: 'http://10.74.144.9:8013',
  dev: 'http://47.106.94.129:8001',
  prod: 'https://baidu.com',
}

/**
 * 美智云后端websocket地址
 */
export const mzaiotWSURL: ConfigWithEnv = {
  dev: 'wss://test.meizgd.com/mzaio/v1/wss/',
  prod: 'https://baidu.com',
}

export const storageExpire: ConfigWithEnv = {
  dev: 60 * 60 * 24 * 30,
  prod: 60 * 60 * 24 * 30,
}
