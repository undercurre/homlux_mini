interface ConfigWithEnv<T> {
  dev: T
  sit: T
  prod: T
}

export * from './scene'
export * from './code'
export * from './device'
export * from './light'

let env: ENV_TYPE = 'dev'

export const mzaioBaseURL: ConfigWithEnv<string> = {
  dev: 'https://test.meizgd.com/mzaio',
  sit: 'https://sit.meizgd.com/mzaio', // 开发环境
  prod: 'https://mzaio.meizgd.com/mzaio',
}

export const storageExpire = 60 * 60 * 24 * 30

/**
 * 美智云后端websocket地址
 */
export const mzaioWSURL: ConfigWithEnv<string> = {
  dev: 'wss://test.meizgd.com/mzaio/v1/wss/',
  sit: 'wss://sit.meizgd.com/mzaio/v1/wss/',
  prod: 'wss://mzaio.meizgd.com/mzaio/v1/wss/',
}

export const QQMapConfig = {
  key: 'L7HBZ-UZ6EU-7J5VU-BR54O-3ZDG5-6CFIC',
  sig: 'W9RrPrVIxGPyuKEzzS76ktDxvN3zxxyJ',
}

export function getEnv() {
  return env
}

export function setEnv(val: ENV_TYPE) {
  env = val
}

// wx的环境名称 --> 云端环境名称
export const envMap = {
  develop: 'dev',
  trial: 'sit',
  release: 'prod',
} as const
