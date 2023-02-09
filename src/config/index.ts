interface ConfigWithEnv {
  dev: string | number | boolean
  prod: string | number | boolean
}

export { sceneMap, sceneList } from './scene'

export const env: 'dev' | 'prod' = 'dev'

export const mzaiotBaseURL: ConfigWithEnv = {
  // dev: 'http://10.74.144.9:8013',
  dev: 'http://47.106.94.129:8001', // sit环境
  prod: 'https://baidu.com',
}

export const storageExpire: ConfigWithEnv = {
  dev: 60 * 60 * 24 * 30,
  prod: 60 * 60 * 24 * 30,
}
