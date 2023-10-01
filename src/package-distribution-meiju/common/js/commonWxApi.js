export const wxGetSystemInfo = () => {
  return new Promise((resolve) => {
    wx.getSystemInfo({
      success(res) {
        getApp().setMethodCheckingLog('wx.getSystemInfo()')
        resolve(res)
      },
      fail(error) {
        getApp().setMethodFailedCheckingLog('wx.getSystemInfo()', `获取系统信息异常${JSON.stringify(error)}`)
      },
    })
  })
}
export const wxGetOpenSetting = () => {
  return new Promise((resolve) => {
    wx.openSetting({
      success(res) {
        resolve(res)
      },
    })
  })
}
export const wxAuthorize = (attr) => {
  return new Promise((resolve) => {
    wx.authorize({
      scope: `scope.${attr}`,
      success(res) {
        resolve(res)
      },
    })
  })
}
