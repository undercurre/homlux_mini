/**
 * 扫码底层接口
 */
const app = getApp()
import { clickEventTracking } from '../../../../track/track.js'
import { requestService } from '../../../../utils/requestService'
import { getStamp, getReqId } from 'm-utilsdk/index'
const WX_LOG = require('../../../../utils/log')
var scanCode = {
  scanCode() {
    let self = this
    return new Promise((resolve, reject) => {
      wx.scanCode({
        success(res) {
          console.log('扫码结果', res)
          WX_LOG.info('扫码成功', 'wx.scanCode', res)
          resolve(res)
        },
        fail(error) {
          console.log('扫码失败返回', error)
          WX_LOG.error('扫码失败', 'wx.scanCode', error)
          reject(error)
        },
        complete() {
          self.trackViewScan()
        },
      })
    })
  },
  /**
   * 密文二维码扫码解析
   * @param {*} qrCode
   * @param {*} timeout
   */
  scanCodeDecode(qrCode, timeout = 3000) {
    return new Promise((resolve, reject) => {
      let resq = {
        qrCode: qrCode,
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('scancodeDecode', resq, 'POST', '', timeout)
        .then((resp) => {
          WX_LOG.info('密文二维码扫码解析成功', 'scancodeDecode', resp)
          resolve(resp.data.data)
        })
        .catch((error) => {
          WX_LOG.error('密文二维码扫码解析失败', 'scancodeDecode', error)
          reject(error)
        })
    })
  },
  /**
   * 扫描调出预览埋点
   */
  trackViewScan() {
    clickEventTracking('user_page_view', 'trackViewScan', {
      device_info: {
        device_session_id: app.globalData.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: '', //sn8码
        a0: '', //a0码
        widget_cate: '', //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },
}

module.exports = {
  scanCode,
}
