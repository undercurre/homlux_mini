import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { homeStore } from '../../../store/index'
import app from '../../common/app'
import { queryGuideInfo, queryUserThirdPartyInfo } from '../../../apis/index'
import { Logger, storage } from '../../../utils/index'
import { addDeviceSDK } from '../../utils/addDeviceSDK'
import { addGuide, inputWifiInfo } from '../../utils/paths.js'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { meijuImgDir } from '../../../config/img'
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

      const isAuth = res.success ? res.result[0].authStatus === 1 : false

      if (!res.success) {
        Toast('查询美居授权状态失败')
        return
      }

      if (isAuth) {
        this.toBindDevice()
        return
      }

      // 请联系家庭创建者完成美的美居授权。
      if (!homeStore.isCreator) {
        Dialog.alert({
          title: '请联系HOMLUX家庭创建者完成美的美居授权，路径：我的-连接其他平台-美的美居。',
          showCancelButton: false,
          confirmButtonText: '我知道了',
        }).then(() => {
          this.goBack()
        })
        return
      }

      this.setData({
        isAuth,
      })

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
  },
  methods: {
    toAgree(e: { detail: boolean }) {
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
        url: '/package-auth/pages/meiju/index',
      })
    },

    /**
     * 前往配网流程页面
     */
    async toBindDevice() {
      const { sn8, type, mode } = app.addDeviceInfo
      const res = await queryGuideInfo({ houseId: homeStore.currentHomeId, sn8, type, mode: mode.toString() })

      Logger.console('queryGuideInfo', res)

      if (!res.success) {
        Toast('获取配网指引失败')
        return
      }

      const guideInfo = res.result
      const connectDesc = guideInfo.mainConnectTypeDesc
      let connectUrl = guideInfo.mainConnectTypeUrlList[0]
      const guideInfoList = []

      // 若品类为浴霸，写死附加型号为R1的配网方式，并固定配网图
      if (type === '26') {
        guideInfoList.push({
          connectDesc:
            '① 浴霸接通电源\n② 检查遥控器是否能够控制浴霸(如：按遥控器「照明」键，浴霸灯亮)\n③ 长按遥控器「+」键「5」秒，听到“嘀”提示音，数秒内WiFi指示灯闪烁，表示设置成功',
          connectUrlA: 'http://midea-file.oss-cn-hangzhou.aliyuncs.com/2021/5/31/9/vLzXTxNBLxzGKAErIpYf.gif',
          isAutoConnect: guideInfo.isAutoConnect,
          code: guideInfo.modelCode,
          wifiFrequencyBand: guideInfo.wifiFrequencyBand,
        })

        connectUrl = `${meijuImgDir}/addDevice/bath-heater-guide.gif`
      }

      guideInfoList.unshift({
        connectDesc,
        connectUrlA: connectUrl,
        isAutoConnect: guideInfo.isAutoConnect,
        code: guideInfo.modelCode,
        wifiFrequencyBand: guideInfo.wifiFrequencyBand,
      })
      //0,3 跳inputWifiInfo, 5 跳addguide
      const addDeviceInfo = {
        enterprise: '0000',
        fm: 'selectType',
        linkType: getLinkType(mode),
        guideInfo: guideInfoList,
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
