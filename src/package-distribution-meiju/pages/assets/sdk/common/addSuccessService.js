import { queryAuthGetStatus } from '../../../../../apis/index'
import { homeStore } from '../../../../../store/index'

const addSuccessService = {
  /**
   * 查询确权情况
   * @param {*} applianceCode
   */
  async getApplianceAuthType(applianceCode) {
    console.debug('addSuccessService-getApplianceAuthType')
    const res = await queryAuthGetStatus({ houseId: homeStore.currentHomeId, deviceId: applianceCode })

    return res
  },
}

module.exports = {
  addSuccessService,
}
