import { getTimeStamp, getReqId, getStamp } from 'm-utilsdk/index'
import { requestService } from '../../../utils/requestService'

//模拟数据
const isMock = false

//是否模拟设备列表
const isMockDevicelist = false
import { mockData } from 'mockData'

const service = {
  getHomeGrouplistService: () => {
    //获取家庭列表
    return new Promise((resolve, reject) => {
      if (isMock) {
        let resp = {
          data: mockData.homeList,
        }

        if (resp.data.code == 0) {
          resolve(resp.data.data.homeList)
        } else {
          reject(resp)
        }
        return
      }

      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService.request('homeList', reqData).then(
        (resp) => {
          if (resp.data.code == 0) {
            resolve(resp.data.data.homeList)
          } else {
            reject(resp)
          }
        },
        (error) => {
          reject(error)
        },
      )
    })
  },
  getApplianceHomeDataService(homegroupId) {
    //获取当前家庭设备列表
    return new Promise((resolve, reject) => {
      if (isMockDevicelist) {
        let resp = {
          data: mockData.deviceList,
        }
        if (resp.data.code == 0) {
          resolve(resp.data.data || {})
        } else {
          reject(resp)
        }
        return
      }

      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
        // "homegroupId": homegroupId,
        cardType: [
          {
            type: 'appliance',
            query: {
              homegroupId: homegroupId,
            },
            extra: ['uiTemplate', 'nfcDetail', 'status', 'cardOrder'],
          },
          {
            type: 'bluetooth',
            query: {
              homegroupId: homegroupId,
            },
          },
          {
            type: 'notActive',
            query: {
              homegroupId: homegroupId,
            },
          },
          {
            type: 'applianceType',
            query: {
              homegroupId: homegroupId,
            },
          },
        ],
      }
      requestService.request('applianceListAggregate', reqData).then(
        (resp) => {
          if (resp.data.code == 0) {
            resolve(resp.data.data)
          } else {
            reject(resp)
          }
        },
        (error) => {
          reject(error)
        },
      )
    })
  },
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
            resolve()
          } else {
            reject(resp)
          }
        },
        (error) => {
          reject(error)
        },
      )
    })
  },
  getHomeGroupMemberStatus(homegroupId) {
    return new Promise((resolve, reject) => {
      requestService
        .request('homegroupMemberCheck', {
          reqId: getReqId(),
          stamp: getStamp(),
          homegroupId,
        })
        .then((res) => {
          if (res?.data?.code === 0) {
            resolve(res?.data?.data)
          } else {
            reject(res)
          }
        })
        .catch((e) => {
          reject(e)
        })
    })
  },
  //设备确权状态
  getApplianceAuthType(applianceCode) {
    let reqData = {
      applianceCode: applianceCode,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('getApplianceAuthType', reqData)
        .then((resp) => {
          console.log('查询确权状态', resp)
          resolve(resp)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  getIotDeviceV3() {
    let reqData = {
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('getIotDeviceV3', reqData)
        .then((resp) => {
          resolve(resp)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  // 获取非智能设备
  getNonIntelligentIotDeviceV(homegroupId) {
    let reqData = {
      homegroupId: homegroupId,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('getNonIntelligentIotDeviceV', reqData)
        .then((resp) => {
          resolve(resp)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  //加入家庭的分享码校验
  verifyInviteCode(param) {
    let reqData = {
      reqId: getReqId(),
      stamp: getStamp(),
      invitationCode: param.invitationCode,
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('verifyInviteCode', reqData)
        .then((resp) => {
          console.log('servivce加入家庭的分享码校验成功', resp)
          resolve(resp)
        })
        .catch((error) => {
          console.log('servivce加入家庭的分享码校验失败', error)
          reject(error)
        })
    })
  },
  //删除非智设备
  deleteNormalDevice(param) {
    let reqData = {
      param: param,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('deleteNormalDevice', reqData)
        .then((resp) => {
          console.log('feizhiservivce删除设备成功', resp)
          resolve(resp)
        })
        .catch((error) => {
          console.log('feizhiservivce删除设备失败', error)
          reject(error)
        })
    })
  },
  //修改智能设备名称
  editAppliance(param) {
    let reqData = {
      applianceCode: param.applianceCode,
      isOtherEquipment: param.isOtherEquipment,
      applianceName: param.applianceName,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('editApplicance', reqData)
        .then((resp) => {
          console.log('servivce修改设备名称成功', resp)
          resolve(resp)
        })
        .catch((error) => {
          console.log('servivce修改设备名称失败', error)
          reject(error)
        })
    })
  },
  //修改非智设备名称
  editNormalAppliance(param) {
    let reqData = {
      homegroupId: param.homegroupId,
      productModel: param.productModel,
      name: param.name,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('editNormalDevice', reqData)
        .then((resp) => {
          console.log('feizhiservivce修改设备名称成功', resp)
          resolve(resp)
        })
        .catch((error) => {
          console.log('feizhiservivce修改设备名称失败', error)
          reject(error)
        })
    })
  },
  //发送家庭点击邀请标识
  sendHomeGroupItemIsRead(param) {
    let reqData = {
      homeGroupId: param.homegroupId,
      unread: param.unread,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('sendHomeGroupItemIsRead', reqData)
        .then((resp) => {
          resolve(resp)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  //校验从nfc过来的数据
  fromNfcAction(options) {
    const query = options.query
    const data = {
      uuid: query.nfcid || '',
      randomCode: query.rc || '',
      reqId: getReqId(),
      stamp: getTimeStamp(new Date()),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('nfcBindGet', data)
        .then((res) => {
          console.log('nfc 获取设备绑定的详情1', res.data.data)
          resolve(res)
        })
        .catch((err) => {
          console.log('nfc 获取设备绑定的详情2', err)
          reject(err)
        })
    })
  },
  //申请加入家庭
  joinDend(param) {
    const data = {
      uid: param.uid || '',
      homegroupId: param.homegroupId || '',
      reqId: getReqId(),
      stamp: getTimeStamp(new Date()),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('joinDend', data)
        .then((res) => {
          resolve(res.data.data)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  //获取已购待绑定设备信息
  getNotActiveDevices(homegroupId) {
    let reqData = {
      reqId: getReqId(),
      stamp: getStamp(),
      cardType: [
        {
          type: 'notActive',
          query: {
            homegroupId: homegroupId,
          },
        },
        {
          type: 'applianceType',
          query: {
            homegroupId: homegroupId,
          },
        },
      ],
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('applianceListAggregate', reqData)
        .then((resp) => {
          if (resp.data.code == 0) {
            resolve(resp.data.data)
          } else {
            reject(resp)
          }
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  //忽略已购待绑定设备
  ignoreAppliance(params) {
    let reqData = {
      businessType: params.businessType,
      stamp: getStamp(),
      reqId: getReqId(),
    }
    if (params.businessType == 1) {
      reqData.sn = params.sn
    } else if (params.businessType == 3) {
      reqData.applianceType = params.applianceType
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('ignoreAppliance', reqData)
        .then((resp) => {
          resolve(resp)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  //删除设备
  deleteAppliance(param) {
    let reqData = {
      applianceCode: param.applianceCode,
      isOtherEquipment: param.isOtherEquipment,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('deleteApplicance', reqData)
        .then((resp) => {
          console.log('servivce删除设备成功', resp)
          resolve(resp)
        })
        .catch((error) => {
          console.log('servivce删除设备失败', error)
          reject(error)
        })
    })
  },
}

function pad0(org, num) {
  org = org.toString()
  if (org.length >= num) {
    return org
  }
  var zero = ''
  for (var i = 0; i < num - org.length; i++) {
    zero += '0'
  }
  var all = zero + org
  return all
}
export { service, pad0 }
