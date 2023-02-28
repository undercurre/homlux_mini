interface ConfigWithEnv<T> {
  dev: T
  prod: T
}

export * from './scene'
export * from './code'
export * from './device'
export * from './light'

export const env: 'dev' | 'prod' = 'dev'

export const mzaioBaseURL: ConfigWithEnv<string> = {
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
export const mzaioWSURL: ConfigWithEnv<string> = {
  dev: 'wss://test.meizgd.com/mzaio/v1/wss/',
  prod: 'https://baidu.com',
}
