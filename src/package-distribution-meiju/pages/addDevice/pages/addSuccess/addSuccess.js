// addDevice//pages/addSuccess/addSuccess.js
const app = getApp() //获取应用实例
const addDeviceMixin = require('../assets/js/addDeviceMixin')
const netWordMixin = require('../../../assets/js/netWordMixin')
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
const log = require('../../../../utils/log')
import { requestService } from '../../../../utils/requestService'
import { getReqId, getStamp, cloudEncrypt, validateFun } from 'm-utilsdk/index'
import { showToast, getFullPageUrl } from '../../../../utils/util'
// import { service } from '../../../../pages/index/assets/js/service.js'
import { service } from '../../../assets/js/service.js'
import { burialPoint } from './assets/js/burialPoint'
import { isSupportPlugin, goToInvitePage } from '../../../../utils/pluginFilter'
import paths from '../../../../utils/paths'
import { service as services } from '../assets/js/service'
import { api } from '../../../../api'
import { setPluginDeviceInfo } from '../../../../track/pluginTrack.js'
import { baseImgApi, imgBaseUrl } from '../../../../api.js'
import { imgesList } from '../../../assets/js/shareImg.js'
import { info } from '../../../../utils/log'
import Dialog from '../../../../miniprogram_npm/m-ui/mx-dialog/dialog'

