/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
import { requestService, rangersBurialPoint } from '../../../../utils/requestService'
import { imgBaseUrl } from '../../../../common/js/api'
import computedBehavior from '../../../../utils/miniprogram-computed.js'
import { getStamp, getReqId } from 'm-utilsdk/index'
import { getFullPageUrl, showToast } from '../../../../utils/util.js'
import { selectModel, searchDevice, addGuide, inputWifiInfo } from '../../../../utils/paths.js'
import { isSupportPlugin } from '../../../../utils/pluginFilter'
import { login } from '../../../../utils/paths'
import { getLinkType } from '../../../assets/js/utils'
import { isAddDevice } from '../../../../utils/temporaryNoSupDevices'
import { addDeviceSDK } from '../../../../utils/addDeviceSDK'
import { getPrivateKeys } from '../../../../utils/getPrivateKeys'
const getFamilyPermissionMixin = require('../../../assets/js/getFamilyPermissionMixin.js')
import Dialog from '../../../../../miniprogram_npm/m-ui/mx-dialog/dialog'
const brandStyle = require('../../../assets/js/brand.js')
import { imgesList } from '../../../assets/js/shareImg.js'
const app = getApp()
const imgUrl = imgBaseUrl.url + '/shareImg/' + brandStyle.brand
const imgCdnUrl = {
  url: 'https://pic.mdcdn.cn/h5/img/colmomini',
}
const categoryMap = {
  家用空调: [
    {
      category: 'D1X1',
      categoryName: '壁挂式空调',
      imgUrl: `${imgCdnUrl.url}/cate_pic/AC_1.png`,
    },
    {
      category: 'D1X2',
      categoryName: '立柜式空调',
      imgUrl: `${imgCdnUrl.url}/cate_pic/AC_2.png`,
    },
    // {
    //   category: 'D8X3',
    //   categoryName: '新风',
    //   imgUrl: `${imgCdnUrl.url}/cate_pic/AC_3.png`
    // },
    {
      category: 'D8X5',
      categoryName: '除湿机',
      imgUrl: `${imgCdnUrl.url}/cate_pic/A1_1.png`,
    },
  ],
  家用中央空调: [
    {
      category: 'D1X3',
      imgUrl: `${imgCdnUrl.url}/cate_pic/AC_4.png`,
    },
  ],
  洗衣机: [
    {
      category: 'D3X1',
      categoryName: '滚筒洗衣机',
      imgUrl: `${imgCdnUrl.url}/cate_pic/DB_1.png`,
    },
    {
      category: 'D3X2',
      categoryName: '波轮洗衣机',
      imgUrl: `${imgCdnUrl.url}/cate_pic/DA_1.png`,
    },
    {
      category: 'D3X3',
      categoryName: '复式洗衣机',
      imgUrl: `${imgCdnUrl.url}/cate_pic/D9_1.png`,
    },
    {
      category: 'D3X5',
      categoryName: '洗干一体机',
      imgUrl: `${imgCdnUrl.url}/cate_pic/DB_2.png`,
    },
  ],
  干衣机: [
    {
      category: 'D3X4',
      imgUrl: `${imgCdnUrl.url}/cate_pic/DC_1.png`,
    },
  ],
  衣物护理柜: [
    {
      category: 'D27X1',
      categoryName: '衣物护理',
      imgUrl: `${imgCdnUrl.url}/cate_pic/46_1.png`,
    },
  ],
  电热水器: [
    {
      category: 'D6X1',
      imgUrl: `${imgCdnUrl.url}/cate_pic/E2_1.png`,
    },
  ],
  燃气热水器: [
    {
      category: 'D6X2',
      imgUrl: `${imgCdnUrl.url}/cate_pic/E3_1.png`,
    },
    {
      category: 'D8X7',
      categoryName: '壁挂炉',
      imgUrl: `${imgCdnUrl.url}/cate_pic/E6_1.png`,
    },
  ],
  烟机: [
    {
      category: 'D4X1',
      categoryName: '抽油烟机',
      imgUrl: `${imgCdnUrl.url}/cate_pic/B6_1.png`,
    },
  ],
  燃气灶: [
    {
      category: 'D4X5',
      imgUrl: `${imgCdnUrl.url}/cate_pic/B7_1.png`,
    },
  ],
  洗碗机: [
    {
      category: 'D4X2',
      imgUrl: `${imgCdnUrl.url}/cate_pic/E1_1.png`,
    },
  ],
  嵌入式烤箱: [
    {
      category: 'D4X3',
      categoryName: '烤箱',
      imgUrl: `${imgCdnUrl.url}/cate_pic/B1_1.png`,
    },
  ],
  嵌入式电蒸炉: [
    {
      category: 'D4X4',
      categoryName: '蒸汽炉',
      imgUrl: `${imgCdnUrl.url}/cate_pic/B2_1.png`,
    },
    {
      category: 'D4X123',
      categoryName: '电磁灶',
      imgUrl: `${imgCdnUrl.url}/cate_pic/B9_1.png`,
    },
  ],
  冰箱: [
    {
      category: 'D2X2',
      categoryName: '三门冰箱',
      imgUrl: `${imgCdnUrl.url}/cate_pic/CA_1.png`,
    },
    {
      category: 'D2X3',
      categoryName: '对开门冰箱',
      imgUrl: `${imgCdnUrl.url}/cate_pic/CA_2.png`,
    },
    {
      category: 'D2X4',
      categoryName: '多开门冰箱',
      imgUrl: `${imgCdnUrl.url}/cate_pic/CA_3.png`,
    },
    {
      category: 'D2X5',
      categoryName: '十字四门冰箱',
      imgUrl: `${imgCdnUrl.url}/cate_pic/CA_4.png`,
    },
    {
      category: 'D2X122',
      categoryName: '酒柜',
      imgUrl: `${imgCdnUrl.url}/cate_pic/C8_1.png`,
      notSupport: true,
    },
  ],
  家用净水器: [
    {
      category: 'D7X97',
      categoryName: '净水机',
      imgUrl: `${imgCdnUrl.url}/cate_pic/ED_1.png`,
    },
    {
      category: 'D7X99',
      categoryName: '管线机',
      imgUrl: `${imgCdnUrl.url}/cate_pic/ED_2.png`,
    },
    {
      category: 'D7X96',
      categoryName: '软水机',
      imgUrl: `${imgCdnUrl.url}/cate_pic/ED_3.png`,
    },
  ],
  电饭煲: [
    {
      category: 'D5X2',
      imgUrl: `${imgCdnUrl.url}/cate_pic/EA_1.png`,
    },
  ],
  // '破壁机': [
  //   {
  //     category: 'D5X5',
  //     imgUrl: `${imgCdnUrl.url}/cate_pic/F1_1.png`
  //   },
  // ],
}
Page({
  behaviors: [computedBehavior, getFamilyPermissionMixin],
  /**
   * 页面的初始数据
   */
  data: {
    currentIndex: 0,
    searchIconImg: imgBaseUrl.url + '/mideaServices/images/icon.png',
    productList: [],
    scrollHeight: 0,
    isIphoneX: false,
    targetId: '',
    heightArr: [],
    lastActive: 0,
    endIndexFlag: false, //判断左边是否选中了最后一个
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
  onLoad() {
    console.log('isAddDevice====', isAddDevice('BF', '70000696'))
    this.data.brand = brandStyle.brand
    this.setData({
      brand: this.data.brand,
      searchIcon: imgUrl + imgesList['searchIcon'],
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
    if (this.data.brand == 'colmo') {
      wx.setNavigationBarColor({
        backgroundColor: '#202026',
        frontColor: '#ffffff',
      })
    }
    this.getLoginStatus().then(() => {
      if (app.globalData.isLogon) {
        this.checkFamilyPermission()
        this.initData()
        this.makePageViewTrack()
      } else {
        this.navToLogin()
      }
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

  itemClicked(e) {
    let { productList } = this.data
    let index = e.currentTarget.dataset.index
    let category = e.currentTarget.dataset.category
    this.clickCategoryViewTrack(category)
    this.setData({
      currentIndex: index,
      endIndexFlag: index == productList.length - 1 ? true : false,
    })
    this.makeScrollToELe()
  },

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
  makeScrollToELe() {
    let self = this
    let { currentIndex, productList } = this.data
    let currId = productList[currentIndex]['id']
    // 获取选中的元素-页面滚动到对应位置
    wx.createSelectorQuery()
      .select(`#prod-item-${currId}`)
      .boundingClientRect(function (rect) {
        console.log('createSelectorQuery====', rect)
        self.setData({
          targetId: `prod-item-${currId}`,
        })
      })
      .exec()
  },
  initData() {
    let self = this
    // self.setData({
    //   productList: productListData
    // })
    // console.log('productList===', productListData)
    self.getSystemInfo()
    self.getQueryBrandCategory()
  },
  getElementsHeight() {
    let self = this
    let { productList } = this.data
    let heightArr = []
    let h = 0
    if (!productList) return
    //创建节点选择器
    const query = wx.createSelectorQuery()
    //选择class
    query.selectAll('.item-prod').boundingClientRect()
    query.exec(function (res) {
      // console.log(res[0].length)
      let eleArr = res[0]
      if (eleArr.length != productList.length) {
        self.getElementsHeight()
      } else {
        eleArr.forEach((item) => {
          h += parseInt(item.height)
          heightArr.push(h)
        })
        console.log('heightArr====', heightArr)
        self.setData({
          heightArr: heightArr,
        })
      }
    })
  },
  /**
   * 根据品牌获取大小类
   */
  async getQueryBrandCategory() {
    const param = {
      stamp: getStamp(),
      reqId: getReqId(),
      brand: brandStyle.brand == 'meiju' ? '' : brandStyle.brand,
    }
    try {
      const interfaceRes = await requestService.request('getQueryBrandCategory', param)
      const productList = interfaceRes.data.data.list.filter((arr) => {
        return arr.list0.length
      })
      console.log('@module select-device.js\n@method getQueryBrandCategory\n@desc 获取大小类成功\n', productList)
      if (brandStyle.brand == 'colmo') {
        // colmo品牌需要更换本地图片
        let colmoImgMap = []
        Object.values(categoryMap).forEach((element) => {
          colmoImgMap = colmoImgMap.concat(element)
        })
        productList.forEach((element) => {
          element.list0.forEach((element0) => {
            const colmoItem = colmoImgMap.find((element1) => element1.category == element0.category)
            if (colmoItem) {
              element0.imgUrl = colmoItem.imgUrl
            }
          })
        })
        console.log('@module select-device.js\n@method getQueryBrandCategory\n@desc colmo图片更换完成\n', productList)
      }
      this.setData({
        productList,
      })
      this.getElementsHeight()
    } catch (err) {
      console.error('@module select-device.js\n@method getQueryBrandCategory\n@desc 获取大小类失败\n', err)
    }
  },

  getColmoProductList() {
    console.log('准备请求COLMO')
    requestService.getColmoProductList().then((res) => {
      console.log(res)
      if (res.code !== 0) {
        showToast('网络异常，请稍后再试')
        return []
      } else {
        let originProductList = res.data[0].productTypeDTOList
        originProductList.forEach((airConditioner) => {
          airConditioner['categoryName'] = airConditioner['prodName']
          let flag = 0
          let airConditionerList = airConditioner.children
          if (airConditionerList && Array.isArray(airConditionerList)) {
            let newCategoryList = airConditionerList.reduce((o, v) => {
              let categoryList = categoryMap[v.prodName]
              if (categoryList && Array.isArray(categoryList)) {
                categoryList.forEach((item) => {
                  let obj = JSON.parse(JSON.stringify(v))
                  obj.category = item.category || ''
                  obj.prodName = item.categoryName || v.prodName
                  obj.prodImg = item.imgUrl || v.prodImg
                  obj.isSupport = !item.notSupport
                  obj.imgUrl = item.imgUrl
                  obj.categoryName = item.categoryName
                  o.push(obj)
                })
                flag = 1
              }
              return o
            }, [])
            airConditioner.list0 = newCategoryList
          }
          airConditioner.flag = flag
        })
        originProductList.sort((a, b) => b.flag - a.flag)
        // productList.forEach((value,index)=>{
        //   productList[index]['categoryName'] = productList[index]['prodName']
        // })
        console.log('hhhhyes')
        console.log(originProductList)
        this.setData({
          productList: originProductList,
        })
      }
    })
  },
  /**
   * 获取密钥错误处理及重试逻辑
   * @param {*} addDeviceInfo
   */
  privateKeyErrorHand(e) {
    let self = this
    let obj = {
      page_name: '选择设备类型',
      widget_id: 'key_server_failed',
      widget_name: '密钥获取失败弹窗',
    }
    getPrivateKeys.privateBurialPoint(obj)

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
          getPrivateKeys.privateBurialPoint(obj)
          try {
            await getPrivateKeys.getPrivateKey()
            this.prodClicked(e)
          } catch (err) {
            console.log('Yoram err is ->', err)
            this.privateKeyErrorHand(e)
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
    wx.showModal({
      title: '服务器连接失败',
      content: '请检查网络或稍后再试',
      confirmText: '重试',
      complete: async (res) => {
        if (res.cancel) {
          wx.hideLoading()
          self.setData({
            clickFLag: false,
          })
          obj.widget_id = 'click_cancel'
          obj.widget_name = '密钥获取失败弹窗取消按钮'
          getPrivateKeys.privateBurialPoint(obj)
        }

        if (res.confirm) {
          wx.hideLoading()
          self.setData({
            clickFLag: false,
          })
          obj.widget_id = 'click_retry'
          obj.widget_name = '密钥获取失败弹窗重试按钮'
          getPrivateKeys.privateBurialPoint(obj)
          try {
            await getPrivateKeys.getPrivateKey()
            this.prodClicked(e)
          } catch (err) {
            console.log('Yoram err is ->', err)
            this.privateKeyErrorHand(e)
          }
        }
      },
    })
  },
  //产品点击
  async prodClicked(e) {
    let category = e.currentTarget.dataset.category
    let name = e.currentTarget.dataset.name
    let isProduct = e.currentTarget.dataset.product
    let iCategoryName = e.currentTarget.dataset.icategory
    const this_ = this
    if (this.prodClickFlag) return
    this.prodClickFlag = true
    this.clickApplianceViewTrack(iCategoryName, name)
    //isProduct为true直接跳配网
    if (isProduct) {
      let code = e.currentTarget.dataset.code
      let pCategory = e.currentTarget.dataset.pcategory
      let enterprise = e.currentTarget.dataset.enterprise
      let productId = e.currentTarget.dataset.id
      let deviceImg = e.currentTarget.dataset.img
      // 判断全局的密钥有没有，有就跳过，没有就重新拉取
      // if(!app.globalData.privateKey) {
      //   if(app.globalData.privateKeyIntervalNum) {
      //     clearInterval(app.globalData.privateKeyIntervalNum)
      //   }
      //   try {
      //       await getPrivateKeys.getPrivateKey()
      //       this.prodClicked(e)
      //   } catch(err) {
      //     this.privateKeyErrorHand(e)
      //   }
      //   return
      // }
      this.makeProductCheck(code, pCategory, enterprise, productId, deviceImg)
    } else {
      wx.navigateTo({
        url: `${selectModel}?category=${category}&name=${name}`,
        complete() {
          this_.prodClickFlag = false
        },
      })
    }
  },
  makeProductCheck(code, category, enterprise, productId, deviceImg) {
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
      Dialog.confirm({
        title: '该设备暂不支持小程序配网，我们会尽快开放，敬请期待',
        confirmButtonText: '我知道了',
        confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
        showCancelButton: false,
      }).then((res) => {
        this.prodClickFlag = false
      })
      // wx.showModal({
      //   content: '该设备暂不支持小程序配网，我们会尽快开放，敬请期待',
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
        '该品类无对应插件不支持小程序配网',
      )
      getApp().setMethodFailedCheckingLog('prodClicked', '该品类无对应插件不支持小程序配网')
      return
    }
    requestService
      .request('multiNetworkGuide', param)
      .then((res) => {
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
          serverCode: res.data.code + '',
          serverType: res.data.data.category,
        }
        if (addDeviceSDK.isCanWb01BindBLeAfterWifi(category, code)) {
          app.addDeviceInfo = addDeviceInfo
          app.addDeviceInfo.mode = 30
          wx.navigateTo({
            url: addGuide,
          })
          return
        }
        if (mode == 5 || mode == 9 || mode == 10 || mode == 100) {
          console.log('跳addguide')
          app.addDeviceInfo = addDeviceInfo
          wx.navigateTo({
            url: addGuide,
          })
        } else if (mode == 0 || mode == 3) {
          console.log('跳inputWifiInfo')
          app.addDeviceInfo = addDeviceInfo
          console.log(app.addDeviceInfo)
          wx.navigateTo({
            url: inputWifiInfo,
          })
        } else {
          Dialog.confirm({
            title: '该设备暂不支持小程序配网，我们会尽快开放，敬请期待',
            confirmButtonText: '我知道了',
            confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
            showCancelButton: false,
          }).then((res) => {
            this.prodClickFlag = false
          })
          // wx.showModal({
          //   content: '该设备暂不支持小程序配网，我们会尽快开放，敬请期待',
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
          console.log('小程序暂时不支持的配网方式====')
        }
        this.getGuideTrack({
          deviceSessionId: app.globalData.deviceSessionId,
          type: category,
          sn8: code,
          linkType: addDeviceInfo.linkType,
          serverCode: addDeviceInfo.serverCode + '',
          serverType: addDeviceInfo.serverType,
          serverSn8: addDeviceInfo.guideInfo[0].code,
        })
        console.log('select model==============')
      })
      .catch((err) => {
        console.log('error=====', err)
        if (err.data.code == 1) {
          wx.showToast({
            title: err.data.msg,
            icon: 'none',
          })
        }
        this.getGuideTrack({
          deviceSessionId: app.globalData.deviceSessionId,
          type: category,
          sn8: code,
          linkType: '', //getLinkType(mode),
          serverCode: err?.data?.code + '' || err,
        })
        getApp().setMethodFailedCheckingLog('prodClicked', `选择设备后获取指引失败。error=${JSON.stringify(err)}`)
        // if (err.errMsg) {
        //   showToast('网络不佳，请检查网络')
        //   return
        // }
      })
  },
  goSearch() {
    wx.navigateTo({
      url: `${searchDevice}`,
    })
  },
  onScroll(e) {
    let { productList } = this.data
    let scrollTop = parseInt(e.detail.scrollTop)
    let { heightArr, scrollHeight, lastActive, endIndexFlag } = this.data
    if (scrollTop >= heightArr[heightArr.length - 1] - scrollHeight / 2) {
      return
    } else {
      for (let i = 0; i < heightArr.length; i++) {
        if (scrollTop >= 0 && scrollTop < heightArr[0]) {
          if (lastActive != 0) {
            this.clickCategoryViewTrack(productList[0]['categoryName'])
            this.setData({
              currentIndex: 0,
              lastActive: 0,
            })
          }
        } else if (scrollTop >= heightArr[i - 1] && scrollTop < heightArr[i]) {
          if (endIndexFlag) {
            this.setData({
              lastActive: 0,
              endIndexFlag: false,
            })
          } else {
            if (lastActive != i) {
              this.clickCategoryViewTrack(productList[i]['categoryName'])
              this.setData({
                currentIndex: i,
                lastActive: i,
              })
            }
          }
        }
      }
    }
  },
  makePageViewTrack() {
    rangersBurialPoint('user_page_view', {
      module: 'appliance', //写死 “活动”
      page_id: 'page_choose_appliance_type', //参考接口请求参数“pageId”
      page_name: '选择设备类型页', //当前页面的标题，顶部的title
      page_path: getFullPageUrl(), //当前页面的URL
      page_module: 'appliance',
      device_info: {
        device_session_id: app.globalData.deviceSessionId, //一次配网事件标识
      },
    })
  },
  clickCategoryViewTrack(object_name) {
    rangersBurialPoint('user_behavior_event', {
      module: 'appliance', //写死 “活动”
      page_id: 'page_choose_appliance_type', //参考接口请求参数“pageId”
      page_name: '选择设备类型页', //当前页面的标题，顶部的title
      page_path: getFullPageUrl(), //当前页面的URL
      widget_id: 'click_category',
      widget_name: '分类',
      page_module: 'appliance',
      object_type: '分类',
      object_name,
      device_info: {
        device_session_id: app.globalData.deviceSessionId, //一次配网事件标识
      },
    })
  },
  clickApplianceViewTrack(page_module, object_name) {
    rangersBurialPoint('user_behavior_event', {
      module: 'appliance', //写死 “活动”
      page_id: 'page_choose_appliance_type', //参考接口请求参数“pageId”
      page_name: '选择设备类型页', //当前页面的标题，顶部的title
      page_path: getFullPageUrl(), //当前页面的URL
      widget_id: 'click_appliance',
      widget_name: '分类',
      page_module,
      object_type: '设备品类',
      object_name,
      device_info: {
        device_session_id: app.globalData.deviceSessionId, //一次配网事件标识
      },
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
  // 获取登录状态 最新登录流程
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
    wx.navigateTo({ url: login })
  },
})
