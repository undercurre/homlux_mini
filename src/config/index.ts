export * from './scene'
export * from './code'
export * from './device'
export * from './light'
export * from './img'
export * from './dic'

let env: ENV_TYPE = 'dev'

export const mzaioDomain: ConfigWithEnv<string> = {
  dev: 'https://test.meizgd.com',
  sit: 'https://sit.meizgd.com',
  prod: 'https://mzaio.meizgd.com',
}

export function getCurrentMzaioDomain() {
  return mzaioDomain[getEnv()]
}

export const mzaioBaseURL: ConfigWithEnv<string> = {
  dev: `${mzaioDomain.dev}/mzaio`,
  sit: `${mzaioDomain.sit}/mzaio`,
  prod: `${mzaioDomain.prod}/mzaio`,
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

// export const QQMapConfig = {
//   key: 'L7HBZ-UZ6EU-7J5VU-BR54O-3ZDG5-6CFIC',
//   sig: 'W9RrPrVIxGPyuKEzzS76ktDxvN3zxxyJ',
// }

export function getEnv() {
  return env
}

export function setEnv(val: ENV_TYPE) {
  env = val
}

/**
 * 返回内嵌H5页面的基本路径
 */
export function getH5BaseUrl() {
  return `${mzaioDomain[env]}/meiju`
}

// wx的环境名称 --> 云端环境名称
export const envMap = {
  develop: 'dev',
  trial: 'sit',
  release: 'prod',
} as const

// 首页添加设备菜单项配置
export const MENU_ADD_DEVICE = {
  name: '添加设备',
  key: 'device',
  icon: 'add',
  value: '/package-distribution/pages/choose-device/index',
}

export const MENU_ADD_AUTOMATION = {
  name: '创建场景',
  key: 'auto',
  icon: 'auto',
  value: '/package-automation/automation-add/index',
}

export const MENU_ADD_PLATFORM = {
  name: '连接其它平台',
  key: 'platform',
  icon: 'auth',
  value: '/package-auth/pages/index/index',
}
