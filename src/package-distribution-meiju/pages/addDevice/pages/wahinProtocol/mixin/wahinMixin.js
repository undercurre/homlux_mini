// import {
//     getTimeStamp,
//     getReqId,
//     getUID,
//     getStamp,
//     RndNum,
//     getSign
// } from 'm-utilsdk/index'
import { requestService } from '../../../../../utils/requestService'
import BluetoothConn from '../bluetooth/bluetooth-conn.js'
import DeviceComDecorator from '../utils/ac-service/DeviceComDecorator'
const app = getApp() //获取应用实例
module.exports = Behavior({
  behaviors: [],
  properties: {
    deviceInfo: {
      type: Object,
    },
  },
  data: {
    // deviceInfo: '',
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
  },
  methods: {
    //华凌登录
    wahinLogin() {
      let that = app
      return new Promise((resolve, reject) => {
        wx.login({
          success(res) {
            if (res.code) {
              console.log('code:', res.code)
              //发起网络请求
              // let param = {
              //     code: res.code,
              //     source: wx.getSystemInfoSync().platform,
              //     minigramId: "wxb12ff482a3185e46"
              // }
              // requestService.request('userInfoGet',param).then((res)=>{
              //     console.log("登录返回requestService：", res.data)
              //     if (res.data.data.errCode == 0) {
              //         that.openId6 = res.data.data.result.openId6;
              //         wx.setStorageSync("openId6", that.openId6);
              //         that.token = res.data.data.result.token;
              //         that.deviceList = res.data.data.result.deviceList;
              //         for (let deviceId in that.deviceList) {
              //             that.deviceList[deviceId].sn3 = that.deviceList[deviceId].sn8.substring(0, 3)
              //         }
              //         wx.setStorageSync('myDevices', that.deviceList);
              //         console.log('that.deviceList=====', that.deviceList)
              //         resolve()
              //     }
              // }).catch((err)=>{
              //     console.log('wahin login error',err)
              //     reject(err)
              // })

              wx.request({
                url: 'https://smartrac.midea.com/bluetooth/control/minigram/userInfo/get',
                method: 'POST',
                data: {
                  code: res.code,
                  source: wx.getSystemInfoSync().platform,
                  minigramId: 'wxb12ff482a3185e46',
                },
                success(res) {
                  console.log('登录返回：', res.data)
                  if (res.data.errCode == 0) {
                    that.openId6 = res.data.result.openId6
                    wx.setStorageSync('openId6', that.openId6)
                    that.token = res.data.result.token
                    that.deviceList = res.data.result.deviceList
                    for (let deviceId in that.deviceList) {
                      that.deviceList[deviceId].sn3 = that.deviceList[deviceId].sn8.substring(0, 3)
                    }
                    wx.setStorageSync('myDevices', that.deviceList)
                    console.log('that.deviceList=====', that.deviceList)
                    resolve(res.data.result)
                  }
                },
                fail(error) {
                  reject(error)
                },
              })
            } else {
              reject('登录失败！' + res.errMsg)
            }
          },
        })
      })
    },
  },
})
