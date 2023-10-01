import { getStamp, hasKey, CryptoJS, md5 } from 'm-utilsdk/index'
import { getNewSign } from './util'
import { api } from '../common/js/api'

import qs from './qs'

var requestService = {
  request: (apiName, params, method, headerObj, timeout) => {},
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
var rangersBurialPoint = function (apiName, param) {}
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
  } else if (flag == 'fail') {
    console.log('接口失败', resData)
    const params = {
      code: '',
      msg: resData.errMsg,
      resData: resData,
      reqData,
    }
    console.log('接口埋点fail:apiName', apiName, resData)
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
      url: '/package-distribution-meiju/pages/addDevice/pages/afterCheck/afterCheck?backTo=/pages/index/index',
    })
  }
}

export { requestService, uploadFileTask, requestBurialPoint, rangersBurialPoint }
