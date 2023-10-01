import { requestService, rangersBurialPoint } from '../../../utils/requestService'
import { getStamp, getReqId, isEmptyObject } from 'm-utilsdk/index'
import { checkFamilyPermission, getFullPageUrl } from '../../../utils/util.js'
import { familyPermissionText } from '../../../common/js/commonText.js'
const app = getApp()

// eslint-disable-next-line no-undef
module.exports = Behavior({
  behaviors: [],
  properties: {},
  data: {
    homeList: [],
  },
  attached: function () {},
  methods: {
    //获取用户家庭
    getHomeGroup() {
      return new Promise((resolve, reject) => {
        if (this.data.homeList && this.data.homeList.length) {
          resolve(this.data.homeList)
        } else {
          let reqData = {
            reqId: getReqId(),
            stamp: getStamp(),
          }
          requestService.request('homeList', reqData).then(
            (resp) => {
              this.data.homeList = resp.data.data.homeList
              resolve(resp.data.data.homeList)
            },
            (error) => {
              reject(error)
            },
          )
        }
      })
    },
    // 校验家庭权限
    checkFamilyPermission(currentHomeInfo, deviceInfo) {
      console.log(app.globalData.deviceSessionId, app.globalData.addDeviceInfo, app.addDeviceInfo, '权限')
      return new Promise((resolve) => {
        if (currentHomeInfo && !isEmptyObject(currentHomeInfo)) {
          const hasFamilyPermission = checkFamilyPermission({
            currentHomeInfo,
            permissionText: familyPermissionText.distributionNetwork,
            callback: () => {
              wx.switchTab({
                url: '/pages/index/index',
              })
            },
          })
          if (!hasFamilyPermission) {
            this.checkFamilyPermissionBurialPoint(deviceInfo)
          }
          resolve(hasFamilyPermission)
        } else {
          this.getHomeGroup().then((res) => {
            const homeList = res
            const currentHomeInfo = homeList[0]
            const hasFamilyPermission = checkFamilyPermission({
              currentHomeInfo,
              permissionText: familyPermissionText.distributionNetwork,
              callback: () => {
                wx.switchTab({
                  url: '/pages/index/index',
                })
              },
            })
            if (!hasFamilyPermission) {
              this.checkFamilyPermissionBurialPoint(deviceInfo)
            }
            resolve(hasFamilyPermission)
          })
        }
      })
    },
    checkFamilyPermissionBurialPoint() {
      const deviceInfo = app.addDeviceInfo
      const deviceSessionId = app.globalData && app.globalData.deviceSessionId
      rangersBurialPoint('user_page_view', {
        page_path: getFullPageUrl(),
        module: '设备卡片',
        page_id: 'pop_ord_memb_no_autr_add_appliance',
        page_name: '普通成员无权限添加设备弹窗',
        device_info: {
          device_session_id: deviceSessionId, //一次配网事件标识
          sn: deviceInfo && deviceInfo.sn, //sn码
          sn8: deviceInfo && deviceInfo.sn8, //sn8码
          a0: deviceInfo && deviceInfo.a0, //a0码
          widget_cate: deviceInfo && deviceInfo.type, //设备品类
          wifi_model_version: (deviceInfo && deviceInfo.moduleVersion) || (deviceInfo && deviceInfo.blueVersion), //模组wifi版本
          link_type: (deviceInfo && deviceInfo.linkType) || '', //连接方式 bluetooth/ap/...
          iot_device_id: deviceInfo && deviceInfo.applianceCode, //设备id
        },
      })
    },
  },
})
