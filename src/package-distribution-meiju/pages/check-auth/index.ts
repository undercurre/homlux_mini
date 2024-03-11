import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { homeStore } from '../../../store/index'
import app from '../../common/app'
import { queryGuideInfo } from '../../../apis/index'
import { addDeviceSDK } from '../../utils/addDeviceSDK'
import { addGuide, inputWifiInfo } from '../../utils/paths.js'
import Toast from '@vant/weapp/toast/toast'
import { meijuImgDir, productImgDir } from '../../../config/img'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getLinkType } = require('../assets/js/utils.js')

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

  computed: {},
  lifetimes: {
    async ready() {
      const { proType, sn8, deviceImg, productId, mode } = this.data
      console.log('check-auth', proType, sn8)

      if (sn8) {
        const sn8List = sn8.split(',')

        app.addDeviceInfo.type = proType
        app.addDeviceInfo.sn8 = sn8List[0]
        app.addDeviceInfo.mode = mode
        app.addDeviceInfo.deviceImg = deviceImg || `${productImgDir}/0x${proType}.png`
        app.addDeviceInfo.productId = productId
        app.addDeviceInfo.sn8List = sn8List
      }

      this.toBindDevice()
    },
  },
  methods: {
    /**
     * 前往配网流程页面
     */
    async toBindDevice() {
      const { sn8, type, mode, sn8List } = app.addDeviceInfo

      const guideInfoList = []
      const promiseList = []

      // 请求多个sn8的配网数据
      for (const sn8Item of sn8List) {
        promiseList.push(
          queryGuideInfo({ houseId: homeStore.currentHomeId, sn8: sn8Item, type, mode: mode.toString() }),
        )
      }

      const resList = await Promise.all(promiseList)

      // 遍历返回的配网数据
      for (const res of resList) {
        if (res.code === 9850) {
          Dialog.alert({
            title: '美居账号授权已过期，请重新授权',
          }).then(() => {
            this.goBack()
          })
          return
        }

        if (!res.success) {
          Toast('获取配网指引失败')
          return
        }

        const guideInfo = res.result
        const connectDesc = guideInfo.mainConnectTypeDesc
        let connectUrl = guideInfo.mainConnectTypeUrlList[0]

        // 若品类为浴霸，首个配网指引固定配网图
        if (type === '26' && guideInfo.modelCode === 'M0100032') {
          connectUrl = `${meijuImgDir}/addDevice/bath-heater-guide.gif`
        }

        guideInfoList.push({
          connectDesc,
          connectUrlA: connectUrl,
          isAutoConnect: guideInfo.isAutoConnect,
          code: guideInfo.modelCode,
          wifiFrequencyBand: guideInfo.wifiFrequencyBand,
        })
      }

      // 0,3 跳inputWifiInfo, 5 跳addguide
      const addDeviceInfo = {
        enterprise: '0000',
        fm: 'selectType',
        linkType: getLinkType(mode),
        guideInfo: guideInfoList,
      }

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
    },
  },
})