const brandStyle = require('../../../assets/js/brand.js')
const imgUrl = imgBaseUrl.url + '/shareImg/' + app.globalData.brand
Page({
  behaviors: [addDeviceMixin, netWordMixin, getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    familyInfo: {},
    deviceName: '', // 输入框的设备名
    titleDeviceName: '',
    bindType: Number, //绑定方式，0是AP配网，1是单蓝牙模组的蓝牙绑定, 2是combo的蓝牙配网,3是combo模组的蓝牙绑定, 不传默认都是AP配网
    showActionsheet: false,
    mode: Number,
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    homeList: [],
    currentRoomId: 0,
    dialog: {
      title: '请输入家庭名称',
      dialogShow: false,
      showOneButtonDialog: false,
      inputValue: '',
    },
    buttons: [
      {
        text: '取消',
      },
      {
        text: '确定',
      },
    ],
    oneButton: [
      {
        text: '确定',
      },
    ],
    isCreateFamily: false, //是否是当前家庭的创建者
    isIpx: app.globalData.isPx,
    inputNotice: '',
    baseImgUrl: baseImgApi.url,
    plainSn: '', //原始sn
    isgetFamilyInfoFail: false, //是否加载家庭信息出错c
    brand: '',
    successRight: imgUrl + imgesList['successRight'],
    changeClickFlagNew: false,
    deviceInfo: {}, // 当前设备信息
    combinedStatus: -1, // 0-失败，1-成功，2-取消
    masterName: '', //主设备名
    slaveName: '', // 辅设备名
    brandConfig: app.globalData.brandConfig[app.globalData.brand],
    ishowAddroom: false, //是否显示添加房间弹窗
    newRoomName: '', //房间弹窗-房间名称
    dialogStyle: app.globalData.brandConfig[app.globalData.brand].dialogStyle, //弹窗样式
    isFailStr: false, //输入房间名称是非法字符
    ishowFocus: false, //打开新建房间后，自动聚焦
    roomFlag: false, // 全空格标识符
  },
  /**
   * 不用于页面渲染的数据
   */
  currentHomeGroupId: '',

  close: function () {
    this.setData({
      showActionsheet: false,
    })
  },
  btnClick(e) {
    console.log(e)
    let groupId = e.detail.value
    if (groupId == 0) {
      //新增家庭
      this.setData({
        ['dialog.dialogShow']: true,
        ['dialog.title']: '请输入房间名称',
      })
    } else {
      this.getFamilyInfo(groupId)
    }
    this.close()
  },
  //确认输入dialog
  tapDialogButton(e) {
    this.setData({
      ['dialog.dialogShow']: false,
      ['dialog.showOneButtonDialog']: false,
    })
    if (e.detail.item.text === '取消') return
    console.log(e, this.data.dialog.inputValue)
    if (this.data.dialog.inputValue && this.data.dialog.title == '请输入设备名称') {
      this.setData({
        deviceName: this.data.dialog.inputValue,
      })
    }
    if (this.data.dialog.inputValue && this.data.dialog.title == '请输入家庭名称') {
      this.addHomegroup(this.data.dialog.inputValue)
    }
    if (this.data.dialog.inputValue && this.data.dialog.title == '请输入房间名称') {
      this.addRoom(this.data.dialog.inputValue)
    }
  },
  tapOneDialogButton() {
    this.setData({
      showOneButtonDialog: true,
    })
  },
  bindKeyInput: function (e) {
    this.setData({
      ['dialog.inputValue']: e.detail.value,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.globalData.ifBackFromSuccess = false
    getApp().onLoadCheckingLog()
    this.data.brand = app.globalData.brand
    this.setData({
      brand: this.data.brand,
    })
    // if (this.data.brand == 'meiju') {
    //   wx.setNavigationBarColor({
    //     frontColor: '#000000',
    //     backgroundColor: '#ffffff',
    //   })
    // } else if (this.data.brand == 'colmo') {
    //   wx.setNavigationBarColor({
    //     frontColor: '#ffffff',
    //     backgroundColor: '#1A1A1F',
    //   })
    // }
    this.getLoginStatus().then(() => {
      if (app.globalData.isLogon) {
        /**
         * 组合配网新增逻辑
         * 1、组合成功，显示组合后的设备数据
         * 2、组合失败，主设备绑定成功，显示主设备数据
         * 3、组合失败，辅设备绑定成功，显示辅设备数据
         * 4、组合失败，修改数据后再次进入，显示修改后的设备数据
         */
        if (app.addDeviceInfo.combinedDeviceFlag && app.combinedDeviceInfo[0].combinedStatus > -1) {
          if (options.deviceInfo) {
            // 需兼容特殊情况：组合失败但绑定成功，查看主设备/辅设备单品设备数据
            let temp = decodeURIComponent(options.deviceInfo)
            this.data.deviceInfo = JSON.parse(temp)
          } else {
            this.data.deviceInfo = app.combinedDeviceInfo[0]
          }
          this.logAddDivceInfo('添加设备参数', this.data.deviceInfo)
          console.log('---添加设备参数（组合）---', this.data.deviceInfo)
          let { combinedStatus, deviceName, type, sn8, sn, plainSn } = this.data.deviceInfo
          if (!combinedStatus) {
            // 主设备无该字段
            combinedStatus = app.combinedDeviceInfo[0].combinedStatus
          }
          const combinedDeviceName = app.combinedDeviceName
          const applianceCode = this.data.deviceInfo.cloudBackDeviceInfo
            ? this.data.deviceInfo.cloudBackDeviceInfo.applianceCode
            : this.data.deviceInfo.applianceCode
          this.setData({
            combinedStatus: combinedStatus,
            titleDeviceName: combinedStatus == 1 ? combinedDeviceName : deviceName, // 组合成功 或 组合失败但辅设备绑定成功
            masterName: app.addDeviceInfo.deviceName,
            slaveName: deviceName,
            deviceName: combinedStatus == 1 ? combinedDeviceName : deviceName,
            applianceCode: combinedStatus == 1 ? app.combinedDeviceCode : applianceCode,
            type: combinedStatus == 1 ? app.combinedDeviceType : type,
            sn8: sn8,
            blueVersion: 2,
            sn: sn,
            plainSn: plainSn,
            isCreateFamily: app.globalData.isCreateFamily,
          })
        } else {
          // 单品配网原逻辑
          this.data.deviceInfo = app.addDeviceInfo
          this.logAddDivceInfo('添加设备参数', this.data.deviceInfo)
          console.log('---添加设备参数---', this.data.deviceInfo)
          if (app.addDeviceInfo) {
            const {
              deviceName,
              mac,
              type,
              sn8,
              blueVersion,
              mode,
              sn,
              bindType,
              moduleVersion,
              isTwice,
              plainSn,
              lastBindName,
              applianceCode,
            } = app.addDeviceInfo
            this.setData({
              combinedStatus: -1,
              titleDeviceName: deviceName,
              deviceName: lastBindName || deviceName,
              btMac: mac,
              // sn: options.sn || '',
              type: type,
              sn8: sn8,
              blueVersion: blueVersion,
              sn: sn,
              bindType: bindType,
              mode: mode,
              isCreateFamily: app.globalData.isCreateFamily,
              plainSn: plainSn,
              applianceCode: applianceCode,
            })
            burialPoint.addSuccessView({
              pageName: mode == 0 || mode == 3 ? 'WiFi联网成功页' : '连接成功页',
              pageId: mode == 0 || mode == 3 ? 'page_WiFi_connect_success' : 'page_connect_success',
              deviceSessionId: app.globalData.deviceSessionId,
              sn: this.data.plainSn,
              sn8: sn8,
              type: type,
              moduleVersion: blueVersion || '',
              linkType: app.addDeviceInfo.linkType,
              isTwice: isTwice,
              wifi_version: moduleVersion || '',
            })
          }
        }
        this.currentHomeGroupId = app.globalData.currentHomeGroupId || ''
        // 兼容大屏设备扫码
        if (this.data.deviceInfo.cloudBackDeviceInfo && this.data.deviceInfo.cloudBackDeviceInfo.homegroupId) {
          this.currentHomeGroupId = this.data.deviceInfo.cloudBackDeviceInfo.homegroupId || ''
        }
        console.log('当前家庭id===', this.currentHomeGroupId)
        log.info('当前家庭id', this.currentHomeGroupId)
        if (app.addDeviceInfo.combinedDeviceFlag && app.combinedDeviceInfo[0].combinedStatus > -1) {
          // 组合成功的新设备取主设备的房间ID
          const roomId =
            app.combinedDeviceInfo[0].combinedStatus == 1
              ? app.globalData.currentRoomId
              : this.data.deviceInfo.cloudBackDeviceInfo.roomId || app.globalData.currentRoomId
          console.log('当前房间id---', roomId)
          this.getFamilyInfo(this.currentHomeGroupId, roomId)
        } else {
          console.log('当前房间id===', app.globalData.currentRoomId)
          this.getFamilyInfo(this.currentHomeGroupId)
        }
        this.getHomeList()
      } else {
        this.navToLogin()
      }
    })
  },
  getLoginStatus() {
    return app
      .checkGlobalExpiration()
      .then(() => {
        this.setData({
          isLogon: app.globalData.isLogon,
        })
      })
      .catch(() => {
        app.globalData.isLogon = false
        this.setData({
          isLogin: app.globalData.isLogon,
        })
      })
  },
  navToLogin() {
    app.globalData.isLogon = false
    this.setData({
      isLogin: app.globalData.isLogon,
    })
    wx.navigateTo({
      url: paths.login,
    })
  },
  //点击重新获取房间信息
  retryGetFamilyInfo() {
    this.getFamilyInfo(this.currentHomeGroupId)
  },
  getFamilyInfo(groupId, curRoomId) {
    let reqData = {
      homegroupId: groupId || '',
      reqId: getReqId(),
      stamp: getStamp(),
    }
    this.setData({
      isgetFamilyInfoFail: false,
    })
    let { currentHomeGroupId, curFamilyInfo, currentRoomId, currentRoomName } = app.globalData
    if (groupId == currentHomeGroupId && groupId == curFamilyInfo.homegroupId) {
      // 8.24 update 解决第1次保存时groupId更新了curFamilyInfo没更新导致家庭显示错误的问题
      console.log('返回默认家庭家庭信息================', curFamilyInfo)
      this.currentHomeGroupId = groupId
      this.data.homeList.forEach((item) => {
        //重置选中标志
        item.type = item.value == groupId ? 'seleted' : 'normal'
      })
      this.setData({
        homeList: this.data.homeList,
        familyInfo: curFamilyInfo,
        currentRoomId: currentRoomId,
        currentRoomName: currentRoomName,
      })
      return
    }
    requestService
      .request('applianceList', reqData)
      .then((resp) => {
        wx.hideLoading()
        console.log('默认家庭信息', resp.data.data.homeList[0])
        log.info('获取默认家庭信息成功')
        // this.checkFamilyPermission(resp.data.data.homeList[0])
        this.currentHomeGroupId = groupId
        this.data.homeList.forEach((item) => {
          //重置选中标志
          item.type = item.value == groupId ? 'seleted' : 'normal'
        })
        this.setData({
          homeList: this.data.homeList,
          familyInfo: resp.data.data.homeList[0],
        })
        if (curRoomId) {
          this.setData({
            currentRoomId: curRoomId,
          })
        } else {
          this.setData({
            currentRoomId: resp.data.data.homeList[0].roomList[0].roomId,
            currentRoomName: resp.data.data.homeList[0].roomList[0].name,
          })
        }
        getApp().setMethodCheckingLog('getFamilyInfo')
      })
      .catch((error) => {
        this.setData({
          isgetFamilyInfoFail: true,
          currentRoomId: null,
        })
        console.log('[获取家庭信息异常]', error)
        getApp().setMethodFailedCheckingLog('getFamilyInfo', `获取家庭信息异常。error=${JSON.stringify(error)}`)
      })
  },
  getHomeList() {
    let { homeGrounpList } = app.globalData
    if (homeGrounpList.length) {
      let homeList = []
      homeGrounpList.forEach((item) => {
        if (item.roleId == '1001' || item.roleId == '1002') {
          //过滤 留下自己创建的家庭
          homeList.push({
            text: item.name,
            value: item.homegroupId,
            type: item.homegroupId == this.currentHomeGroupId ? 'seleted' : 'normal',
          })
        }
      })
      this.setData({
        homeList: homeList,
      })
      console.info('获取当前家庭列表===', this.data.homeList)
    } else {
      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService.request('homeList', reqData).then((resp) => {
        // console.log('家庭列表0', resp.data.data.homeList)
        let homeList = []
        resp.data.data.homeList.forEach((item) => {
          if (item.roleId == '1001' || item.roleId == '1002') {
            //过滤 留下自己创建的家庭
            homeList.push({
              text: item.name,
              value: item.homegroupId,
              type: item.homegroupId == this.currentHomeGroupId ? 'seleted' : 'normal',
            })
          }
        })
        // homeList.push({
        //   text: '新增家庭',
        //   type: 'warn',
        //   value: 0
        // })
        // console.log('家庭列表0++++++++', homeList, this.data.isCreateFamily)
        this.setData({
          homeList: homeList,
        })
        console.info('查询当前家庭列表===', this.data.homeList)
      })
    }
  },
  //切换所属家庭
  switchFamily() {
    if (!app.globalData.isCreateFamily) {
      //绑定的不是自己创建的家庭 没权限切换家庭
      console.warn('绑定的不是自己创建的家庭 没权限切换家庭')
      return
    }
    if (this.data.homeList.length <= 1) {
      //家庭数小于1
      console.warn('家庭数小于1')
      return
    }
    this.setData({
      showActionsheet: true,
    })
  },
  opendDialogInput() {
    this.setData({
      ['dialog.title']: '请输入房间名称',
      ['dialog.dialogShow']: true,
    })
  },
  //点击新增家庭
  clickAddHomegroup() {
    this.setData({
      ['dialog.dialogShow']: true,
      ['dialog.title']: '请输入家庭名称',
    })
  },
  addHomegroup(homeName) {
    let resq = {
      name: homeName,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    wx.showLoading({
      icon: 'none',
    })
    requestService.request('addHomegroup', resq).then((resp) => {
      console.log('创建家庭成功 +++', resp.data.data.homegroupId)
      app.globalData.currentHomeGroupId = resp.data.data.homegroupId
      this.currentHomeGroupId = resp.data.data.homegroupId
      this.getFamilyInfo(this.currentHomeGroupId)
    })
  },
  addRoom(roomName) {
    let resq = {
      homegroupId: this.currentHomeGroupId,
      name: roomName,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    wx.showLoading({
      icon: 'none',
    })
    requestService.request('addRoom', resq).then((resp) => {
      console.log('创建房间成功', resp.data.data)
      this.getFamilyInfo(this.currentHomeGroupId, resp.data.data.id)
    })
  },
  switchRoom(e) {
    let ds = e.currentTarget.dataset
    let roomId = ds.id
    let roomName = ds.roomName
    console.log('switch room room name', roomName)
    this.setData({
      currentRoomId: roomId,
      currentRoomName: roomName,
    })
  },
  setDeviceName() {
    // this.data.deviceName = e.detail.value
    this.setData({
      ['dialog.dialogShow']: true,
      ['dialog.title']: '请输入设备名称',
    })
  },
  changeDeviceName(e) {
    this.setData({
      deviceName: e.detail.value,
    })
  },
  antiNameClicked(e) {
    console.log(e)
    console.log('e.detail.value:', e.detail.value)
    //设备名称不做特殊符号以及表情限制
    this.deviceNameCheck(e.detail.value)
  },
  deviceNameCheck(value) {
    let name = value.replace(/\s/g, '')
    if (name == '') {
      this.setData({
        inputNotice: '设备名称不能为空',
      })
      getApp().setMethodFailedCheckingLog('deviceNameCheck', '设备名称不能为空')
      return false
    }
    // let reg = /^(\p{Unified_Ideograph}|[a-zA-Z\d ])*$/u
    // if (!reg.test(value)) {
    //   this.setData({
    //     inputNotice: '设备名称不支持标点符号及表情',
    //   })
    //   getApp().setMethodFailedCheckingLog('deviceNameCheck', '设备名称不支持标点符号及表情')
    //   return false
    // }
    this.setData({
      inputNotice: '',
    })
    return true
  },
  /**
   * 点击[保存]
   * @update 8B combined device
   * @author lny
   */
  async changeBindDviceInfo() {
    const this_ = this
    let clickFlag = false
    if (this.data.changeClickFlagNew) return
    this.data.changeClickFlagNew = true
    let str = this.data.deviceName
    console.info('输入框 deviceName===', str)
    if (this.data.deviceName.length == 20) {
      str = this.data.deviceName[19]
      console.log('最后一位:', this.checkDeviceName(this.data.deviceName))
      console.log('倒数第二位:', this.checkDeviceName(this.data.deviceName[18]))
    }

    console.log('进入保存')
    if (!this.deviceNameCheck(this.data.deviceName)) {
      //方法内加日志
      this.data.changeClickFlagNew = false
      return
    }
    console.log('通过方法内加日志')
    if (!this.currentHomeGroupId || !this.data.currentRoomId) {
      this.data.changeClickFlagNew = false
      showToast('请选择所在房间后再试')
      return
    }
    let homeName = this.data.familyInfo.name
    getApp().setMethodCheckingLog('changeBindDviceInfo')
    let { mode, type, sn, sn8, mac, applianceCode, deviceImg } = app.addDeviceInfo
    let btMac = mac ? mac.replace(/:/g, '').toLocaleUpperCase() : ''
    let applianceType = type.includes('0x') ? type : '0x' + type
    if (mode == 20) {
      //遙控設備 修改綁定信息
      let reqData = {
        applianceName: this.data.deviceName,
        homegroupId: this.currentHomeGroupId,
        roomId: this.data.currentRoomId,
        sn: sn,
        applianceType: applianceType,
        btMac: btMac,
        modelNumber: '',
      }
      let bindRemoteDeviceResp = null
      try {
        bindRemoteDeviceResp = await services.bindRemoteDevice(reqData)
        Object.assign(bindRemoteDeviceResp, {
          btMac: mac.replace(/:/g, '').toLocaleUpperCase(),
          sn8: sn8,
          sn: sn,
          name: this.data.deviceName,
          deviceImg: deviceImg,
        })
        console.log('遥控设备绑定结果', bindRemoteDeviceResp)
        let remoteDeviceList = wx.getStorageSync('remoteDeviceList') ? wx.getStorageSync('remoteDeviceList') : []
        remoteDeviceList.push(bindRemoteDeviceResp)
        wx.setStorageSync('remoteDeviceList', remoteDeviceList)
        service.homegroupDefaultSetService(this.currentHomeGroupId) // 设置默认家庭
        app.globalData.currentHomeGroupId = this.currentHomeGroupId
        app.globalData.currentRoomId = this.data.currentRoomId
        wx.closeBLEConnection({
          //断开连接
          deviceId: app.addDeviceInfo.deviceId,
        })
        setPluginDeviceInfo(bindRemoteDeviceResp)
        //url传参改为全局变量传参
        app.addDeviceInfo.cloudBackDeviceInfo = bindRemoteDeviceResp
        goToInvitePage(homeName, bindRemoteDeviceResp, '/pages/index/index', true, () => {})
        getApp().setMethodCheckingLog('changeBindDviceInfo')
      } catch (error) {
        showToast('网络不佳，请检查网络')
        console.log('遥控设备绑定失败', error)
        getApp().setMethodFailedCheckingLog('changeBindDviceInfo', `遥控设备绑定失败。error=${JSON.stringify(error)}`)
      }
      return
    }
    let nowNetStuts = false
    await this.nowNetType()
      .then((networkType) => {
        if (networkType == 'none') {
          this_.data.changeClickFlagNew = false
          nowNetStuts = true
          showToast('网络不佳，请检查网络后重试')
        }
      })
      .catch((err) => {
        this_.data.changeClickFlagNew = false
        showToast('网络不佳，请检查网络后重试')
      })
    if (nowNetStuts) {
      return
    }
    // 组合配网新增逻辑
    let params = {
      reqId: getReqId(),
      stamp: getStamp(),
      applianceCode: this.data.applianceCode,
      homegroupId: this.currentHomeGroupId,
      roomId: this.data.currentRoomId,
      applianceName: this.data.deviceName,
    }
    console.log('homeModify reqData===', params)
    log.info('修改绑定设备信息参数', params)
    app.showLoading('加载中')
    setTimeout(() => {
      app.closeLoading()
      if (clickFlag && getFullPageUrl().includes('addDevice/pages/addSuccess/addSuccess')) {
        showToast('网络不佳，请检查网络后重试')
      }
    }, 5000)
    clickFlag = true
    requestService
      .request('homeModify', params, 'POST', '', 3000)
      .then((resp) => {
        console.log('mode:', app.addDeviceInfo.mode)
        console.log('homeModify-----绑定设备结果原始', resp.data.data)
        if (resp.data.code == 0) {
          service.homegroupDefaultSetService(this.currentHomeGroupId) //设置默认家庭
          app.globalData.currentHomeGroupId = this.currentHomeGroupId
          resp.data.data.homegroupId = this.currentHomeGroupId
          if (!resp.data.data.roomName) {
            resp.data.data.roomName = this.data.currentRoomName //补充房间名
          }
          app.globalData.currentRoomName = resp.data.data.roomName
          resp.data.data.sn8 = this.data.sn8 //补充sn8
          if (resp.data.data.sn && resp.data.data.sn.length <= 32) {
            //未加密转加密sn
            let key = app.globalData.userData.key
            let appKey = api.appKey
            let encodeSn = cloudEncrypt(resp.data.data.sn, key, appKey)
            resp.data.data.sn = encodeSn
            console.log('前端 加密后的sn===', resp.data.data.sn)
          }
          let deviceInfo = JSON.stringify(resp.data.data)
          let type = resp.data.data.type || this.data.deviceInfo.type || app.addDeviceInfo.type
          // type做兼容，以便查询isSupportPlugin
          type = type.includes('0x') ? type : '0x' + type
          let sn8 = app.addDeviceInfo.sn8
          let mode = app.addDeviceInfo.mode
          let A0 = resp.data.data.modelNumber ? resp.data.data.modelNumber : ''
          burialPoint.clickSave({
            pageName: mode == 0 || mode == 3 ? 'WiFi联网成功页' : '连接成功页',
            pageId: mode == 0 || mode == 3 ? 'page_WiFi_connect_success' : 'page_conect_success',
            deviceSessionId: app.globalData.deviceSessionId,
            sn: this.data.plainSn,
            sn8: this.data.sn8,
            type: this.data.type,
            moduleVersion: this.data.blueVersion || '',
            linkType: app.addDeviceInfo.linkType,
            applianceCode: resp.data.data.applianceCode,
            deviceName: resp.data.data.name,
            family: this.currentHomeGroupId,
            room: this.data.currentRoomId,
            isTwice: app.addDeviceInfo.isTwice,
            wifi_version: app.addDeviceInfo.moduleVersion || '',
          })
          console.log('homeModify---绑定设备结果', resp.data.data)
          log.info('change bind device info result', resp.data.data)
          if (this.data.combinedStatus > -1 && app.combinedDeviceInfo[0].sn) {
            if (app.combinedDeviceInfo[0].sn == resp.data.data.sn) {
              app.combinedDeviceInfo[0].cloudBackDeviceInfo = resp.data.data
              app.combinedDeviceInfo[0].cloudBackDeviceInfo.roomId = this.data.currentRoomId
            } else {
              app.globalData.currentRoomId = this.data.currentRoomId
              app.addDeviceInfo.cloudBackDeviceInfo = resp.data.data
              app.addDeviceInfo.cloudBackDeviceInfo.roomId = this.data.currentRoomId
            }
          } else {
            app.globalData.currentRoomId = this.data.currentRoomId
            app.addDeviceInfo.cloudBackDeviceInfo = resp.data.data
            app.addDeviceInfo.cloudBackDeviceInfo.roomId = this.data.currentRoomId
          }
          const curDeviceItem = this.getCurDeviceStr(resp.data.data)
          if (app.addDeviceInfo.mode == 0) {
            //ap
            try {
              let { ssid } = app.addDeviceInfo
              app.globalData.curAddedApDeviceList.push(curDeviceItem)
            } catch (error) {
              console.log(error)
              this_.data.changeClickFlagNew = false
            }
            this.getApplianceAuthType(resp.data.data.applianceCode).then((respData) => {
              clickFlag = false
              app.closeLoading()
              console.log('查询设备确权情况', respData)
              // console.log('isSupportPlugin====', type, sn8, A0, '0')
              log.info('查询设备确权情况', respData.data.data)
              // 组合配网新增跳转
              console.log('----mode 0 combinedStatus = ' + this.data.combinedStatus)
              if (this.data.combinedStatus > -1) {
                if (this.data.combinedStatus == 1) {
                  // 组合成功跳转插件页
                  goToInvitePage(
                    homeName,
                    app.addDeviceInfo.cloudBackDeviceInfo,
                    '/pages/index/index',
                    true,
                    app.addDeviceInfo.status,
                  )
                } else {
                  // 组合失败返回上一页
                  app.globalData.ifBackFromSuccess = true
                  wx.navigateBack({
                    delta: 1,
                  })
                }
                this_.data.changeClickFlagNew = false
              } else {
                this_.data.changeClickFlagNew = false

                let { status } = respData.data.data
                if (status == '1' || status == '2') {
                  wx.reLaunch({
                    url: '/package-distribution-meiju/pages/addDevice/pages/afterCheck/afterCheck?backTo=/pages/index/index',
                  })
                } else {
                  goToInvitePage(homeName, app.addDeviceInfo.cloudBackDeviceInfo, '/pages/index/index', true, status)
                }
              }
            })
          }
          if (app.addDeviceInfo.mode == 3) {
            try {
              let { ssid } = app.addDeviceInfo
              app.globalData.curAddedApDeviceList.push(curDeviceItem)
            } catch (error) {
              console.log(error)
              this_.data.changeClickFlagNew = false
            }
            console.log('----mode 3 combinedStatus = ' + this.data.combinedStatus)
            this.getApplianceAuthType(resp.data.data.applianceCode).then((respData) => {
              log.info('是否有对应插件参数', type, sn8, A0, '0')
              // 组合配网新增跳转
              if (this.data.combinedStatus > -1) {
                if (this.data.combinedStatus == 1) {
                  // 组合成功跳转插件页
                  goToInvitePage(
                    homeName,
                    app.addDeviceInfo.cloudBackDeviceInfo,
                    '/pages/index/index',
                    true,
                    app.addDeviceInfo.status,
                  )
                } else {
                  // 组合失败返回上一页
                  app.globalData.ifBackFromSuccess = true
                  wx.navigateBack({
                    delta: 1,
                  })
                }
                this_.data.changeClickFlagNew = false
              } else {
                this_.data.changeClickFlagNew = false
                let { status } = respData.data.data
                if (status == '1' || status == '2') {
                  wx.reLaunch({
                    url: '/package-distribution-meiju/pages/addDevice/pages/afterCheck/afterCheck?backTo=/pages/index/index',
                  })
                } else {
                  goToInvitePage(homeName, app.addDeviceInfo.cloudBackDeviceInfo, '/pages/index/index', true, status)
                }
              }
            })
          }
          if (app.addDeviceInfo.mode == 5) {
            goToInvitePage(homeName, app.addDeviceInfo.cloudBackDeviceInfo, '/pages/index/index', true)
            getApp().setMethodCheckingLog('changeBindDviceInfo')
          }
          if (mode == 20) {
            app.addDeviceInfo.deviceName = this.data.deviceName
            app.addDeviceInfo.cloudBackDeviceInfo.roomName = this.data.currentRoomName
            wx.navigateTo({
              url: paths.inputWifiInfo,
              complete() {
                this_.data.changeClickFlagNew = false
              },
            })
            getApp().setMethodCheckingLog('changeBindDviceInfo')
          }
          if (mode == 30) {
            // app.addDeviceInfo={
            //   type:'CA',
            //   sn8:'001A0481',
            //   mode:3
            // }
            // addDeviceSDK.goToAddDevice({
            //   type:'CA',
            //   sn8:'001A0481'
            // })
            app.globalData.currentRoomId = this.data.currentRoomId
            app.addDeviceInfo.mode = 31 //masmart 直连后去配网
            app.addDeviceInfo.linkType = this.getLinkType(app.addDeviceInfo.mode)
            app.addDeviceInfo.deviceName = this.data.deviceName
            app.addDeviceInfo.cloudBackDeviceInfo.roomName = this.data.currentRoomName
            app.addDeviceInfo.cloudBackDeviceInfo.bindType = 3
            wx.navigateTo({
              url: paths.inputWifiInfo,
              complete() {
                this_.data.changeClickFlagNew = false
              },
            })
            getApp().setMethodCheckingLog('changeBindDviceInfo')
          }
          if (mode == 100) {
            //触屏配网
            goToInvitePage(homeName, app.addDeviceInfo.cloudBackDeviceInfo, '/pages/index/index', true)
            getApp().setMethodCheckingLog('changeBindDviceInfo')
          }
          if (mode == 8) {
            //NB-Iot配网
            goToInvitePage(homeName, app.addDeviceInfo.cloudBackDeviceInfo, '/pages/index/index', true)
            getApp().setMethodCheckingLog('changeBindDviceInfo')
          }
          //网关网线配网
          if (mode == 7) {
            // if (!isSupportPlugin(type, sn8, A0, '0')) {
            //   //不支持
            //   getApp().setMethodCheckingLog('changeBindDviceInfo')
            //   wx.reLaunch({
            //     url:
            //       '/pages/unSupportDevice/unSupportDevice?backTo=/pages/index/index&deviceInfo=' +
            //       encodeURIComponent(deviceInfo),
            //   })
            //   return
            // }
            goToInvitePage(homeName, app.addDeviceInfo.cloudBackDeviceInfo, '/pages/index/index', true)
            getApp().setMethodCheckingLog('changeBindDviceInfo')
          }
        }
        // this_.data.changeClickFlagNew = false
        console.log(' ----- save clicked ----- ')
      })
      .catch((error) => {
        // showToast('网络不佳，请检查网络')
        this_.data.changeClickFlagNew = false
        console.log('changeClickFLag:', this_.data.changeClickFlagNew)
        console.error('修改设备绑定信息失败', error)
        getApp().setMethodFailedCheckingLog(
          'changeBindDviceInfo',
          `修改设备绑定信息失败。error=${JSON.stringify(error)}`,
        )
        if (error.errno == '5') {
          clickFlag = !clickFlag
          //errno = 5 接口超时
          showToast('网络不佳，请检查网络')
        }
      })
  },

  checkDeviceName(str) {
    let checkRes =
      /[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF][\u200D|\uFE0F]|[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[0-9|*|#]\uFE0F\u20E3|[0-9|#]\u20E3|[\u203C-\u3299]\uFE0F\u200D|[\u203C-\u3299]\uFE0F|[\u2122-\u2B55]|\u303D|[A9|AE]\u3030|\uA9|\uAE|\u3030/gi.test(
        str,
      )
    return checkRes
  },

  // getApplianceAuthType(applianceCode) {
  //   let reqData = {
  //     applianceCode: applianceCode,
  //     reqId: getReqId(),
  //     stamp: getStamp(),
  //   }
  //   log.info('查询设备确权情况入参', reqData)
  //   console.log('查询设备确权情况入参', reqData)
  //   return new Promise((resolve, reject) => {
  //     requestService
  //       .request('getApplianceAuthType', reqData)
  //       .then((resp) => {
  //         getApp().setMethodCheckingLog('getApplianceAuthType')
  //         resolve(resp)
  //       })
  //       .catch((error) => {
  //         getApp().setMethodFailedCheckingLog(
  //           'getApplianceAuthType',
  //           `获取设备确权状态异常。error=${JSON.stringify(error)}`
  //         )
  //         reject(error)
  //       })
  //   })
  // },
  getCurDeviceStr(item) {
    let { ssid } = app.addDeviceInfo
    const applianceCode = item.applianceCode
    return {
      ssid: ssid,
      applianceCode: applianceCode,
    }
  },
  /**
   * 返回上一页
   */
  backPre() {
    wx.navigateBack({
      delta: 1,
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    setTimeout(() => {
      this.data.changeClickFlagNew = false
    }, 2000)
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    app.closeLoading()
    getApp().onUnloadCheckingLog()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  async onPullDownRefresh() {
    console.log('下拉刷新==========')
    this.setData({
      familyInfo: {},
    })
    try {
      await this.getFamilyInfo(this.currentHomeGroupId)
    } catch (error) {
      console.log(error)
    }
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  closePop() {
    this.setData({
      showActionsheet: false,
    })
  },

  // 2.38需求新增房间功能
  increaseRoom() {
    console.log('this.data.familyInfo.roomList.length:', this.data.familyInfo.roomList.length)
    if (this.data.familyInfo.roomList.length >= 20) {
      showToast('无法创建，房间数量已达到上限')
      return
    }
    this.setData({
      ishowAddroom: true,
      newRoomName: '',
    })
    burialPoint.increaseRoomView({
      pageName: '新建房间弹窗',
      pageId: 'new_room_pop_up',
      deviceSessionId: app.globalData.deviceSessionId,
      sn: this.data.plainSn,
      sn8: app.addDeviceInfo.sn8,
      type: app.addDeviceInfo.type,
      moduleVersion: this.data.blueVersion || '',
      linkType: app.addDeviceInfo.linkType,
      wifi_version: app.addDeviceInfo.moduleVersion || '',
    })
    wx.nextTick(() => {
      setTimeout(() => {
        this.setData({
          ishowFocus: true,
        })
      }, 300)
    })
  },
  //输入房间名称
  bindKeyaddInput(e) {
    const errorMsg = this.validtaFunc(e.detail.value || '')
    let flag = false
    if (e.detail.value.match(/^[ ]*$/)) {
      flag = true
    }
    this.setData({
      newRoomName: e.detail.value,
      roomFlag: flag,
    })

    if (errorMsg || flag) {
      if (e.detail.keyCode != '8') {
        // keyCode=8 是删除按钮
        if (flag) {
          return
        }
        showToast(errorMsg)
      }
      this.setData({
        isFailStr: true,
      })
    } else {
      this.setData({
        isFailStr: false,
      })
    }
  },
  //房间弹窗确定按钮
  confirmAddRoom() {
    let flag = false
    if (this.data.newRoomName.match(/^[ ]*$/)) {
      flag = true
    }
    if (this.data.newRoomName.length < 1 || flag) {
      return
    }

    const errorMsg = this.validtaFunc(this.data.newRoomName || '')

    if (errorMsg) {
      console.log('errorMsg:', errorMsg)
      showToast(errorMsg)
      return
    }

    if (this.data.isFailStr) {
      return
    }
    burialPoint.confirmAddRoom({
      pageName: '新建房间弹窗',
      pageId: 'new_room_pop_up',
      deviceSessionId: app.globalData.deviceSessionId,
      sn: this.data.plainSn,
      sn8: app.addDeviceInfo.sn8,
      type: app.addDeviceInfo.type,
      moduleVersion: this.data.blueVersion || '',
      linkType: app.addDeviceInfo.linkType,
      wifi_version: app.addDeviceInfo.moduleVersion || '',
    })
    this.setData({
      ishowAddroom: false,
    })
    this.increaseRoomInterface(this.data.newRoomName)
  },

  // cancelAddRoom,取消新增房间
  cancelAddRoom() {
    this.setData({
      ishowAddroom: false,
    })
    //埋点
    burialPoint.cancelAddRoom({
      pageName: '新建房间弹窗',
      pageId: 'new_room_pop_up',
      deviceSessionId: app.globalData.deviceSessionId,
      sn: this.data.plainSn,
      sn8: app.addDeviceInfo.sn8,
      type: app.addDeviceInfo.type,
      moduleVersion: this.data.blueVersion || '',
      linkType: app.addDeviceInfo.linkType,
      wifi_version: app.addDeviceInfo.moduleVersion || '',
    })
  },
  //调用新增房间接口
  increaseRoomInterface(roomName) {
    // homegroupId: this.currentHomeGroupId ? this.currentHomeGroupId: '86536688' 测试数据
    let resq = {
      homegroupId: this.currentHomeGroupId,
      name: roomName,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    wx.showLoading({
      icon: 'none',
    })
    requestService
      .request('addRoom', resq)
      .then((resp) => {
        console.log('创建房间成功', resp.data.data)
        wx.hideLoading()
        console.log('familyInfo.roomList:', this.data.familyInfo.roomList)
        let data = {
          roomId: resp.data.data.id,
          name: resp.data.data.name,
          des: resp.data.data.desc,
          icon: resp.data.data.icon,
          isDefault: resp.data.data.isDefault,
        }
        this.data.familyInfo.roomList.push(data)
        this.setData({
          ['familyInfo.roomList']: this.data.familyInfo.roomList,
          currentRoomId: data.roomId,
          currentRoomName: data.name,
        })
      })
      .catch((e) => {
        console.log('创建房间失败', e)
        let msg = '请检查网络，或稍后重试'
        if (e.data && e.data.msg) {
          msg = e.data.msg == 'The name of room is duplicated' ? '房间名称重复，无法添加' : msg
        }
        wx.hideLoading()
        //埋点
        burialPoint.failIncreaseRoom({
          pageName: '创建房间失败弹窗',
          pageId: 'failed_to_create_room',
          deviceSessionId: app.globalData.deviceSessionId,
          sn: this.data.plainSn,
          sn8: app.addDeviceInfo.sn8,
          type: app.addDeviceInfo.type,
          moduleVersion: this.data.blueVersion || '',
          linkType: app.addDeviceInfo.linkType,
          wifi_version: app.addDeviceInfo.moduleVersion || '',
        })
        Dialog.confirm({
          title: '创建房间失败',
          message: msg,
          confirmButtonText: '我知道了',
          showCancelButton: false,
          confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
        }).then((res) => {
          if (res.action == 'confirm') {
          }
        })
      })
  },

  validtaFunc(val) {
    var validator = new validateFun()
    validator.add(val, [
      { ruleName: 'isNonEmpty', errorMsg: '房间名不能为空' },
      { ruleName: 'isFacial', errorMsg: '房间名不支持标点及表情' },
    ])
    var errorMsg = validator.start()
    return errorMsg
  },
})
