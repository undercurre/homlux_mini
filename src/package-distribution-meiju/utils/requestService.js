import { getStamp, hasKey, CryptoJS, md5 } from 'm-utilsdk/index'
import { getNewSign } from './util'
import { api } from '../api'
import trackApiList from '../track/oneKeyTrack/config/trackApiList.js'
import { authorizedCommonTrack, trackLoaded } from '../track/track.js'
import { pluginRequestTrack } from '../track/pluginTrack.js'
import cloudMethods from '../globalCommon/js/cloud.js'

import qs from './qs'

var requestService = {
  request: (apiName, params, method, headerObj, timeout) => {
    return new Promise((resolve, reject) => {
      let timestamp = getStamp()
      let apiObj = api[apiName]
      let url
      if (apiObj) {
        //已有接口配置
        // url = api.isMasEnv ? api[apiName].masUrl : api[apiName].url
        url = api.isMasEnv ? cloudMethods.cloudRule(api[apiName].masUrl) : api[apiName].url //20230605屏蔽多云的需求，20230612开放多云入口
      } else {
        if (apiName.indexOf('http') > -1) {
          //不是现有接口直接传完整地址
          url = apiName
        } else {
          //不是现有接口，复用环境域名，只传uri(MAS Key)
          url = api.urlPrefix + apiName
        }
      }

      let MzTdecode_seed = ''
      //品类服透传接口，加密data
      if (apiName == 'MzTransmit') {
        // 准备解密种子
        let accessToken = getApp().globalData.userData.key //用户的key
        accessToken = CryptoJS.enc.Hex.parse(accessToken)
        accessToken = CryptoJS.enc.Base64.stringify(accessToken)
        let appKey = api.appKey //云端分配给App的key
        let md5_key = md5(appKey).substring(0, 16)
        md5_key = CryptoJS.enc.Utf8.parse(md5_key)
        MzTdecode_seed = CryptoJS.AES.decrypt(accessToken, md5_key, {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7,
        }).toString(CryptoJS.enc.Utf8)
        //准备对data进行加密
        if (params.data) {
          let tempData = ''
          let content = JSON.stringify(params.data)
          MzTdecode_seed = CryptoJS.enc.Utf8.parse(MzTdecode_seed)
          //加密data,加密种子是前面解密的key
          tempData = CryptoJS.AES.encrypt(content, MzTdecode_seed, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7,
          })
          tempData = tempData.ciphertext.toString()
          params['data'] = tempData
        }
      }
      //网关透传接口，加密order
      let decode_seed = ''
      if (apiName == 'gatewayTransport') {
        //准备解密的种子，解密key,seed是appid
        let content = getApp().globalData.userData.key
        content = CryptoJS.enc.Hex.parse(content)
        content = CryptoJS.enc.Base64.stringify(content)
        let md5_key = md5(api.appKey).substring(0, 16)
        md5_key = CryptoJS.enc.Utf8.parse(md5_key)
        //解密key,得到加密种子，用来加密order
        decode_seed = CryptoJS.AES.decrypt(content, md5_key, {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7,
        }).toString(CryptoJS.enc.Utf8)

        //准备对order进行加密
        if (params.order) {
          let tempOrder = ''
          let content = JSON.stringify(params.order)
          decode_seed = CryptoJS.enc.Utf8.parse(decode_seed)
          //加密order,加密种子是前面解密的key
          tempOrder = CryptoJS.AES.encrypt(content, decode_seed, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7,
          })
          tempOrder = tempOrder.ciphertext.toString()
          params['order'] = tempOrder
        }
      }

      let header = {
        'content-type': getHeaderContentType(headerObj), // 默认值
        random: timestamp,
        secretVersion: '1.0',
        sign: getNewSign(params, api.apiKey, timestamp, method), //new
        version: '8.5',
        iotAppId: '901',
        ...headerObj,
        // 'iot-gray-identification': "beta", //临时添加alpha泳道
      }
      if (getApp() && getApp().globalData && getApp().globalData.userData) {
        let accessToken = getApp().globalData.userData.mdata.accessToken
        let region = wx.getStorageSync('userRegion')
        header['accessToken'] = accessToken
        if (region) {
          header['regionSign'] = md5(accessToken + region)
        }
      }
      if (apiName == 'multiNetworkGuide') {
        //选型获取指引 要求app版大于7.8才支持蓝牙配网
        // header['version'] = '8.0.0'
        header['version'] = ''
      }
      // --- 设置快开中转消息头 --- 2021.08.19 Ao(敖广骏)
      if (getApp() && getApp().globalData && getApp().globalData.pluginHeaders) {
        let pluginHeaders = getApp().globalData.pluginHeaders
        for (let key in pluginHeaders) {
          header[key] = pluginHeaders[key]
        }
      }
      // --- 设置快开中转消息头 end ---
      //---调用接口的埋点 start  2021-05-06--
      const selectApi = trackApiList.filter((item) => {
        return item[apiName] == apiName
      })
      trackLoaded('page_loaded_event', apiName, {}, 1, 'start')
      //---调用接口的埋点 end --
      wx.request({
        url: url,
        data: params,
        header: header,
        method: method || 'POST',
        timeout: timeout || 15000, //lisin 新增接口超时时间传参
        success(resData) {
          ApiTrack(apiName, selectApi, resData, 'success', params)
          trackLoaded('page_loaded_event', apiName, resData, 1, 'end')
          if (apiName === 'luaControl') {
            pluginApiTrack('success', params, resData)
          }
          wx.hideNavigationBarLoading()
          console.log('返回数据', resData)
          if (
            resData.data.errorCode == 0 ||
            resData.code == 0 ||
            resData.data.code == 0 ||
            resData.data.errCode == 0 ||
            (resData.data.resultcode == 0 && resData.data.returncode == 0) ||
            resData.data.status == true ||
            resData.data.returnStatus == true ||
            resData.data.status == false ||
            resData.data.returnStatus == false ||
            resData.data.code == 200 ||
            resData.data.retCode == '0' ||
            resData.retcode == 'SUCC' ||
            resData.data.retcode == 'SUCC'
          ) {
            //支持电商接口
            //网关透传接口,解密返回的响应
            if (apiName == 'gatewayTransport') {
              let content = resData.data.data.reply
              content = CryptoJS.enc.Hex.parse(content)
              content = CryptoJS.enc.Base64.stringify(content)
              //解密返回的响应，解密种子跟前面用来加密的种子是同一个
              let subResponse = CryptoJS.AES.decrypt(content, decode_seed, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7,
              })
              resData.data.data.data = JSON.parse(subResponse.toString(CryptoJS.enc.Utf8))
            }
            resolve(resData)
          } else {
            //登录态过期返回40002
            if (resData.data.errorCode == 40002 || resData.code == 40002 || resData.data.code == 40002) {
              getApp().globalData.isLogon = false
            }
            ///mjl/v1/device/status/lua/get接口报1321错误码，进入后确权页面
            if (apiName == 'luaGet' && resData.data.code == '1321') {
              deviceCardToPlugin(params.applianceCode)
            }
            reject(resData)
          }
        },
        fail(error) {
          ApiTrack(apiName, selectApi, error, 'fail', params)
          if (apiName === 'luaControl') {
            pluginApiTrack('fail', params, error)
          }
          trackLoaded('page_loaded_event', apiName, error, 1, 'end')
          reject(error)
        },
      })
    })
  },
  getErrorMessage: (code) => {
    return errorList[code] || '未知系统错误'
  },
  //colmo获取设备列表
  getColmoProductList: (data = {}, context, headerOpt = {}) => {
    let params = {
      codeType: 'colmo',
      code: 2647911997,
    }
    let url = api.getColmoProductList.url + `&${qs.stringify(params)}`
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        data,
        method: 'POST',
        timeout: 12000,
        header: {
          'Content-Type': 'application/json;charset=utf-8',
          ...headerOpt,
        },
        success(res) {
          const { statusCode, data } = res
          if (statusCode === 200 && data.code === 0 && data.data) {
            resolve(data.data)
          } else {
            reject()
          }
        },
        fail(e) {
          reject(e)
        },
      })
    })
  },
}

