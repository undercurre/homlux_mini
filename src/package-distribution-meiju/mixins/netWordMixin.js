// rigister-behaviors.js
import { requestService } from '../../../utils/requestService'
import { getReqId, getStamp } from 'm-utilsdk/index'
import { deviceImgMap } from '../../../utils/deviceImgMap'
import { deviceImgApi } from '../../../api'
var log = require('../../../utils/log')

module.exports = Behavior({
  behaviors: [],
  properties: {
    // deviceInfo: {
    //     type: Object
    // }
  },
  data: {
    // deviceInfo: '',
  },
  methods: {
    //获取配网指引
    getAddGuide(fm = 'selectType', deviceInfo = {}) {
      let { mode, type, sn8, enterprise, ssid, productId, tsn, sn } = deviceInfo
      if (fm == 'autoFound') {
        let reqData = {
          mode: mode + '',
          category: type.includes('0x') ? type.substr(2, 2) : type,
          code: sn8,
          enterpriseCode: enterprise,
          ssid: ssid,
          queryType: 2,
          reqId: getReqId(),
          stamp: getStamp(),
        }
        console.log('自发现请求确权指引', reqData)
        return new Promise((resolve, reject) => {
          requestService
            .request('multiNetworkGuide', reqData)
            .then((resp) => {
              console.log('自发现获得确权指引', resp)
              console.log('配网指引信息', resp.data.data.mainConnectinfoList[0].connectDesc)
              resolve(resp)
            })
            .catch((error) => {
              console.log(error)
              reject(error)
            })
        })
      }
      if (fm == 'selectType') {
        let reqData = {
          code: sn8,
          stamp: getStamp(),
          reqId: getReqId(),
          enterpriseCode: enterprise,
          category: type.includes('0x') ? type.substr(2, 2) : type,
          productId: productId,
          queryType: 1,
        }
        console.log('自发现请求确权指引', reqData)
        return new Promise((resolve, reject) => {
          requestService
            .request('multiNetworkGuide', reqData)
            .then((resp) => {
              console.log('配网指引信息 选型', resp.data.data.mainConnectinfoList)
              resolve(resp)
            })
            .catch((error) => {
              console.log(error)
              reject(error)
            })
        })
      }
      if (fm == 'scanCode') {
        let reqData = {
          sn: sn,
          reqId: getReqId(),
          stamp: getStamp(),
          ssid: ssid,
          enterpriseCode: enterprise,
          category: type.includes('0x') ? type.substr(2, 2) : type,
          code: sn8,
          mode: mode + '',
          tsn: tsn,
          queryType: 2,
        }
        console.log('扫码请求确权指引', reqData)
        return new Promise((resolve, reject) => {
          requestService
            .request('multiNetworkGuide', reqData)
            .then((resp) => {
              console.log('配网指引信息 扫码', resp.data.data.mainConnectinfoList)
              resolve(resp)
            })
            .catch((error) => {
              console.log(error)
              reject(error)
            })
        })
      }
    },
    //获取设备图片
    getDeviceImg(dcpDeviceImgList, type, sn8) {
      if (dcpDeviceImgList[type]) {
        // console.log("找到了这个品类")
        if (dcpDeviceImgList[type][sn8]) {
          // console.log("找到对应sn8")
          return dcpDeviceImgList[type][sn8]
        } else {
          return dcpDeviceImgList[type].common
        }
      } else {
        console.log('没找到', deviceImgMap)
        if (deviceImgMap[type]) {
          return deviceImgApi.url + deviceImgMap[type].onlineIcon + '.png'
        } else {
          return deviceImgApi.url + 'blue_default_type.png'
        }
      }
    },
    logAddDivceInfo(logKey, addDviceInfo) {
      let addDviceInfoTemp = JSON.parse(JSON.stringify(addDviceInfo))
      if (addDviceInfoTemp.againCheckList) addDviceInfoTemp.againCheckList = ''
      if (addDviceInfoTemp.apUtils) addDviceInfoTemp.apUtils = ''
      if (addDviceInfoTemp.deviceImgPath) addDviceInfoTemp.deviceImgPath = ''
      if (addDviceInfoTemp.guideInfo) addDviceInfoTemp.guideInfo = ''
      log.info(logKey, addDviceInfoTemp)
    },
    //当前手机网络状态
    nowNetType() {
      return new Promise((resolve, reject) => {
        wx.getNetworkType({
          success(res) {
            console.log('当前网络状况', res)
            resolve(res.networkType)
          },
          fail(error) {
            console.log('获取当前网络状况错误', error)
            reject(error)
          },
        })
      })
    },
  },
})
