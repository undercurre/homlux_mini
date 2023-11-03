/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
import { requestService } from '../../../../utils/requestService'
import { mideaServiceImgApi, imgBaseUrl } from '../../../../common/js/api'
import computedBehavior from '../../../../utils/miniprogram-computed.js'
import { getStamp, getReqId } from 'm-utilsdk/index'
import { showToast } from '../../../../utils/util.js'
import { addGuide, inputWifiInfo } from '../../../../utils/paths.js'
import { isSupportPlugin } from '../../../../utils/pluginFilter'
import { isAddDevice } from '../../../../utils/temporaryNoSupDevices'
import { getLinkType } from '../../../assets/js/utils'
import { addDeviceSDK } from '../../../../utils/addDeviceSDK'
import { getPrivateKeys } from '../../../../utils/getPrivateKeys'
import Dialog from '../../../../../miniprogram_npm/m-ui/mx-dialog/dialog'
const brandStyle = require('../../../assets/js/brand.js')
import { imgesList } from '../../../assets/js/shareImg.js'
import app from '../../../../common/app'
const imgUrl = imgBaseUrl.url + '/shareImg/' + brandStyle.brand

Page({
  behaviors: [computedBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    spritePicture: mideaServiceImgApi.url + 'icon.png',
    notFoundImg: mideaServiceImgApi.url + 'img_no_result@1x.png',
    productList: [],
    imgFlagList: [],
    productListData: [],
    searchKeyWord: '',
    scrollHeight: '',
    isIphoneX: false,
    pageNum: 1,
    hasNext: false,
    loadFlag: false,
    clickFLag: false, //防重复点击
    subCode: '', //产品型号
    placeholder: '请输入设备型号或系列', //占位文字
    dialogStyle: brandStyle.brandConfig.dialogStyle, //弹窗样式
  },
  computed: {
    convertedProductList() {
      let result = []
      let { searchKeyWord, productList } = this.data
      console.log('computed====', searchKeyWord)
      console.log('computed==productList==', productList.length)
      if (productList && productList.length) {
        for (let index = 0; index < productList.length; index++) {
          let prodItem = productList[index]
          let keyList = searchKeyWord.split('')
          let idList = prodItem.productId.split('')
          let nameList = prodItem.productName.split('')
          if (!prodItem['idHtml']) {
            let idHtml = this.getConvertedStr(keyList, idList)
            prodItem['idHtml'] = idHtml
          }
          if (!prodItem['nameHtml']) {
            let nameHtml = this.getConvertedStr(keyList, nameList, 'content')
            prodItem['nameHtml'] = nameHtml
          }
          result.push(prodItem)
        }
      }
      console.log('result=====', result)
      return result
    },
    searchKeyWordFlag() {
      return this.data.searchKeyWord.trim()
    },
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.brand = brandStyle.brand
    if (this.data.brand == 'colmo') {
      wx.setNavigationBarColor({
        backgroundColor: '#202026',
        frontColor: '#ffffff',
      })
    }
    this.setData({
      brand: this.data.brand,
      searchIcon: imgUrl + imgesList['searchIcon'],
      delIcon: imgUrl + imgesList['delIcon'],
      right_arrow: imgUrl + imgesList['right_arrow'],
    })
    this.setData({
      subCode: options.subCode || '',
    })
    this.initData()
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
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  getSystemInfo() {
    let self = this
    wx.getSystemInfo({
      success: function (res) {
        // 获取 select-input 的高度
        wx.createSelectorQuery()
          .select('.search-input')
          .boundingClientRect(function (rect) {
            self.setData({
              scrollHeight: res.windowHeight - rect.height - self.data.statusBarHeight - 40,
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
  getConvertedStr(keyList, valueList, type) {
    // let aKey = '3342'
    // let bKey = 'T33422'
    // let keyList = aKey.split('')
    // let valueList = bKey.split('')
    let valueDesc = []
    console.log('keyList===', keyList)
    console.log('valueList===', valueList)
    //匹配productId
    for (let iIndex = 0; iIndex < valueList.length; iIndex++) {
      let findFlag = false
      for (let kIndex = 0; kIndex < keyList.length; kIndex++) {
        if (valueList[iIndex].toLowerCase() == keyList[kIndex].toLowerCase()) {
          findFlag = true
          console.log('.toLowerCas======', valueList[iIndex])
          valueDesc.push({
            type: 'text',
            value: valueList[iIndex],
            style: {
              fontSize: 28,
              color: '#AF6437',
            },
          })
          break
        }
      }
      if (!findFlag) {
        valueDesc.push({
          type: 'text',
          value: valueList[iIndex],
          style: {
            fontSize: 28,
            color: this.data.brand == 'meiju' ? '#000000' : type == 'content' ? 'rgba(255,255,255,0.40)' : '#ffffff',
          },
        })
      }
    }
    let richHtml = this.getRichText(valueDesc)
    console.log('valueDesc====', valueDesc)
    console.log('richHtml====', richHtml)
    return richHtml
  },
  getRichText(richArr) {
    let spanStr = ''
    richArr.forEach((item) => {
      let currStr = `<span style="color:${item.style.color}">${item.value}</span>`
      spanStr += currStr
    })
    return `<div>${spanStr}</div>`
  },
  initData() {
    let self = this
    self.getSystemInfo()
    // self.setData({
    //   productListData: modeData.data.list
    // })
  },
  //正在输入
  actionInput(e) {
    let self = this
    this.setData({
      searchKeyWord: e.detail.value,
    })
    console.log('value=====', e.detail, self.data.searchKeyWord, e.detail.value)
    // if(!e.detail.keyCode) return
    self.getSearchData()
  },
  //输入值触发
  // bindinput(e){
  //   console.log("yyyyyyy====",e.detail.value)
  //   wx.showToast({
  //     title: e.detail.value,
  //   })
  //   let value = e.detail.value
  //   if(value.length){
  //     this.setData({
  //       placeholder : ''
  //     })
  //   }else{
  //     this.setData({
  //       placeholder : '请输入设备型号或系列'
  //     })
  //   }
  // },
  getSearchData() {
    let { searchKeyWord } = this.data
    if (!searchKeyWord.trim()) {
      return
    }
    this.data.productList = [] //置空搜索结果
    this.setData({
      pageNum: 1,
      hasNext: false,
      loadFlag: false,
    })
    this.getQueryIotProductV2()
  },
  getQueryIotProductV2(str) {
    let self = this
    let { pageNum, productList, subCode, searchKeyWord } = self.data
    let param = {
      code: searchKeyWord,
      pageSize: '20',
      page: pageNum,
      brand: brandStyle.brand == 'meiju' ? '' : brandStyle.brand,
      stamp: getStamp(),
      reqId: getReqId(),
    }
    if (subCode) {
      param['subCode'] = subCode
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
        let imgFlagList = []
        for (let i = 0; i < currProduct.length; i++) {
          imgFlagList.push({
            imgFailFlag: false,
          })
        }
        self.setData({
          imgFlagList,
          hasNext: hasNextPage,
        })
      })
      .catch((err) => {
        console.log('err====', err)
        //查不到数据
        if (err?.data?.code && err.data.code == 1) {
          self.setData({
            productList: [],
          })
        }
        self.setData({
          loadFlag: true,
          hasNext: false,
        })
      })
  },
  actionGoBack() {
    wx.navigateBack({})
  },
  delKeyWord() {
    this.setData({
      searchKeyWord: '',
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
  goLogin() {
    wx.navigateTo({
      url: '../../../../pages/login/login',
    })
  },
  /**
   * 获取密钥错误处理及重试逻辑
   * @param {*} addDeviceInfo
   */
  privateKeyErrorHand(e, addDeviceInfo) {
    let self = this
    let obj = {
      page_name: '搜索',
      widget_id: 'key_server_failed',
      widget_name: '密钥获取失败弹窗',
      sn8: app.addDeviceInfo.sn8 || '',
      widget_cate: app.addDeviceInfo.type || '',
    }
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
          self.setData({
            clickFLag: false,
          })
          obj.widget_id = 'click_retry'
          obj.widget_name = '密钥获取失败弹窗重试按钮'
          try {
            await getPrivateKeys.getPrivateKey()
            self.prodClicked(e)
          } catch (err) {
            console.log('Yoram err is ->', err)
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
        }
      })
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
    console.log('e.mode:', e)
    if (clickFLag) {
      console.log('点击防重处理不触发')
      return
    }
    this.data.clickFLag = true
    let param = {
      code: code,
      stamp: getStamp(),
      reqId: getReqId(),
      enterpriseCode: enterprise,
      category: category,
      productId: productId,
      queryType: 1,
    }
    console.log('param===', param)
    //先判断是否isSupportPlugin
    if (!isSupportPlugin(`0x${category}`, code, code, '0')) {
      wx.showModal({
        content: '该设备仅支持在美的美居App添加',
        confirmText: '我知道了',
        confirmColor: '#488FFF',
        showCancel: false,
      })
      setTimeout(() => {
        self.setData({
          clickFLag: false,
        })
      }, 1000)
      return
    }
    if (!isAddDevice(category.toLocaleUpperCase(), code)) {
      console.log('选型 不支持 未测试')
      wx.showModal({
        content: '该设备仅支持在美的美居App添加',
        confirmText: '我知道了',
        confirmColor: '#488FFF',
        showCancel: false,
      })
      setTimeout(() => {
        self.setData({
          clickFLag: false,
        })
      }, 1000)
      return
    }
    requestService
      .request('multiNetworkGuide', param)
      .then(async (res) => {
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
          // 判断全局的密钥有没有，有就跳过，没有就重新拉取
          if (!app.globalData.privateKey && mode != '103' && mode != '100') {
            self.data.clickFLag = false
            if (app.globalData.privateKeyIntervalNum) {
              clearInterval(app.globalData.privateKeyIntervalNum)
            }
            try {
              await getPrivateKeys.getPrivateKey()
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
            wx.navigateTo({
              url: addGuide,
            })
            self.setData({
              clickFLag: false,
            })
            return
          }
          if (mode == 5 || mode == 9 || mode == 10 || mode == 100 || mode == 103) {
            console.log('跳addguide')
            wx.navigateTo({
              url: addGuide,
            })
            app.addDeviceInfo = addDeviceInfo
            self.setData({
              clickFLag: false,
            })
          } else if (mode == 0 || mode == 3) {
            console.log('跳inputWifiInfo')
            app.addDeviceInfo = addDeviceInfo
            console.log(app.addDeviceInfo)
            wx.navigateTo({
              url: inputWifiInfo,
            })
            self.setData({
              clickFLag: false,
            })
          }
        } else {
          wx.showModal({
            content: '该设备仅支持在美的美居App添加',
            confirmText: '我知道了',
            confirmColor: '#488FFF',
            showCancel: false,
          })
        }
        setTimeout(() => {
          self.setData({
            clickFLag: false,
          })
        }, 1000)
        console.log('search device==============')
      })
      .catch((err) => {
        this.setData({
          clickFLag: false,
        })
        if (err?.data?.code && err.data.code == 1) {
          Dialog.confirm({
            title: '未获取到该产品的操作指引，请检查网络后重试，若仍失败，请联系售后处理',
            confirmButtonText: '好的',
            confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
            showCancelButton: false,
          })
        } else {
          showToast('当前网络信号不佳，请检查网络设置', 'none', 3000)
        }
      })
  },
  bindImgError(e) {
    let index = e.currentTarget.dataset.index
    let imgFailFlag = 'imgFlagList[' + index + '].imgFailFlag'
    this.setData({
      [imgFailFlag]: true,
    })
    console.log('bindImgError======', e)
  },
})