//上传文件接口通用封装
var uploadFileTask = function (params) {
  return new Promise((resolve, reject) => {
    let timestamp = getStamp()
    wx.uploadFile({
      url: params.url,
      filePath: params.filePath,
      name: 'file',
      header: {
        'Content-Type': 'multipart/form-data',
        timestamp,
        accessToken: getApp()?.globalData?.userData?.mdata.accessToken,
        iotAppId: api.iotAppId,
      },
      formData: {
        file: params.contentStr,
      },
      success(res) {
        if (res.statusCode == '200') {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail(err) {
        console.log(err)
        reject(err)
      },
    })
  })
}

// 数据埋点接口
var requestBurialPoint = function (
  apiName,
  param = { action_type: '', sub_action: '', action_result: '', page_name: '', widget_name: '' },
) {
  var defaultParam = {
    opt_system_type: '', //操作系统类型 *
    network_type: '', // *
    device_type: '', //手机型号 *
    opt_system_version: '', //操作系统版本 *
    network_operator: '', //网络运营商名 x
    device_resolution: '', // 分辨率 *
    device_brand: '', //手机品牌 *
    install_way: '', //安装渠道 //x
    device_imei: '', // 手机唯一标识 x
    //app_version: '1.0.0',  // *
    ip: getApp().globalData.ip || '', //x
    location_gps_lat: '', //x
    app_name: '微信小程序-MeijuLite',
    page_name: param.page_name, //*
    //app_key: '1ym983d5', //*
    user_account: '', // *手机号码
    uid: '', //*
    action_type: param.action_type, // *
    action_create_time: getStamp(), //*
    action_result: param.action_result,
    sub_action: param.sub_action, //*
    widget_name: param.widget_name || 'WeChat',
  }
  wx.getSystemInfo({
    success(res) {
      let OSversion = res.system.split(' ')[1] || res.system

      defaultParam.opt_system_version = OSversion
      defaultParam.opt_system_type = res.platform
      defaultParam.device_type = res.model
      defaultParam.device_brand = res.brand
      defaultParam.uid = (getApp().globalData.userData && getApp().globalData.userData.uid) || ''
      defaultParam.user_account =
        (getApp().globalData.userData &&
          getApp().globalData.userData.userInfo &&
          getApp().globalData.userData.userInfo.mobile) ||
        getApp().globalData.phoneNumber
      defaultParam.device_resolution = `${res.screenHeight}*${res.windowWidth}`
    },
  })

  wx.getNetworkType({
    success(res) {
      let networkType = res.networkType.toUpperCase()
      networkType = networkType == 'UNKNOWN' ? '未知' : networkType

      defaultParam.network_type = networkType

      // 数序列化,埋点
      let burialData = {
        topic: 'plugin_action',
        msgJson: JSON.stringify(defaultParam),
      }
      let ret = ''
      for (let it in burialData) {
        ret += '&' + encodeURIComponent(it) + '=' + encodeURIComponent(burialData[it])
      }
      ret = ret.substr(1)

      wx.request({
        url: api[apiName].masUrl + '?' + ret,
        method: 'POST',
        data: {},
        success(res) {
          console.log('埋点成功', res)
        },
      })
    },
  })
}

//字节埋点
var rangersBurialPoint = function (apiName, param) {
  const app = getApp()
  const launchOptions = wx.getLaunchOptionsSync()
  if (app) {
    let gdt_vid = launchOptions.query.gdt_vid ? launchOptions.query.gdt_vid : ''
    let qz_gdt = launchOptions.query.qz_gdt ? launchOptions.query.qz_gdt : ''
    app.$$Rangers.config({
      evtParams: {
        click_id: gdt_vid + qz_gdt,
        scene: launchOptions.scene,
      },
    })
  }
  if (app && app.globalData.userData) {
    app.$$Rangers.config({
      user_id: app.globalData.userData.uid || '',
      user_unique_id: app.globalData.userData.uid || '',
      user_type: app.globalData.userData.grade || '',
    })
  }
  if (app && app.globalData.userData && app.globalData.userData.userInfo) {
    app.$$Rangers.config({
      nick_name: app.globalData.userData.userInfo.nickName || '',
      gender: app.globalData.userData.userInfo.sex === 'F' ? '女' : '男' || '',
      avatar_url: app.globalData.userData.userInfo.headImgUrl || '',
    })
  }
  if (app) {
    app.$$Rangers.send() // 设置完毕，可以发送事件了
  }

  // app.$$Rangers = $$Rangers //挂载到全局实例
  if (apiName && param) {
    //设置启动小程序来源埋点
    param.launch_source = app.globalData.launch_source
    //设置启动小程序投放渠道cid参数
    param.cid = app.globalData.cid
    //如果是微信扫一扫设备二维码进入小程序配网的，ext_info需要携带source wechat_scan属性方便跟踪分析
    if (app.globalData.fromWechatScan) {
      if (param.ext_info) {
        if (typeof param.ext_info == 'object') {
          param.ext_info.source = app.globalData.fromWechatScan
        } else {
          param.ext_info = {
            ext_info: param.ext_info,
            source: app.globalData.fromWechatScan,
          }
        }
      } else {
        param.ext_info = {}
        param.ext_info.source = app.globalData.fromWechatScan
      }
    }
    app.$$Rangers.event(apiName, param)
  }
}
var errorList = {
  1000: '未知系统错误',
  1002: '参数为空',
  1110: '第三方账户没有绑定手机账户',
  1217: '该邀请无效',
  1102: '没有进行手机认证或者手机认证已过期',
  1103: '手机认证随机码不匹配',
  1109: '第三方账户token认证失败',
  1105: '手机账户不存在',
  1200: '用户不在家庭里面（没有权限的错误之一）',
  1202: '用户没有邀请加入家庭的权限',
  1219: '该邀请已被其他用户使用，请联系邀请者重新邀请',
  1220: '该邀请已过期，请联系邀请者重新邀请',
}
const ApiTrack = (apiName, list, resData, flag, reqData) => {
  if (list.length == 0) return
  const select = list[0]

  if (flag == 'success') {
    console.log('接口埋点success:apiName', apiName, resData)
    const params = {
      code: resData.data.code,
      msg: resData.data.msg,
      resData: resData.data,
      reqData,
    }
    authorizedCommonTrack('user_behavior_event', select['widget_id'], params)
  } else if (flag == 'fail') {
    console.log('接口失败', resData)
    const params = {
      code: '',
      msg: resData.errMsg,
      resData: resData,
      reqData,
    }
    console.log('接口埋点fail:apiName', apiName, resData)
    authorizedCommonTrack('user_behavior_event', select['widget_id'], params)
  }
}
const pluginApiTrack = (reqStatus, reqData, resData) => {
  // luaControl
  let data = {}
  if (reqStatus === 'success') {
    data = {
      req_params: reqData,
      code: hasKey(resData.data, 'code') ? resData.data.code : '-1',
      msg: resData.data.msg,
    }
  } else {
    data = {
      req_params: reqData,
      code: hasKey(resData.data, 'code') ? resData.data.code : '-2',
      msg: hasKey(resData.data, 'msg') ? resData.data.msg : '',
    }
  }
  pluginRequestTrack(data)
}

const getHeaderContentType = (header) => {
  if (!header) return 'application/json'
  if (hasKey(header, 'content-type')) {
    return header['content-type']
  } else {
    return 'application/json'
  }
}

//如果该设备卡片缓存的是不支持确权或已确权，但mjl/v1/device/status/lua/get接口报1321错误码，则进入后确权页面进行确权
function deviceCardToPlugin(applianceCode) {
  let pages = getCurrentPages()
  let currentPage = pages[pages.length - 1]
  //只有当前进入插件页，才跳后确权页
  if (!currentPage.route.includes('plugin')) {
    console.log('aaaaa从页面跳进来', currentPage.route)
    return
  }
  if (currentPage.route.includes('afterCheck')) return //进入插件页lua/get接口会重复请求，避免多次进入后确权页
  if (getApp().globalData.noAuthApplianceCodeList.includes(applianceCode)) {
    wx.reLaunch({
      url: '/distribution-network/addDevice/pages/afterCheck/afterCheck?backTo=/pages/index/index',
    })
  }
}

export { requestService, uploadFileTask, requestBurialPoint, rangersBurialPoint }
