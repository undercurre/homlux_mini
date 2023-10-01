/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
import { requestService, rangersBurialPoint } from '../../../../utils/requestService'
import { imgBaseUrl } from '../../../../common/js/api'
import computedBehavior from '../../../../utils/miniprogram-computed.js'
import { getStamp, getReqId } from 'm-utilsdk/index'
import { checkWxVersion_807, getFullPageUrl, showToast } from '../../../../utils/util.js'
import { addGuide, inputWifiInfo, searchDevice } from '../../../../utils/paths.js'
import { isSupportPlugin } from '../../../../utils/pluginFilter'
import { isAddDevice } from '../../../../utils/temporaryNoSupDevices'
import { getLinkType } from '../../../assets/js/utils'
import { addDeviceSDK } from '../../../../utils/addDeviceSDK'
import Dialog from '../../../../../miniprogram_npm/m-ui/mx-dialog/dialog'
const brandStyle = require('../../../assets/js/brand.js')
import { imgesList } from '../../../assets/js/shareImg.js'
import { getPrivateKeys } from '../../../../utils/getPrivateKeys'
const app = getApp()
const imgUrl = imgBaseUrl.url + '/shareImg/' + brandStyle.brand
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
Page({
  behaviors: [computedBehavior, getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    currentIndex: 0,
    searchIconImg: imgBaseUrl.url + '/mideaServices/images/icon.png',
    notFoundImg: imgBaseUrl.url + '/mideaServices/images/img_no_result@1x.png',
    productList: [],
    scrollHeight: 0,
    isIphoneX: false,
    targetId: '',
    pageNum: 1,
    hasNext: false,
    loadFlag: false,
    clickFLag: false, //防重复点击
    prodName: '',
    brand: '',
    dialogStyle: brandStyle.brandConfig.dialogStyle, //弹窗样式
  },
  computed: {
    //距离底部多远
    bottomPadding() {
      let { isIphoneX } = this.data
      return isIphoneX ? '100' : '70'
    },
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.brand = brandStyle.brand
    this.setData({
      brand: this.data.brand,
      searchIcon: imgUrl + imgesList['searchIcon'],
    })
    if (this.data.brand == 'colmo') {
      wx.setNavigationBarColor({
        backgroundColor: '#202026',
        frontColor: '#ffffff',
      })
    }
    this.getLoginStatus().then(() => {
      if (app.globalData.isLogon) {
        this.checkFamilyPermission()
      } else {
        this.navToLogin()
      }
    })
    this.setData({
      subCode: options.category || '',
      prodName: options.name || '',
    })
    this.initData()
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
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    getApp().onUnloadCheckingLog()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  goToPage(url) {
    wx.navigateTo({
      url,
    })
  },
  getSystemInfo() {
    let self = this
    wx.getSystemInfo({
      success: function (res) {
        // 获取 select-input 的高度
        wx.createSelectorQuery()
          .select('.select-input')
          .boundingClientRect(function (rect) {
            self.setData({
              scrollHeight: res.windowHeight - rect.height,
            })
          })
          .exec()
        if (res.safeArea.top > 20) {
          self.setData({
            isIphoneX: true,
          })
        } else {
          self.setData({
            isIphoneX: false,
          })
        }
      },
    })
  },
  initData() {
    let self = this
    // self.setData({
    //   productList: modeData.data.list
    // })
    // console.log('productList===', modeData)
    self.getSystemInfo()
    self.getQueryIotProductV2()
  },
  getQueryIotProductV2(str) {
    let self = this
    let { pageNum, productList, subCode } = self.data
    let param = {
      subCode,
      pageSize: '20',
      page: pageNum,
      brand: brandStyle.brand == 'meiju' ? '' : brandStyle.brand,
      stamp: getStamp(),
      reqId: getReqId(),
    }
    requestService
      .request('getQueryIotProductV2', param)
      .then((res) => {
        console.log('res=====', res)
        let currList = res.data.data.list || []
        let hasNextPage = res.data.data.hasNextPage
        if (!currList.length) {
          return
        }
        let currProduct = str != 'next' ? currList : [...productList, ...currList]
        self.setData({
          productList: currProduct,
          loadFlag: true,
        })
        self.setData({
          hasNext: hasNextPage,
        })
      })
      .catch(() => {
        self.setData({
          hasNext: false,
          loadFlag: true,
        })
      })
  },
  /**
   * 获取密钥错误处理及重试逻辑
   * @param {*} e
   */
  privateKeyErrorHand(e, addDeviceInfo) {
    let self = this
    let obj = {
      page_name: '选择型号',
      widget_id: 'key_server_failed',
      widget_name: '密钥获取失败弹窗',
      sn8: app.addDeviceInfo.sn8 || '',
      widget_cate: app.addDeviceInfo.type || '',
    }
    getPrivateKeys.privateBurialPoint(obj)
    wx.hideLoading()
    // 解决低配置机子跳到其他页面时还会弹框的问题
    if (getFullPageUrl().indexOf('select-model/select-model') == -1) return

    Dialog.confirm({
      title: '服务器连接失败',
      message: '请检查网络或稍后再试',
      confirmButtonText: '重试',
      confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
      cancelButtonColor: this.data.dialogStyle.cancelButtonColor2,
    })
      .then(async (res) => {
        if (res.action == 'confirm') {
          wx.hideLoading()
          obj.widget_id = 'click_retry'
          obj.widget_name = '密钥获取失败弹窗重试按钮'
          getPrivateKeys.privateBurialPoint(obj)
          try {
            wx.showLoading()
            await getPrivateKeys.getPrivateKey()
            self.data.clickFLag = false
            wx.hideLoading()
            self.prodClicked(e)
          } catch (err) {
            console.log('Yoram err is ->', err)
            wx.hideLoading()
            self.privateKeyErrorHand(e, addDeviceInfo)
          }
        }
      })
      .catch((error) => {
        if (error.action == 'cancel') {
          wx.hideLoading()
          self.setData({
            clickFLag: false,
          })
          obj.widget_id = 'click_cancel'
          obj.widget_name = '密钥获取失败弹窗取消按钮'
          getPrivateKeys.privateBurialPoint(obj)
        }
      })
    // wx.showModal({
    //   title: '服务器连接失败',
    //   content: '请检查网络或稍后再试',
    //   confirmText: '重试',
    //   complete: async (res) => {
    //     if (res.cancel) {
    //       wx.hideLoading()
    //       self.setData({
    //         clickFLag: false,
    //       })
    //       obj.widget_id = 'click_cancel'
    //       obj.widget_name = '密钥获取失败弹窗取消按钮'
    //       getPrivateKeys.privateBurialPoint(obj)
    //     }

    //     if (res.confirm) {
    //       wx.hideLoading()
    //       obj.widget_id = 'click_retry'
    //       obj.widget_name = '密钥获取失败弹窗重试按钮'
    //       getPrivateKeys.privateBurialPoint(obj)
    //       try {
    //         wx.showLoading()
    //         await getPrivateKeys.getPrivateKey()
    //         self.data.clickFLag = false
    //         wx.hideLoading()
    //         this.prodClicked(e)
    //       } catch (err) {
    //         console.log('Yoram err is ->', err)
    //         wx.hideLoading()
    //         this.privateKeyErrorHand(e, addDeviceInfo)
    //       }
    //     }
    //   },
    // })
  },
  //产品点击
  async prodClicked(e) {
    let self = this
    let { clickFLag } = this.data
    let code = e.currentTarget.dataset.code
    let category = e.currentTarget.dataset.category
    let enterprise = e.currentTarget.dataset.enterprise
    let productId = e.currentTarget.dataset.id
    let deviceImg = e.currentTarget.dataset.img
    if (clickFLag) {
      getApp().setMethodFailedCheckingLog('prodClicked', '点击防重处理不触发')
      console.log('prodClicked点击防重处理不触发')
      return
    }
    this.data.clickFLag = true
    wx.showLoading()
    let param = {
      code: code,
      stamp: getStamp(),
      reqId: getReqId(),
      enterpriseCode: enterprise,
      category: category,
      productId: productId,
      queryType: 1,
    }
    //先判断是否isSupportPlugin
    if (!isSupportPlugin(`0x${category}`, code, code, '0')) {
      wx.hideLoading()
      wx.showModal({
        content: '该设备仅支持在美的美居App添加',
        confirmText: '我知道了',
        confirmColor: '#267aff',
        showCancel: false,
      })
      setTimeout(() => {
        self.setData({
          clickFLag: false,
        })
      }, 1000)
      this.selectTypeNotSoupportTracking(
        {
          deviceSessionId: app.globalData.deviceSessionId,
          type: category,
          sn8: code,
        },
        '该品类无对应插件不支持小程序配网',
      )
      getApp().setMethodFailedCheckingLog('prodClicked', '该品类无对应插件不支持小程序配网')
      return
    }
    if (!isAddDevice(category.toLocaleUpperCase(), code)) {
      console.log('选型 不支持 未测试')
      wx.hideLoading()
      wx.showModal({
        content: '该设备仅支持在美的美居App添加',
        confirmText: '我知道了',
        confirmColor: '#267aff',
        showCancel: false,
      })
      setTimeout(() => {
        self.setData({
          clickFLag: false,
        })
      }, 1000)
      this.selectTypeNotSoupportTracking(
        {
          deviceSessionId: app.globalData.deviceSessionId,
          type: category,
          sn8: code,
        },
        '未测试品类不支持小程序配网',
      )
      getApp().setMethodFailedCheckingLog('prodClicked', '未测试品类不支持小程序配网')
      return
    }
    requestService
      .request('multiNetworkGuide', param)
      .then(async (res) => {
        wx.hideLoading()
        console.log('res=====', res)
        let mode = res.data.data.mainConnectinfoList[0].mode
        console.log('mode=====', mode)
        //0,3 跳inputWifiInfo, 5 跳addguide
        let addDeviceInfo = {
          sn8: code,
          type: category,
          enterprise,
          productId,
          deviceImg,
          mode,
          fm: 'selectType',
          linkType: getLinkType(mode),
          guideInfo: res.data.data.mainConnectinfoList,
        }
        app.addDeviceInfo = addDeviceInfo
        let modeArr = addDeviceSDK.supportAddDeviceMode
        if (modeArr.indexOf(mode) >= 0) {
          //判断微信版本
          if (checkWxVersion_807()) {
            wx.showModal({
              content: '你的微信版本过低，请升级至最新版本后再试',
              confirmText: '我知道了',
              confirmColor: '#267aff',
              showCancel: false,
            })
            setTimeout(() => {
              self.setData({
                clickFLag: false,
              })
            }, 1000)
            getApp().setMethodFailedCheckingLog('prodClicked', '微信版本过低')
            return
          }
          // 判断全局的密钥有没有，有就跳过，没有就重新拉取
          if (!app.globalData.privateKey && mode != '103' && mode != '100') {
            if (app.globalData.privateKeyIntervalNum) {
              clearInterval(app.globalData.privateKeyIntervalNum)
            }
            try {
              await getPrivateKeys.getPrivateKey()
              self.data.clickFLag = false
              self.prodClicked(e)
            } catch (err) {
              self.privateKeyErrorHand(e, addDeviceInfo)
            }
            return
          }
          // 结束判断全局的密钥有没有，有就跳过，没有就重新拉取
          if (addDeviceSDK.isCanWb01BindBLeAfterWifi(category, code)) {
            app.addDeviceInfo = addDeviceInfo
            app.addDeviceInfo.mode = 30
            self.data.clickFLag = false
            wx.navigateTo({
              url: addGuide,
            })
            return
          }
          if (mode == 5 || mode == 9 || mode == 10 || mode == 100 || mode == 103) {
            console.log('跳addguide')
            app.addDeviceInfo = addDeviceInfo
            wx.navigateTo({
              url: addGuide,
            })
          } else if (mode == 0 || mode == 3) {
            console.log('跳inputWifiInfo')
            app.addDeviceInfo = addDeviceInfo
            console.log(app.addDeviceInfo)
            self.data.clickFLag = false
            wx.navigateTo({
              url: inputWifiInfo,
            })
          }
        } else {
          Dialog.confirm({
            title: '该设备暂不支持小程序配网，我们会尽快开放，敬请期待',
            confirmButtonText: '我知道了',
            confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
            showCancelButton: false,
          }).then((res) => {
            if (res.action == 'confirm') {
              self.data.clickFLag = false
            }
          })
          // wx.showModal({
          //   content: '该设备仅支持在美的美居App添加',
          //   confirmText: '我知道了',
          //   confirmColor: '#267aff',
          //   showCancel: false,
          // })
          this.selectTypeNotSoupportTracking(
            {
              deviceSessionId: app.globalData.deviceSessionId,
              type: category,
              sn8: code,
            },
            '小程序暂时不支持的配网方式',
          )
          getApp().setMethodFailedCheckingLog('prodClicked', '小程序暂时不支持的配网方式')
        }
        setTimeout(() => {
          self.setData({
            clickFLag: false,
          })
        }, 1000)
        this.getGuideTrack({
          deviceSessionId: app.globalData.deviceSessionId,
          type: category,
          sn8: code,
          linkType: addDeviceInfo.linkType,
          serverCode: res.data.code + '',
          serverType: res.data.data.category,
          serverSn8: res.data.data.mainConnectinfoList[0].code,
        })
        console.log('select model==============')
      })
      .catch((err) => {
        wx.hideLoading()
        console.log('error=====', err)
        this.setData({
          clickFLag: false,
        })
        if (err?.data?.code && err.data.code == 1) {
          // wx.showToast({
          //   title: err.data.msg,
          //   icon: 'none',
          // })
          Dialog.confirm({
            title: '未获取到该产品的操作指引，请检查网络后重试，若仍失败，请联系售后处理',
            confirmButtonText: '好的',
            confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
            showCancelButton: false,
            success(res) {},
          })
        } else {
          showToast('当前网络信号不佳，请检查网络设置', 'none', 3000)
        }
        this.getGuideTrack({
          deviceSessionId: app.globalData.deviceSessionId,
          type: category,
          sn8: code,
          linkType: '', //getLinkType(mode),
          serverCode: err?.data?.code + '' || err,
        })
        getApp().setMethodFailedCheckingLog('prodClicked', `选型后获取设备指引异常。error=${JSON.stringify(err)}`)
        // if (err.errMsg) {
        //   showToast('网络不佳，请检查网络')
        //   return
        // }
      })
  },
  //获取指引埋点
  getGuideTrack(params) {
    rangersBurialPoint('user_behavior_event', {
      module: 'appliance', //写死 “活动”
      page_id: 'device_guidebook_page', //参考接口请求参数“pageId”
      page_name: '配网指引返回结果', //当前页面的标题，顶部的title
      page_path: getFullPageUrl(), //当前页面的URL
      widget_id: 'server_return',
      widget_name: '服务器返回',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        code: params.serverCode || '',
        cate: params.serverType || '',
        sn8: params.serverSn8 || '',
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison || '', //模组wifi版本
        link_type: params.linkType, //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },
  //选型不支持埋点
  selectTypeNotSoupportTracking(deviceInfo, errorMsg) {
    rangersBurialPoint('user_page_view', {
      module: 'appliance',
      page_id: 'popups_select_not_support', //参考接口请求参数“pageId”
      page_name: '选择设备不支持配网弹窗', //当前页面的标题，顶部的title
      page_path: getFullPageUrl(), //当前页面的URL
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        error_msg: errorMsg || '',
      },
      device_info: {
        device_session_id: deviceInfo.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: deviceInfo.sn8, //sn8码
        widget_cate: deviceInfo.type, //设备品类
      },
    })
  },
  goLogin() {
    wx.navigateTo({
      url: '../../../../pages/login/login',
    })
  },
  loadMoreData() {
    console.log('next======')
    let { pageNum, hasNext } = this.data
    if (!hasNext) {
      return
    }
    this.setData({
      pageNum: pageNum + 1,
    })
    this.getQueryIotProductV2('next')
  },
  goSearch() {
    let { subCode } = this.data
    wx.navigateTo({
      url: `${searchDevice}?subCode=${subCode}`,
    })
  },
})
