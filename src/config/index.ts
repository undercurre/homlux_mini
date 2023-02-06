interface ConfigWithEnv {
  dev: string | number | boolean
  prod: string | number | boolean
}

export { sceneMap } from './scene'

export const env: 'dev' | 'prod' = 'dev'

export const mzaiotBaseURL: ConfigWithEnv = {
  dev: 'http://47.106.94.129:8001',
  prod: 'https://baidu.com',
}

export const storageExpire: ConfigWithEnv = {
  dev: 60 * 60 * 24 * 30,
  prod: 60 * 60 * 24 * 30,
}
