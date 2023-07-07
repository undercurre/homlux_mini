import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { strUtil } from '../../utils/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    deviceList: [
      {
        img: 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/sensor_body.gif',
        name: '人体传感器',
        desc: '① 确认传感器电池已安装好\n② 长按球体顶部「配网按键」3秒，至指示灯开始闪烁（1秒/次）',
        path: 'sensor_door.gif',
        sn8: '7961012A',
      },
      {
        img: 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/sensor_door.gif',
        name: '门磁传感器',
        desc: '① 确认传感器电池已安装好\n② 长按顶部「配网按键」3秒，至指示灯开始闪烁（1秒/次）',
        path: '',
        sn8: '79610128',
      },
      {
        img: 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/sensor_switch.gif',
        name: '无线开关',
        desc: '① 确认传感器电池已安装好\n② 长按「开关键」10秒，至指示灯开始闪烁（1秒/次）',
        path: '',
        sn8: '7937772A',
      },
    ],
    currentSensor: '',
    isReady: false,
    checkImg: '/assets/img/base/check.png',
    uncheckImg: '/assets/img/base/uncheck.png',
  },

  computed: {
    currentGuide(data) {
      if (!data.currentSensor) {
        return {}
      }
      return data.deviceList.find((device) => device.sn8 === data.currentSensor)
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async onLoad(query: { sn8: string }) {
      if (query?.sn8) {
        console.log(query.sn8)
        this.setData({
          currentSensor: query.sn8,
        })
      }
    },
    onReadyClick() {
      this.setData({
        isReady: !this.data.isReady,
      })
    },
    handleNextStep() {
      // const gatewayId = this.data.selectGatewayId,
      // gatewaySn = this.data.selectGatewaySn

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/search-subdevice/index', {
          // gatewayId,
          // gatewaySn,
        }),
      })
    },
  },
})
