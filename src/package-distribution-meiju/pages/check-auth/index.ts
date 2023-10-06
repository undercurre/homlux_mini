import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { homeStore } from '../../../store/index'
import app from '../../common/app'
import {queryGuideInfo, queryUserThirdPartyInfo} from '../../../apis/index'
import {Logger, storage} from "../../../utils/index";
import {addDeviceSDK} from '../../utils/addDeviceSDK'
import {addGuide, inputWifiInfo} from '../../utils/paths.js'
import Toast from "@vant/weapp/lib/toast/toast";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {getLinkType} = require("../assets/js/utils.js")

ComponentWithComputed({
  behaviors: [pageBehaviors],
  properties: {
    proType: String,
    sn8: String,
    deviceImg: String,
    productId: String,
    mode: Number,
  },

  data: {
    isAuth: true, // 是否已经绑定美居授权
    isAgree: false,
    seconds: 3,
  },

  computed: {
    tipsText(data) {
      const { seconds } = data
      return '我知道了' + (seconds ? `（${seconds}s）` : '')
    },
  },
  lifetimes: {
    async ready() {
      const { proType, sn8, deviceImg, productId, mode } = this.data
      console.log('check-auth', proType, sn8)

      if (sn8) {
        app.addDeviceInfo.type = proType
        app.addDeviceInfo.sn8 = sn8
        app.addDeviceInfo.mode = mode
        app.addDeviceInfo.deviceImg = deviceImg
        app.addDeviceInfo.productId = productId
      }

      const res = await queryUserThirdPartyInfo(homeStore.currentHomeId, { loading: true })

      if (res.success) {
        this.setData({
          isAuth: res.result[0].authStatus === 1,
        })
      }

      if (this.data.isAuth) {
        this.toBindDevice()
        return
      } else {
        const timeId = setInterval(() => {
          this.data.seconds--

          this.setData({
            seconds: this.data.seconds,
          })

          if (this.data.seconds <= 0) {
            clearInterval(timeId)
          }
        }, 1000)
      }
    },
    detached() {},
  },
  methods: {
    toAgree(e: { detail: boolean}) {
      console.log('toAgree', e)

      if (this.data.seconds > 0) {
        return
      }

      this.setData({
        isAgree: e.detail,
      })
    },
    /**
     * 确认绑定美居账号
     */
    toBindMeijuHome() {
      storage.set('meiju_auth_entry', 'distribution-meiju')
      wx.redirectTo({
        url: '/package-mine/auth/meiju/index',
      })
    },

    /**
     * 前往配网流程页面
     */
    async toBindDevice() {
      const { sn8, type, mode } = app.addDeviceInfo
      const res = await queryGuideInfo({sn8, type, mode: mode.toString()})

      // const res = {
      //   "code": 0,
      //   "data": {
      //     "auxiConnectinfoList": [],
      //     "auxiMode": -1,
      //     "brand": "midea",
      //     "category": "14",
      //     "dataSource": 1,
      //     "enterpriseCode": "0000",
      //     "mainConnectinfoList": [{
      //       "bluetoothName": null,
      //       "code": "79700Z76",
      //       "connectDesc": "① 将智能窗帘插上电源\n② 快速点按「SET-2」键4次，再长按「SET-2」键1次，直至指示灯闪烁",
      //       "connectUrlA": "http://midea-file.oss-cn-hangzhou.aliyuncs.com/2021/7/7/15/NZxmnjoefmcMealUPBmt.gif",
      //       "connectUrlB": "",
      //       "connectUrlC": "",
      //       "controlVersion": null,
      //       "customerModel": "SC-1/M2-Z",
      //       "isAutoConnect": 0,
      //       "isBluetoothControl": 0,
      //       "leadingWords": "已完成上述操作",
      //       "marketModel": "SC-1/M2-Z",
      //       "mode": 0,
      //       "note": null,
      //       "productCode": "21079710000001",
      //       "productId": "SC-1/M2-Z",
      //       "productImg": "http://midea-file.oss-cn-hangzhou.aliyuncs.com/2021/6/21/13/pJeBIFcVqOdjdODAiSRK.png",
      //       "productName": "智能电动窗帘",
      //       "wifiFrequencyBand": 1,
      //       "wifiName": null
      //     }],
      //     "mode": 0,
      //     "needTransfer2FailStatus": null,
      //     "proInfrared": null
      //   },
      //   "msg": "操作成功"
      // }
      Logger.console('queryGuideInfo', res)

      if (!res.success) {
        Toast('获取配网指引失败')
        return
      }

      const guideInfo = res.result
      //0,3 跳inputWifiInfo, 5 跳addguide
      const addDeviceInfo = {
        enterprise: '0000',
        fm: 'selectType',
        linkType: getLinkType(mode),
        guideInfo: [guideInfo],
      }
      const modeArr = addDeviceSDK.supportAddDeviceMode

      if (modeArr.indexOf(mode) >= 0) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        app.addDeviceInfo = Object.assign(app.addDeviceInfo, addDeviceInfo)
        console.log('addDeviceInfo', app.addDeviceInfo)
        if (addDeviceSDK.isCanWb01BindBLeAfterWifi(type, sn8)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          app.addDeviceInfo.mode = 30
          wx.redirectTo({
            url: addGuide,
          })
          return
        }
        if (mode == 5 || mode == 9 || mode == 10 || mode == 100 || mode == 103) {
          wx.redirectTo({
            url: addGuide,
          })
        } else if (mode == 0 || mode == 3) {
          wx.redirectTo({
            url: inputWifiInfo,
          })
        }
      } else {
        wx.showModal({
          content: '该设备暂不支持小程序配网，我们会尽快开放，敬请期待',
          confirmText: '我知道了',
          showCancelButton: false,
        })
      }
    },
  },
})
