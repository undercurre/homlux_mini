/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * 设备添加成功页相关接口
 */
import { requestService } from '../../../../utils/requestService'
import { getStamp, getReqId } from 'm-utilsdk/index'
const WX_LOG = require('../../../../utils/log')

//模拟数据
const isMock = false

const addSuccessService = {
  /**
   * 查询确权情况
   * @param {*} applianceCode
   */
  getApplianceAuthType(applianceCode) {
    return new Promise((resolve, reject) => {
      let reqData = {
        applianceCode: applianceCode,
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('getApplianceAuthType', reqData)
        .then((resp) => {
          WX_LOG.info('获取设备确权状态正常', 'getApplianceAuthType')
          resolve(resp)
        })
        .catch((error) => {
          WX_LOG.error('获取设备确权状态异常', 'getApplianceAuthType', error)
          reject(error)
        })
    })
  },
  /**
   * 设置默认家庭
   * @param {*} homegroupId
   */
  homegroupDefaultSetService(homegroupId) {
    //设置默认家庭
    return new Promise((resolve, reject) => {
      if (isMock) {
        let resp = {
          data: mockData.homegroupDefaultSet,
        }
        if (resp.data.code == 0) {
          resolve()
        } else {
          reject(resp)
        }
        return
      }

      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
        homegroupId: homegroupId,
      }
      requestService.request('homegroupDefaultSet', reqData).then(
        (resp) => {
          if (resp.data.code == 0) {
            WX_LOG.info('设置默认家庭正常', 'homegroupDefaultSet')
            resolve(resp)
          } else {
            WX_LOG.warn('设置默认家庭异常', 'homegroupDefaultSet', resp)
            reject(resp)
          }
        },
        (error) => {
          WX_LOG.error('设置默认家庭异常', 'homegroupDefaultSet', error)
          reject(error)
        },
      )
    })
  },
  /**
   * 修改绑定设备信息参数
   * @param {*} applianceCode
   * @param {*} homegroupId
   * @param {*} roomId
   * @param {*} applianceName
   */
  homeModify(applianceCode, homegroupId, roomId, applianceName) {
    return new Promise((resolve, reject) => {
      let params = {
        reqId: getReqId(),
        stamp: getStamp(),
        applianceCode: applianceCode,
        homegroupId: homegroupId,
        roomId: roomId,
        applianceName: applianceName,
      }
      requestService
        .request('homeModify', params, 'POST', '', 3000)
        .then((resp) => {
          if (resp.data.code == 0) {
            WX_LOG.info('修改绑定设备信息参数', 'homeModify')
            resolve(resp)
          } else {
            WX_LOG.warn('修改设备绑定信息失败', 'homeModify', resp)
            reject(resp)
          }
        })
        .catch((error) => {
          WX_LOG.error('修改设备绑定信息失败', 'homeModify', error)
          reject(error)
        })
    })
  },
  /**
   * 参数格式
   * bindInfo = {
        applianceName: this.data.deviceName,
        homegroupId: this.data.currentHomeGroupId,
        roomId: this.data.currentRoomId,
        sn: sn,
        applianceType: applianceType,
        btMac: btMac,
        modelNumber: '',
      }
   * 遥控器设备绑定 {applianceName,sn,applianceType,mac,modelNumber,homegroupId}
   * @param {*} bindInfo 
   */
  bindRemoteDevice(bindInfo) {
    return new Promise((resolve, reject) => {
      if (isMock) {
        let resp = {
          data: mockData.bindRemoteDeviceResp,
        }
        if (resp.data.code == 0) {
          resolve(resp.data.data || {})
        } else {
          reject(resp)
        }
        return
      }
      let defaultData = {
        reqId: getReqId(),
        stamp: getStamp(),
      }
      let reqData = Object.assign(defaultData, bindInfo)
      requestService.request('bindRemoteDevice', reqData).then(
        (resp) => {
          if (resp.data.code == 0) {
            WX_LOG.info('遥控器设备绑定正常', 'bindRemoteDevice')
            resolve(resp.data.data || {})
          } else {
            WX_LOG.warn('遥控器设备绑定异常', 'bindRemoteDevice', resp)
            reject(resp)
          }
        },
        (error) => {
          WX_LOG.error('遥控器设备绑定异常', 'bindRemoteDevice', error)
          reject(error)
        },
      )
    })
  },
}

module.exports = {
  addSuccessService,
}
