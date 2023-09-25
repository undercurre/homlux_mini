import { getFullPageUrl } from '../../../../utils/util'

const commonUtils = {
  /**
   * 获取当前ip地址
   */
  getLocalIPAddress() {
    return new Promise((resolve, reject) => {
      if (!wx.canIUse('getLocalIPAddress')) {
        console.log('不支持获取ip')
        resolve(null)
        return
      }
      wx.getLocalIPAddress({
        success(res) {
          // const localip = res.localip
          resolve(res)
        },
        fail(error) {
          console.log('获取ip失败================', error)
          reject(error)
        },
      })
    })
  },
  /**
   * reportEven 数据上报
   * @param {*} params
   */
  apLogReportEven(params) {
    let data = {
      ...params,
    }
    wx.reportEvent('ap_local_log', {
      data: JSON.stringify(data),
      page_path: getFullPageUrl(),
      device_session_id: app.globalData.deviceSessionId || '',
      uid: (getApp().globalData.userData && getApp().globalData.userData.uid) || '',
      time: new Date().getTime(),
    })
  },

  /**
   * 随机数生成接口,配网生成的随机数是32位
   * @param {*} length
   */
  getRandomString(length) {
    var randomChars = 'ABCDEF0123456789'
    var result = ''
    for (var i = 0; i < length; i++) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length))
    }
    return result
  },
}

module.exports = {
  commonUtils,
}
