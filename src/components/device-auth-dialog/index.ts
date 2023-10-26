import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { ComponentWithComputed } from 'miniprogram-computed'
import { confirmDeviceAuth, queryAuthGetStatus, queryDeviceSpecifiedInfo } from '../../apis/index'
import { homeStore } from '../../store/index'

let secondTimeId = 0 // 倒计时器
const second = 10 // 倒计时时长

ComponentWithComputed({
  /**
   * 组件的属性列表
   */
  properties: {
    isShow: {
      type: Boolean,
      value: false,
    },
    deviceId: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isShowRetryButton: true,
    confirmImgUrl: '',
    confirmDesc: '',
    time: 0,
  },

  computed: {
    title(data) {
      let str = '请按指引完成设置'

      if (data.time > 0) {
        str = str + `（${data.time}s）`
      }

      return str
    },
  },

  observers: {
    'isShow, deviceId': function (isShow, deviceId) {
      if (isShow) {
        Dialog.confirm({
          context: this,
          cancelButtonText: '暂不设置',
          confirmButtonText: '重试',
          beforeClose(action: string) {
            console.log('beforeClose', action)
            return new Promise((resolve) => {
              if (action === 'confirm') {
                resolve(false)
              } else {
                // 拦截取消操作
                resolve(false)
              }
            })
          },
        }).catch(() => 'cancel')
      } else {
        Dialog.close()
      }

      if (isShow && deviceId) {
        this.init()
      } else {
        clearInterval(secondTimeId)
      }
    },
  },

  lifetimes: {
    detached() {
      console.log('device-auth-dialog   detached')
      clearInterval(secondTimeId)
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async init() {
      const guideInfoRes = await queryDeviceSpecifiedInfo({
        houseId: homeStore.currentHomeId,
        deviceId: this.data.deviceId,
      })

      if (!guideInfoRes.success) {
        Toast({ message: '查询确权指引失败', zIndex: 9999 })
        return
      }

      this.setData({
        confirmImgUrl: guideInfoRes.result.confirmImgUrl,
        confirmDesc: this.guideDescFomat(guideInfoRes.result.confirmDesc),
      })

      this.startAuth()
    },

    async queryAuthGetStatus() {
      const res = await queryAuthGetStatus({ houseId: homeStore.currentHomeId, deviceId: this.data.deviceId })

      // 弹框取消后或者倒计时结束，取消轮询确权状态
      if (!res.success || this.data.time <= 0 || !this.data.isShow) {
        return
      }

      if (res.result.status === 0) {
        Toast({ message: '确权成功', zIndex: 9999 })
        this.triggerEvent('success')
        clearInterval(secondTimeId)
        return
      }

      setTimeout(() => {
        this.queryAuthGetStatus()
      }, 3000)
    },

    /**
     * 取消确权
     */
    cancel() {
      console.log('cancel')
      this.triggerEvent('cancel')
      this.setData({
        time: 0,
      })
      clearInterval(secondTimeId)
    },
    /**
     * 开始确权流程
     */
    async startAuth() {
      console.log('startAuth')
      this.setData({
        time: second,
        isShowRetryButton: false,
      })

      const confirmRes = await confirmDeviceAuth({ houseId: homeStore.currentHomeId, deviceId: this.data.deviceId })

      if (!confirmRes.success) {
        Toast({ message: '下发进入确权指令失败', zIndex: 9999 })
        return
      }

      this.queryAuthGetStatus()

      secondTimeId = setInterval(() => {
        this.setData({
          time: this.data.time - 1,
        })

        if (this.data.time <= 0) {
          clearInterval(secondTimeId)
          this.setData({
            isShowRetryButton: true,
          })
        }
      }, 1000)

      return false
    },

    //指引文案格式化显示
    guideDescFomat(guideDesc: string) {
      guideDesc = guideDesc.replace(/\n/g, '<br/>') //换行
      guideDesc = guideDesc.replace(/「(.+?)」/g, '<span class="orange-display-txt">$1</span>') //标澄
      guideDesc = guideDesc.replace(/#([a-zA-Z0-9]+?)#/g, '<span class="orange-display-txt digitalFont">$1</span>') //数码管字体
      return guideDesc
    },
  },
})
