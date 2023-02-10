export { baseRequest, mzaiotRequest, BaseRequestOptions } from './request/index'
export { createStorage, storage, asyncStorage } from './storage'
export { logout } from './service'
export { aesUtil } from './aesUtil'
export { strUtil } from './strUtil'
export { wifiProtocol } from './wifiProtocol'

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

export function setNavigationBarHeight() {
  const { statusBarHeight, platform } = wx.getSystemInfoSync()
  const { top, height } = wx.getMenuButtonBoundingClientRect()

  // 状态栏高度
  wx.setStorageSync('statusBarHeight', statusBarHeight)
  // 胶囊按钮高度 一般是32 如果获取不到就使用32
  wx.setStorageSync('menuButtonHeight', height ? height : 32)

  // 判断胶囊按钮信息是否成功获取
  if (top && top !== 0 && height && height !== 0) {
    const navigationBarHeight = (top - statusBarHeight) * 2 + height
    // 导航栏高度
    wx.setStorageSync('navigationBarHeight', navigationBarHeight)
  } else {
    wx.setStorageSync('navigationBarHeight', platform === 'android' ? 48 : 40)
  }
}

/**
 * 获取当前页面url
 */
export function getCurrentPageUrl() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]

  return currentPage.route
}

/**
 * 获取当前页面参数
 */
export function getCurrentPageParams() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]

  return currentPage.options
}
