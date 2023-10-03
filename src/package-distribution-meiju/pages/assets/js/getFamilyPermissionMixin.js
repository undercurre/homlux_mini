import { requestService } from '../../../utils/requestService'
import { getStamp, getReqId } from 'm-utilsdk/index'

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
  },
})
