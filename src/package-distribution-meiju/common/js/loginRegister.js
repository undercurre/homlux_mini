import { getTimeStamp, getReqId, getUID, getStamp, hasKey } from 'm-utilsdk/index'
import { showToast } from '../../utils/util.js'
import { requestService, rangersBurialPoint } from '../../utils/requestService'
import { authorizedCommonTrack } from '../../track/track.js'
import { setTokenStorage, setIsAutoLogin, clearStorageSync, removeStorageSync } from '../../utils/redis.js'
import { getPrivateKeys } from '../../utils/getPrivateKeys'

const loginMethods = {
  checkSession() {
    return new Promise((resolve, reject) => {
      wx.checkSession({
        success(res) {
          //session_key 未过期，并且在本生命周期一直有效
          resolve(res)
        },
        fail(err) {
          // session_key 已经失效，需要重新执行登录流程
          reject(err)
        },
      })
    })
  },
  updateCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          resolve(res)
        },
        fail: (err) => {
          reject(err)
        },
      })
    })
  },
  //后台解密手机号
  decryptPhoneNumberApi(e) {
    return new Promise((resolve, reject) => {
      //只要包含了fail文案就认为失败，不调用后面的解密接口
      const msg = e.detail.errMsg
      if (msg.indexOf('fail') > -1) {
        console.log('have fail')
        //授权拒绝弹框埋点
        authorizedCommonTrack('user_behavior_event', 'click_btn_refuse', e.detail)
        reject()
        return
      }
      // wx.showLoading({
      //   title: '加载中...',
      //   icon: 'none'
      // })
      authorizedCommonTrack('user_behavior_event', 'click_btn_confirm', e.detail)
      let encryptedData = e.detail.encryptedData
      let iv = e.detail.iv
      let phoneCode = e.detail.code ? e.detail.code : ''
      let data = {
        timestamp: getStamp(),
        data: null,
        iotData: {
          iotAppId: '901',
          // "wxLoginCode": this.data.code,
          wxAccessToken: getApp().globalData.wxAccessToken || '',
          encryptedData: encryptedData,
          iv: iv,
          reqId: getReqId(),
          stamp: getTimeStamp(new Date()),
          code: phoneCode,
        },
      }
      console.log('解密手机号参数', data)
      requestService
        .request('getPhoneNumberMuc', data)
        .then((resData) => {
          if (resData.data.code == 0) {
            getApp().globalData.phoneNumber = resData.data.data.purePhoneNumber
            // this.setData({
            //   phoneNumber: resData.data.data.purePhoneNumber
            // })
            console.log('解密手机号成功res：', resData)
            resolve(resData)
          } else {
            console.log('解密手机号失败res：', resData)
            reject(resData)
          }
        })
        .catch((err) => {
          console.log('解密手机号失败 catch res', err)

          reject(err)
        })
    })
  },
  //绑定帐号
  bindAccountApi() {
    return new Promise((resolve, reject) => {
      // this.updateCode().then(res => {
      let data = {
        timestamp: getStamp(),
        data: {
          appKey: '46579c15',
          appVersion: '1.0.0',
          osVersion: '',
          platform: 110,
        },
        iotData: {
          iotAppId: '901',
          nickname: (getApp().globalData.userInfo && getApp().globalData.userInfo.nickName) || '',
          // "wxLoginCode": res.code,
          wxAccessToken: getApp().globalData.wxAccessToken || '',
          mobile: getApp().globalData.phoneNumber,
          prebind: true,
          invitationCode: '',
          reqId: getReqId(),
          stamp: getTimeStamp(new Date()),
        },
      }
      console.log('绑定接口传参', data)
      requestService
        .request('bindMuc', data)
        .then((res) => {
          if (res.data.code === 0) {
            console.log('绑定帐号成功res', res)
            getApp().globalData.userData = res.data.data
            getApp().globalData.phoneNumber = res.data.data.userInfo.mobile
            getApp().globalData.isLogon = true
            getPrivateKeys.getPrivateKeyAfterLogin()
            resolve(res)
          } else {
            console.log('绑定帐号失败res', res)
            showToast(res.data.msg || requestService.getErrorMessage(res.data.code))
            reject(res)
          }
        })
        .catch((err) => {
          if (!hasKey(err, 'data')) reject(err)
          if (!hasKey(err.data, 'code')) reject(err)
          reject(err)
        })
    })
  },
  //发送网络请求登陆小程序
  loginAPi(needCode = 'N') {
    const noPromptCode = [1000, 1110, 1105, 1217, 1219, 1404, 1407, 1406]
    return new Promise((resolve, reject) => {
      console.log('77777777777', getApp().globalData)
      // this.updateCode().then(res => {
      let timestamp = getStamp()
      let reqId = getReqId()
      let reqData = {
        appKey: '46579c15',
        appVersion: '1.0.0',
        osVersion: '',
        platform: 110,
      }
      let data = {
        timestamp: timestamp,
        data: reqData,
        iotData: {
          iotAppId: '901',
          // "wxLoginCode": res.code,
          wxAccessToken: getApp().globalData.wxAccessToken || '',
          nickname: (getApp().globalData.userInfo && getApp().globalData.userInfo.nickName) || '',
          invitationCode: needCode == 'Y' ? getApp().globalData.invitationCode : '', //"6524cb5e68926539",
          reqId: reqId,
          stamp: getTimeStamp(new Date()),
        },
      }
      // 发起网络请求
      requestService
        .request('loginMuc', data)
        .then((res) => {
          if (res.data.code === 0) {
            console.log('loginMuc sucess res：', res)
            getApp().globalData.userData = res.data.data
            getApp().globalData.phoneNumber = res.data.data.userInfo.mobile
            getApp().globalData.isLogon = true
            getApp().globalData.wxExpiration = true
            setTokenStorage(res.data.data.mdata.accessToken)
            setIsAutoLogin(true)
            if (res.data.data.region) {
              getApp().globalData.userRegion = res.data.data.region
              wx.setStorageSync('userRegion', res.data.data.region) //存储
            }
            getPrivateKeys.getPrivateKeyAfterLogin()
            resolve(res.data.data)
          } else {
            console.log('login fail res :', res.data)
            getApp().globalData.isLogon = false
            // showToast(res.data.msg || requestService.getErrorMessage(res.data.code))1404
            reject(res)
          }
        })
        .catch((err) => {
          console.log('login catch res :', err)
          getApp().globalData.isLogon = false
          if (!hasKey(err, 'data')) {
            reject(err)
            return
          }
          if (!hasKey(err.data, 'code')) {
            reject(err)
            return
          }
          if (noPromptCode.indexOf(err.data.code) === -1) {
            showToast('程序员小哥哥植发去了，请稍后重试')
          }
          reject(err)
        })
      // })
    })
  },
  //注册接口
  registerApi(params = {}) {
    return new Promise((resolve, reject) => {
      // this.updateCode().then(res => {
      let data = {
        timestamp: getStamp(),
        data: {
          appKey: '46579c15',
          appVersion: '2.9.4',
          osVersion: '',
          platform: 110,
        },
        iotData: {
          iotAppId: '901',
          nickname: (getApp().globalData.userInfo && getApp().globalData.userInfo.nickName) || '',
          // "wxLoginCode": res.code,
          wxAccessToken: getApp().globalData.wxAccessToken || '',
          mobile: getApp().globalData.phoneNumber,
          // "mobile": 15000000067,
          // "randomCode": this.data.randomCode,
          invitationCode: '',
          // "prebind": this.data.bypassSms ? true : false || false, //bypassSms验证码
          prebind: true,
          reqId: getReqId(),
          stamp: getTimeStamp(new Date()),
          isFirstReq: params.isFirstReq || false,

          // "activityId": this.data.activityId,
        },
      }
      requestService
        .request('rigisterMuc', data)
        .then((resp) => {
          if (resp.data.code == 0) {
            wx.showToast({
              title: '注册成功',
              icon: 'none',
              duration: 2000,
            })
            getApp().globalData.uid = resp.data.data.uid
            getApp().globalData.isLogon = true
            resolve(resp.data.data)
          } else {
            reject(resp.data.data)
          }
          resolve(resp)
        })
        .catch((err) => {
          // showToast(err.errMsg)
          reject(err)
        })
    })
    // })
  },
  //其他小程序带登陆态跳转
  bingApi(params = {}) {
    return new Promise((resolve, reject) => {
      this.updateCode().then((res) => {
        let timestamp = getStamp()
        let reqId = getReqId()
        let ramdom = getStamp()
        let reqData = {
          appKey: '46579c15',
          appVersion: '1.0.0',
          deviceId: ramdom,
          osVersion: '',
          platform: 110,
        }
        let data = {
          timestamp: timestamp,
          data: reqData,
          iotData: {
            iotAppId: '901',
            wxLoginCode: res.code,
            nickname: (getApp().globalData.userInfo && getApp().globalData.userInfo.nickName) || '',
            invitationCode: '',
            reqId: reqId,
            stamp: getTimeStamp(new Date()),
            uid: getApp().globalData.fromMiniProgramData.jp_c4a_uid,
            isFirstReq: params.isFirstReq || true,
          },
        }
        // 发起网络请求
        requestService
          .request('bing', data)
          .then((res) => {
            if (res.data.code === 0) {
              getApp().globalData.userData = res.data.data
              getApp().globalData.phoneNumber = res.data.data.userInfo.mobile
              getApp().globalData.isLogon = true
              console.log('app onshow11 setTokenStorage bing')
              setTokenStorage(res.data.data.mdata.accessToken)
              setIsAutoLogin(true)
              console.log('loginMuc sucess res：', res)
              getApp().globalData.wxExpiration = true

              console.log('bing success res :', res.data)
              getPrivateKeys.getPrivateKeyAfterLogin()
              resolve(res.data.data)
            } else {
              console.log('bing fail res :', res.data)

              reject(res.data.data)
            }
          })
          .catch((err) => {
            console.log('bing fail catch res :', err)
            getApp().globalData.isLogon = false
            // showToast(err.errMsg)
            reject(err)
          })
      })
    })
  },
  otherLogin() {
    return new Promise((resolve, reject) => {
      //判断是否从其他小程序跳转过来,是否带有登录态
      if (getApp().globalData.fromMiniProgramData && getApp().globalData.fromMiniProgramData.jp_c4a_uid) {
        this.bingApi()
          .then((res) => {
            resolve(res.data.data)
          })
          .catch((err) => {
            // showToast(err.errMsg)
            reject(err)
          })
      } else {
        reject()
      }
    })
  },
  checkHasOpenId() {
    getApp().globalData.openId = wx.getStorageSync('openId') || ''
    return getApp().globalData.openId ? true : false
  },
  //获取opendId
  getOpendId(params = { reqGetOpenIdChannel: 'app' }) {
    return new Promise((resolve, reject) => {
      // if(this.checkHasOpenId()) {
      //   resolve()
      //   return
      // }
      this.updateCode().then((res) => {
        let resq = {
          iotAppId: '901',
          wxLoginCode: res.code,
          reqId: getUID(),
          stamp: getTimeStamp(new Date()),
        }
        getApp().globalData.reqGetOpenIdChannel = params && params.reqGetOpenIdChannel
        requestService
          .request('getOpendId2', resq)
          .then((resp) => {
            if (resp.data.code == 0) {
              getApp().globalData.openId = resp.data.data.openId
              getApp().globalData.unionid = resp.data.data.unionid
              getApp().globalData.wxAccessToken = resp.data.data.wxAccessToken
              getApp().globalData.isGetOpenId = true
              getApp().$$Rangers.config({
                evtParams: {
                  open_id: resp.data.data.openId,
                },
              })
              wx.setStorageSync('openId', resp.data.data.openId)
              resolve(resp)
            }
            reject(resp)
          })
          .catch((err) => {
            reject(err)
            // showToast(err.errMsg)
          })
      })
    })
  },
  getPhoneNumber(e) {
    return new Promise((resolve, reject) => {
      this.decryptPhoneNumberApi(e)
        .then(() => {
          this.bindAccountApi().then(
            (res) => {
              wx.hideLoading()

              resolve(res)
            },
            (resData) => {
              wx.hideLoading()
              //绑定不成功，设置未登录状态
              console.log('bind err', resData)
              if (resData.data.code == 1105) {
                //帐户不存在
                resolve(resData)
              } else {
                wx.showToast({
                  icon: 'none',
                  title: resData.data.msg || requestService.getErrorMessage(resData.data.code),
                })
                reject()
              }
            },
          )
        })
        .catch((err) => {
          wx.hideLoading()
          //解密手机号失败
          reject(err)
        })
    })
  },
  //页面浏览
  pageViewTrack(page_name) {
    // if (this.data.gdt_vid || this.data.channel || this.data.subchannel) {
    this.getOpendId().then(() => {
      this.eventTracking('splash_page_view', {
        page_name: page_name,
      })
    })
    // }
  },
  phoneNumberTrack() {
    this.eventTracking('splash_button_click', {
      page_name: '帐号授权弹窗',
      element_content: '允许',
    })
  },
  buttonClickTrack(params) {
    this.eventTracking('splash_button_click', {
      ...params,
    })
  },
  setTackParams(params) {
    this.setData({
      ...params,
    })
    // this.setData({
    //   activity_name: activity_name,
    //   shareSpreadId: shareSpreadId,
    //   gdt_vid: gdt_vid
    // })
  },
  eventTracking(event, params) {
    console.log(
      '埋点参数',
      this.data.channel,
      this.data.shareSpreadId,
      this.data.gdt_vid,
      getApp().globalData.openId,
      this.data.activity_name,
      params['page_name'],
      params['element_content'],
    )
    // if (this.data.gdt_vid || this.data.channel || this.data.subchannel) {
    if (event.indexOf('page_view') !== -1) {
      rangersBurialPoint('splash_page_view', {
        module: '活动',
        activity_name: this.data.activity_name || '美的美居',
        page_name: params['page_name'],
        spreadid: this.data.shareSpreadId || '',
        channel: this.data.channel || '', //渠道
        subchannel: this.data.subchannel || '', //渠道子类
        activity_id: '',
        click_id: this.data.gdt_vid,
        openId: getApp().globalData.openId || '',
      })
    } else if (event.indexOf('button_click') !== -1) {
      rangersBurialPoint('splash_button_click', {
        module: '活动',
        activity_name: this.data.activity_name || '美的美居',
        page_name: params['page_name'],
        activity_id: '',
        spreadid: this.data.shareSpreadId || '',
        channel: this.data.channel || '', //渠道
        subchannel: this.data.subchannel || '', //渠道子类
        click_id: this.data.gdt_vid,
        openId: getApp().globalData.openId || '',
        element_content: params['element_content'],
      })
    } else if (event.indexOf('user_authorized') !== -1) {
      rangersBurialPoint('user_authorized', {
        module: '活动',
        activity_name: this.data.activity_name || '美的美居',
        page_name: '帐号授权弹窗',
        activity_id: '',
        spreadid: this.data.shareSpreadId || '',
        channel: this.data.channel || '', //渠道
        subchannel: this.data.subchannel || '', //渠道子类
        // uid: this.data.uid || app.globalData.uid || '',
        click_id: this.data.gdt_vid || '',
        openId: getApp().globalData.openId || '',
        mobile: getApp().globalData.phoneNumber || '',
        code: params['code'],
        login_result: params['login_result'],
      })
    } else if (event.indexOf('device_view') !== -1) {
      rangersBurialPoint('device_view', {
        module: '活动',
        page_name: '首页',
        tab_name: params['tab_name'],
        apptype_name: params['apptype_name'],
        widget_cate: params['widget_cate'],
        spreadid: this.data.shareSpreadId || '',
        channel: this.data.channel || '', //渠道
        subchannel: this.data.subchannel || '', //渠道子类
        click_id: this.data.gdt_vid || '',
        openId: getApp().globalData.openId || '',
      })
    }
    // }
  },
  // 退出登录
  logout() {
    getApp().globalData.isLogon = false
    removeStorageSync()
    // clearStorageSync()
    setIsAutoLogin(false)
  },
  // 获取是否在c4a提交注销
  getLogoutStatus() {
    return new Promise((resolve, reject) => {
      requestService
        .request('getLogOutStatus', {})
        .then((res) => {
          const data = res.data
          resolve(data)
        })
        .catch((e) => {
          console.log(e, 'logout')
          reject()
        })
    })
  },
  getDcpDeviceImgs() {
    let reqData = {
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('getIotDeviceV3', reqData)
        .then((res) => {
          console.log('列表查询', res)
          if (res.data.code == 0) {
            resolve(res.data.data.iconList)
            // wx.setStorageSync('dcpDeviceImgList', res.data.data.iconList)
            // that.globalData.dcpDeviceImgList = res.data.data.iconList
          }
          // resolve(res.data.data.iconList)
        })
        .catch((error) => {
          console.log(error)
          reject()
        })
    })
  },
  // 校验是否需要强制更新
  checkIsUpdate(version) {
    let reqData = {
      appId: 901,
      clientType: 5,
      version: version,
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('checkIsUpdate', reqData)
        .then((res) => {
          console.log('校验登录', res)
          if (res.data.code == 0) {
            resolve(res.data.data)
          }
        })
        .catch((error) => {
          console.log(error)
          reject()
        })
    })
  },
}
export default loginMethods
