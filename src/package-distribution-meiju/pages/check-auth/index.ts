import pageBehaviors from '../../../behaviors/pageBehaviors'

import app from '../../common/app'
// import {queryGuideInfo} from '../../../apis/index'
import {Logger} from "../../../utils/index";
import {addDeviceSDK} from '../../utils/addDeviceSDK'
import {addGuide, inputWifiInfo} from '../../utils/paths.js'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {getLinkType} = require("../assets/js/utils.js")

Component({
  behaviors: [pageBehaviors],
  properties: {
    proType: String,
    sn8: String,
    deviceImg: String,
  },

  data: {
    isAgree: false,
    seconds: 3,
  },
  lifetimes: {
    ready() {
      console.log('check-auth', this.data.proType, this.data.sn8)

      app.addDeviceInfo.type = this.data.proType
      const timeId = setInterval(() => {
        this.data.seconds--

        this.setData({
          seconds: this.data.seconds,
        })

        if (this.data.seconds <= 0) {
          clearInterval(timeId)
        }
      }, 1000)
    },
    detached() {
    },
  },
  methods: {
    async handleConfirm() {
      // const res = await queryGuideInfo({sn8: this.data.sn8, type: this.data.proType, mode: '0' })

      const res = {
        "code": 0,
        "data": {
          "auxiConnectinfoList": [],
          "auxiMode": -1,
          "brand": "midea",
          "category": "14",
          "dataSource": 1,
          "enterpriseCode": "0000",
          "mainConnectinfoList": [{
            "bluetoothName": null,
            "code": "79700Z76",
            "connectDesc": "① 将智能窗帘插上电源\n② 快速点按「SET-2」键4次，再长按「SET-2」键1次，直至指示灯闪烁",
            "connectUrlA": "http://midea-file.oss-cn-hangzhou.aliyuncs.com/2021/7/7/15/NZxmnjoefmcMealUPBmt.gif",
            "connectUrlB": "",
            "connectUrlC": "",
            "controlVersion": null,
            "customerModel": "SC-1/M2-Z",
            "isAutoConnect": 0,
            "isBluetoothControl": 0,
            "leadingWords": "已完成上述操作",
            "marketModel": "SC-1/M2-Z",
            "mode": 0,
            "note": null,
            "productCode": "21079710000001",
            "productId": "SC-1/M2-Z",
            "productImg": "http://midea-file.oss-cn-hangzhou.aliyuncs.com/2021/6/21/13/pJeBIFcVqOdjdODAiSRK.png",
            "productName": "智能电动窗帘",
            "wifiFrequencyBand": 1,
            "wifiName": null
          }],
          "mode": 0,
          "needTransfer2FailStatus": null,
          "proInfrared": null
        },
        "msg": "操作成功"
      }
      Logger.console('queryGuideInfo', res)

      const data = res.data
      const guideInfo = data.mainConnectinfoList[0]
      const {mode, productId, code} = guideInfo
      console.log('mode=====', mode)
      //0,3 跳inputWifiInfo, 5 跳addguide
      const addDeviceInfo = {
        sn8: code,
        type: this.data.proType,
        enterprise: data.category,
        productId,
        deviceImg: this.data.deviceImg,
        mode,
        fm: 'selectType',
        linkType: getLinkType(mode),
        guideInfo: data.mainConnectinfoList,
      }
      const modeArr = addDeviceSDK.supportAddDeviceMode

      if (modeArr.indexOf(mode) >= 0) {
        // @ts-ignore
        app.addDeviceInfo = addDeviceInfo
        console.log(app.addDeviceInfo)
        if (addDeviceSDK.isCanWb01BindBLeAfterWifi(this.data.proType, code)) {
          // @ts-ignore
          app.addDeviceInfo.mode = 30
          wx.navigateTo({
            url: addGuide,
          })
          return
        }
        if (mode == 5 || mode == 9 || mode == 10 || mode == 100 || mode == 103) {
          console.log('跳addguide')
          wx.navigateTo({
            url: addGuide,
          })
        } else if (mode == 0 || mode == 3) {
          console.log('跳inputWifiInfo')
          wx.navigateTo({
            url: addGuide,
          })
        }
      } else {
        wx.showModal({
          content: '该设备暂不支持小程序配网，我们会尽快开放，敬请期待',
          confirmText: '我知道了',
          showCancelButton: false,
        })
      }
      console.log('select model==============')
      wx.navigateTo({
        url: inputWifiInfo,
      })
    },
  },
})
