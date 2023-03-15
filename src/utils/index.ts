import { storage } from './storage'
import QQMapWX from './qqmap-wx-jssdk'
import { QQMapConfig } from '../config/index'
export * from './request/index'
export * from './storage'
export * from './service'
export * from './aesUtil'
export * from './strUtil'
export * from './wifiProtocol'
export * from './bleProtocol'
export * from './eventBus'

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

export function setNavigationBarAndBottomBarHeight() {
  const { statusBarHeight, platform, windowWidth, windowHeight, safeArea, system } = wx.getSystemInfoSync()
  const { top, height } = wx.getMenuButtonBoundingClientRect()

  // 手机系统
  storage.set('system', system, null)
  // 屏幕高度
  storage.set('windowHeight', windowHeight, null)
  // 状态栏高度
  storage.set('statusBarHeight', statusBarHeight, null)
  // 胶囊按钮高度 一般是32 如果获取不到就使用32
  storage.set('menuButtonHeight', height ? height : 32, null)
  // px和rpx比例 px转rpx: px / divideRpxByPx,rpx转px：divideRpxByPx * rpx
  storage.set('divideRpxByPx', windowWidth / 750, null)
  // 底部安全区高度
  storage.set('bottomBarHeight', windowHeight - safeArea.bottom, null)

  // 判断胶囊按钮信息是否成功获取
  if (top && top !== 0 && height && height !== 0) {
    const navigationBarHeight = (top - statusBarHeight) * 2 + height
    // 导航栏高度
    storage.set('navigationBarHeight', navigationBarHeight, null)
  } else {
    storage.set('navigationBarHeight', platform === 'android' ? 48 : 40, null)
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

  return currentPage.options as IAnyObject
}

export function getPosition() {
  const myQQMapWX = new QQMapWX({
    key: QQMapConfig.key,
  })

  wx.getFuzzyLocation({
    type: 'wgs84',
    success(res) {
      console.log('getFuzzyLocation', res)
      const latitude = res.latitude
      const longitude = res.longitude
      myQQMapWX.reverseGeocoder({
        sig: QQMapConfig.sig,
        location: {
          latitude: latitude,
          longitude: longitude,
        },
        success(geoCoderRes: IAnyObject) {
          console.log('reverseGeocoder', geoCoderRes)
          const addr = geoCoderRes.result.address_component
          const result = addr.province + addr.city + addr.district
          storage.set('position_location', result)
        },
        fail: function () {
          console.log('reverseGeocoder:获取地理位置失败')
        },
      })
    },
    fail() {
      console.log('getFuzzyLocation::微信定位失败')
    },
  })
}
