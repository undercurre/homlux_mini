/* eslint-disable @typescript-eslint/no-var-requires */
import app from '../../../../common/app'
let timer, timer2 //定时查询
import paths from '../../../../utils/paths'
import { getDeviceSn, getDeviceSn8 } from '../../../../common/js/device'
import { requestService } from '../../../../utils/requestService'
import { getReqId, getStamp } from 'm-utilsdk/index'
import { isSupportPlugin } from '../../../../utils/pluginFilter'
import { baseImgApi } from '../../../../common/js/api.js'
import { failTextData, friendDeviceFailTextData } from '../../../addDevice/pages/assets/js/errorCode'
const dialogCommonData = require('../../../../common/mixins/dialog-common-data.js')
import Dialog from '../../../../../miniprogram_npm/m-ui/mx-dialog/dialog'
const brandStyle = require('../../../assets/js/brand.js')
Page({
  behaviors: [dialogCommonData],
  /**
   * 页面的初始数据
   */
  data: {
    baseImgUrl: baseImgApi.url,
    device: {},
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    time: 70, //轮询时间
    masterDevices: [], //当前家庭主设备信息
    dialogStyle: brandStyle.brandConfig.dialogStyle, //弹窗样式
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('待配网设备信息', JSON.parse(options.device))
    this.setData({
      device: JSON.parse(options.device),
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.goNetwork()
  },
  clearTime() {
    clearInterval(timer)
    clearInterval(timer2)
    this.setData({
      time: 0,
    })
  },

  //发送给设备配网指令
  goNetwork() {
    let masterDevices = wx.getStorageSync('masterDevices')
    this.setData({
      masterDevices: masterDevices,
      time: 70,
    })
    timer = setInterval(() => {
      this.getNetworkResult()
    }, 3000)
    timer2 = setInterval(() => {
      if (this.data.time >= 0) {
        this.setData({
          time: this.data.time - 1,
        })
      }
    }, 1000)
  },

  //获取设备配网结果
  getNetworkResult() {
    if (this.data.time <= 0) {
      this.setData({
        isSureDialog: false,
      })
      let showDevice = this.data.device
      showDevice.result = failTextData['common']['errorCode']
      showDevice.nextTitle = failTextData['common']['nextTitle'].replace('XX', showDevice.deviceName)
      showDevice.reason = ['联网失败，请尝试扫码等其他添加方式']
      //跳转去配网失败页
      wx.reLaunch({
        url: paths.friendDeviceNetWorkFail + `?device=${JSON.stringify(showDevice)}`,
      })
    } else {
      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService.request('friendNetworkResult', reqData).then(async (resp) => {
        console.log('主设备给朋友设备配网结果', resp.data.data)
        if (!resp.data.data) {
          return
        }
        let isFound = false
        let find = () => {
          for (let i = 0; i < resp.data.data.length; i++) {
            for (let j = 0; j < resp.data.data[i]['friends'].length; j++) {
              if (resp.data.data[i]['friends'][j]['mac'] == this.data.device.mac) {
                isFound = true
                let { mac, modelNumber, sn, result, randomCode, useRandom } = resp.data.data[i]['friends'][j]
                let device = {
                  ssid: this.data.device.ssid,
                  signal: this.data.device.signal,
                  mac: mac,
                  modelNumber: modelNumber,
                  sn: sn,
                  result: result,
                  randomCode: randomCode,
                  useRandom: useRandom,
                  deviceImg: this.data.device.deviceImg,
                  deviceName: this.data.device.deviceName,
                  category: this.data.device.category,
                  masterApplianceCode: this.data.device.masterApplianceCode,
                  sn8: getDeviceSn8(getDeviceSn(sn)),
                  isSupport: true,
                }
                device.isSupport = isSupportPlugin('0x' + device.category, device.sn8, device.modelNumber, '0') //判断小程序里是否支持绑定设备
                this.setData({
                  device: device,
                })
                return
              }
            }
          }
        }
        find()
        if (isFound) {
          this.setData({
            isSureDialog: false,
          })
          if (!this.data.device.isSupport) {
            this.clearTime()
            Dialog.confirm({
              title: '温馨提示',
              message: '该设备仅支持在美的美居App添加',
              confirmButtonText: '我知道了',
              confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
              cancelButtonColor: this.data.dialogStyle.cancelButtonColor,
              showCancelButton: false,
            }).then((res) => {
              if (res.action == 'confirm') {
                wx.reLaunch({
                  url: paths.index,
                })
              }
            })
            // wx.showModal({
            //   title: '温馨提示',
            //   content: '该设备仅支持在美的美居App添加',
            //   showCancel: false,
            //   confirmText: '我知道了',
            //   success(res) {
            //     if (res.confirm) {
            //       wx.reLaunch({
            //         url: paths.index,
            //       })
            //     }
            //   },
            // })
            return
          }
          if (this.data.device.result == 0) {
            this.clearTime()
            let { deviceName, deviceImg, mac, category, sn8, sn, result } = this.data.device
            let addDeviceInfo = {
              deviceName: deviceName,
              deviceImg: deviceImg,
              mac: mac,
              type: category,
              sn8: sn8,
              blueVersion: '',
              mode: '',
              sn: sn,
              bindType: '',
              moduleVersion: '',
              isCreateFamily: app.globalData.homeRoleId == '1001' || app.globalData.homeRoleId == '1002', //当前用户是否是当前家庭的创建者
              isTwice: 0,
              result: result,
              applianceCode: '',
            }
            let modeResult = await this.getMode()
            console.log('获取设备配网指引结果', modeResult)
            if (modeResult.data.code == 0 && modeResult.data.data.mainConnectinfoList.length != 0) {
              addDeviceInfo.mode = modeResult.data.data.mainConnectinfoList[0].mode
              let moduleType = this.getModuleType(addDeviceInfo.mode)
              addDeviceInfo.bindType = this.mode2bindType(addDeviceInfo.mode, moduleType)
            }
            let bindResult = await this.bindDeviceToHome(this.data.device, addDeviceInfo.bindType)
            console.log('绑定设备结果', bindResult)
            if (bindResult.data.code == 0) {
              addDeviceInfo.applianceCode = bindResult.data.data.applianceCode
              app.addDeviceInfo = addDeviceInfo
              //跳转去配网成功页
              wx.reLaunch({
                url: paths.addSuccess,
              })
            }
          } else if (this.data.device.result == 1) {
            let showDevice = this.data.device
            showDevice.result = '7001'
            showDevice.nextTitle = friendDeviceFailTextData['7001']['nextTitle'].replace('XX', showDevice.deviceName)
            showDevice.reason = [
              friendDeviceFailTextData['7001']['guideDesc'][0]
                .replace('XX', showDevice.deviceName)
                .replace('YY', this.data.masterDevices[0]['name']),
            ]
            //跳转去配网失败页
            wx.reLaunch({
              url: paths.friendDeviceNetWorkFail + `?device=${JSON.stringify(showDevice)}`,
            })
          } else if (this.data.device.result == 2) {
            let showDevice = this.data.device
            showDevice.result = '7002'
            showDevice.nextTitle = friendDeviceFailTextData['7002']['nextTitle']
            showDevice.reason = friendDeviceFailTextData['7002']['guideDesc']
            //跳转去配网失败页
            wx.reLaunch({
              url: paths.friendDeviceNetWorkFail + `?device=${JSON.stringify(showDevice)}`,
            })
          }
        }
      })
    }
  },

  //取消配网
  cancel() {
    const btns = [
      {
        btnText: '放弃',
        flag: 'quit',
      },
      {
        btnText: '再等等',
        flag: 'cancel',
      },
    ]
    this.setDialogMixinsData(true, '要放弃为设备配网吗?', '未联网成功的设备还不能用小程序进行控制哦~', false, btns)
  },

  //取消配网弹窗操作
  makeSure(e) {
    this.setData({
      isSureDialog: false,
    })
    if (e.detail.flag == 'quit') {
      this.clearTime()
      wx.reLaunch({
        url: paths.index,
      })
    }
  },

  getModuleType(mode) {
    if (mode == 3 || mode == '003') return '1'
    if (mode == 5 || mode == '005') return '0'
  },

  mode2bindType(mode, moduleType) {
    //moduleType 0:ble 1:combo
    if (mode == 0) {
      return 0 //配网
    }
    if (mode == 3) {
      return 2 //配网
    }
    if (mode == 5) {
      return moduleType ? 3 : 1
    }
    if (mode == 20) {
      return 3 //combo 蓝牙
    }
    if (mode == 21) {
      return 2 //遥控器 后配网
    }
  },

  //绑定设备
  bindDeviceToHome(device, bindType) {
    let reqData = {
      applianceName: device.deviceName,
      homegroupId: app.globalData.currentHomeGroupId,
      sn: device.sn,
      applianceType: '0x' + device.category,
      btMac: device.mac.replace(/:/g, ''),
      reqId: getReqId(),
      stamp: getStamp(),
      bindType: bindType != '' ? bindType : 0, //绑定方式，0是AP配网，1是单蓝牙模组的蓝牙绑定, 2是combo的蓝牙配网,3是combo模组的蓝牙绑定, 不传默认都是AP配网
    }
    return new Promise((reslove) => {
      requestService
        .request('bindDeviceToHome', reqData)
        .then((resp) => {
          console.log('绑定设备成功', resp.data)
          reslove(resp)
        })
        .catch((error) => {
          console.log('绑定设备失败', error)
          reslove(error)
        })
    })
  },

  //获取设备mode配网方式
  getMode() {
    let param = {
      ssid: this.data.device.ssid,
      category: this.data.device.category,
      code: this.data.device.sn8,
      queryType: 2,
      stamp: getStamp(),
      reqId: getReqId(),
    }
    return new Promise((resolve) => {
      requestService
        .request('multiNetworkGuide', param)
        .then((resp) => {
          console.log('获取设备配网指引成功', resp)
          resolve(resp)
        })
        .catch((error) => {
          console.log('获取设备配网指引失败', error)
          resolve(error)
        })
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.clearTime()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.clearTime()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},
})
