interface ConfigWithEnv<T> {
  dev: T
  prod: T
}

export * from './scene'
export * from './code'
export * from './device'
export * from './light'

let env: 'dev' | 'prod' = 'dev'

export const mzaioBaseURL: ConfigWithEnv<string> = {
  dev: 'https://test.meizgd.com/mzaio', // sit环境
  prod: 'https://mzaio.meizgd.com/mzaio',
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
  prod: 'wss://mzaio.meizgd.com/mzaio/v1/wss/',
}

export const QQMapConfig = {
  key: 'L7HBZ-UZ6EU-7J5VU-BR54O-3ZDG5-6CFIC',
  sig: 'W9RrPrVIxGPyuKEzzS76ktDxvN3zxxyJ',
}

export function getEnv() {
  return env
}

export function setEnv(val: 'dev' | 'prod') {
  env = val
}
