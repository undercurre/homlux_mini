import { formatTime, getTimeStamp, getReqId, getUID, getStamp, RndNum, getSign, cheakVersion } from 'm-utilsdk/index'

import { requestService } from '../../../../../utils/requestService'

import { CryptoJS, md5 } from '../../../../../../miniprogram_npm/m-utilsdk/index'
import { api } from '../../../../../common/js/api'

const app = getApp()

export default class MeijuService {
  constructor() {}

  getApplianceList(resolve) {
    let reqData = {
      reqId: getReqId(),
      stamp: getStamp(),
      bluetoothDetail: true,
    }
    requestService.request('applianceList', reqData).then((resp) => {
      console.log('getApplianceList==========', JSON.stringify(resp.data))
      if (resp.data.code == 0) {
        let applianceList = []
        let homeList = resp.data.data.homeList
        app.globalData.homegroupId = homeList[0].homegroupId
        for (let i = 0; i < homeList.length; i++) {
          // console.log("------------", homeList[i].name)
          for (let j = 0; j < homeList[i].roomList.length; j++) {
            // console.log("------------", homeList[i].roomList[j].des)
            for (let k = 0; k < homeList[i].roomList[j].applianceList.length; k++) {
              let appliance = homeList[i].roomList[j].applianceList[k]
              if (appliance.type != '0xAC') {
                continue
              }
              appliance.plainSn = this.decrypt(appliance.sn)
              applianceList.push(appliance)
            }
          }
        }
        console.log('++++++++++', applianceList)
        resolve(applianceList)
      }
    })
  }

  //查询设备状态并更新界面
  luaQuery(applianceCode, param) {
    return new Promise((resolve, reject) => {
      let command =
        param.query_type !== undefined
          ? {
              query: param,
            }
          : {}

      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
        applianceCode: applianceCode,
        command: command,
      }
      requestService.request('luaGet', reqData).then(
        (resp) => {
          console.log(resp.data.data)
          if (resp.data.code == 0) {
            resolve(resp.data.data || {})
          } else {
            reject(resp)
          }
        },
        (error) => {
          wx.hideNavigationBarLoading()
          console.error(error)
          reject(error)
        },
      )
    })
  }
  //查询设备状态并更新界面
  luaControl(applianceCode, param) {
    return new Promise((resolve, reject) => {
      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
        applianceCode: applianceCode,
        command: {
          control: param,
        },
      }
      requestService.request('luaControl', reqData).then(
        (resp) => {
          if (resp.data.code == 0) {
            resolve(resp.data.data.status || {})
          } else {
            reject(resp)
          }
        },
        (error) => {
          wx.showToast({
            title: '设备未响应，请稍后尝试刷新',
            icon: 'none',
            duration: 2000,
          })
          console.error(error)
          reject(error)
        },
      )
    })
  }

  /**
   * 其他小程序带登录态跳转
   */
  fromMiniProgramLogin() {
    let ramdom = getStamp()
    return new Promise((resolve, reject) => {
      wx.login({
        success(res) {
          if (res.code) {
            let code = res.code
            let timestamp = getStamp()
            let reqId = getReqId()
            let reqData = {
              appKey: '46579c15',
              appVersion: '1.0.0',
              deviceId: ramdom, //app.globalData.fromMiniProgramData.jp_rand,
              osVersion: '',
              platform: 110,
            }
            let data = {
              timestamp: timestamp,
              data: reqData,
              iotData: {
                iotAppId: '901',
                wxLoginCode: code,
                nickname: (app.globalData.userInfo && app.globalData.userInfo.nickName) || '',
                invitationCode: '',
                reqId: reqId,
                stamp: getTimeStamp(new Date()),
                uid: app.globalData.fromMiniProgramData.jp_c4a_uid,
              },
            }
            requestService.request('bing', data).then(
              (resp) => {
                //bing//login
                if (resp.data.code == 0) {
                  //更新登录状态
                  app.globalData.isLogon = true
                  app.globalData.userData = resp.data.data //添加用户数据 加密sn使用
                  app.globalData.phoneNumber = resp.data.data.userInfo.mobile
                  resolve(resp)
                } else {
                  reject(resp)
                }
              },
              (error) => {
                reject(error)
              },
            )
          } else {
            //console.log('登录失败！' + res.errMsg)
            reject()
          }
        },
      })
    })
  }

  //获取家庭列表
  getHomeGrouplistService() {
    //获取家庭列表
    return new Promise((resolve, reject) => {
      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService.request('homeList', reqData).then(
        (resp) => {
          if (resp.data.code == 0) {
            resolve(resp.data.data.homeList)
          } else {
            reject(resp)
          }
        },
        (error) => {
          reject(error)
        },
      )
    })
  }

  //绑定设备
  bindDevice(currentHomeGroupId, sn, callback, callFail) {
    // 发起网络请求
    let reqData = {
      homegroupId: currentHomeGroupId || '1155161',
      sn: this.encrypt(sn),
      applianceType: '0xAC',
      isBluetooth: 1, //0：wifi设备 1：蓝牙设备
      reqId: getReqId(),
      stamp: getStamp(),
    }
    requestService.request('bindDeviceToHome', reqData).then(
      (resp) => {
        console.log('绑定设备结果', resp.data)
        callback && callback(resp)
      },
      (error) => {
        callFail && callFail(error)
      },
    )
  }

  decrypt(chiperText) {
    let content = app.globalData.userData.key
    content = CryptoJS.enc.Hex.parse(content)
    content = CryptoJS.enc.Base64.stringify(content)
    let md5_key = md5(api.appKey).substring(0, 16)
    md5_key = CryptoJS.enc.Utf8.parse(md5_key)
    let decode_seed = CryptoJS.AES.decrypt(content, md5_key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8)
    decode_seed = CryptoJS.enc.Utf8.parse(decode_seed)
    chiperText = CryptoJS.enc.Hex.parse(chiperText)
    chiperText = CryptoJS.enc.Base64.stringify(chiperText)
    let plain = CryptoJS.AES.decrypt(chiperText, decode_seed, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    })
    plain = plain.toString(CryptoJS.enc.Utf8)
    return plain
  }

  encrypt(plainText) {
    let content = app.globalData.userData.key
    console.log('当前的key======', app.globalData.userData.key)
    content = CryptoJS.enc.Hex.parse(content)
    content = CryptoJS.enc.Base64.stringify(content)
    let md5_key = md5(api.appKey).substring(0, 16)
    md5_key = CryptoJS.enc.Utf8.parse(md5_key)
    let decode_seed = CryptoJS.AES.decrypt(content, md5_key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8)
    decode_seed = CryptoJS.enc.Utf8.parse(decode_seed)
    //加密order,加密种子是前面解密的key
    let chiperText = CryptoJS.AES.encrypt(plainText, decode_seed, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    })
    chiperText = chiperText.ciphertext.toString()
    return chiperText
  }

  getIotDeviceByCode() {
    let reqData = {
      reqId: getReqId(),
      stamp: getStamp(),
    }
    requestService.request('getIotDeviceByCode', reqData).then((resp) => {})
  }

  checkDeviceBindInfo(deviceSN, callback, error) {
    requestService
      .request('bindInfo', {
        sn: deviceSN,
        reqId: getReqId(),
        stamp: getTimeStamp(new Date()),
      })
      .then((resp) => {
        console.log(JSON.stringify(resp))
        callback && callback(resp)
      })
      .catch((err) => {
        error && error(err)
      })
  }
}
