/**
 * 设备选型相关接口
 */
const app = getApp() //获取应用实例
import { requestService } from '../../../../utils/requestService'
import { getStamp, getReqId } from 'm-utilsdk/index'
const WX_LOG = require('../../../../utils/log')
var selectDevice = {
  /**
   * 返回查询设备列表，大类，点击选型后显示的数据
   */
  getQueryBrandCategory() {
    return new Promise((resolve, reject) => {
      let param = {
        stamp: getStamp(),
        reqId: getReqId(),
      }
      requestService
        .request('getQueryBrandCategory', param)
        .then((res) => {
          let productList = res.data.data.list.filter((arr) => {
            return arr.list0.length
          })
          WX_LOG.info('查询设备列表，大类成功', 'getQueryBrandCategory')
          resolve(productList)
        })
        .catch((error) => {
          WX_LOG.error('查询设备列表，大类失败', 'getQueryBrandCategory', error)
          reject(error)
        })
    })
  },
  /**
   * 选择对应大类设备型号列表,在选型页面，点击某个大类，返回的设备型号列表
   * 测试用例：
   * params = {
        pageNum: 1,
        productList: {},
        subCode: 'D1X1'
      }
   * @param {*} str 
   * @param {*} params 
   */
  getQueryIotProductV2(str, params) {
    return new Promise((resolve, reject) => {
      let { pageNum, productList, subCode } = params
      let param = {
        subCode,
        pageSize: '20',
        page: pageNum,
        brand: brandStyle.brand == 'meiju' ? '' : brandStyle.brand,
        stamp: getStamp(),
        reqId: getReqId(),
      }
      requestService
        .request('getQueryIotProductV2', param)
        .then((res) => {
          let currList = res.data.data.list || []
          let hasNextPage = res.data.data.hasNextPage
          if (!currList.length) {
            WX_LOG.warn('设备型号列表二级目录失败', 'getQueryIotProductV2', res)
            reject()
          }
          let currProduct = str != 'next' ? currList : [...productList, ...currList]
          WX_LOG.info('设备型号列表二级目录成功', 'getQueryIotProductV2')
          resolve({
            productList: currProduct,
            loadFlag: true,
            hasNext: hasNextPage,
          })
        })
        .catch((error) => {
          self.setData({
            hasNext: false,
            loadFlag: true,
          })
          WX_LOG.error('设备型号列表二级目录失败', 'getQueryIotProductV2', error)
        })
    })
  },
}

module.exports = {
  selectDevice,
}
