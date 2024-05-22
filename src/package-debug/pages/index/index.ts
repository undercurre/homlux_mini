import { allDevicePowerControl } from '../../../apis/index'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { homeStore } from '../../../store/index'
import {
  storage,
  setCurrentEnv,
  logout,
  startWebsocketService,
  closeWebSocket,
  isWsConnected,
  Logger,
} from '../../../utils/index'

let auto_timer = null as number | null

Component({
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    envVersion: 'release', // 当前小程序版本，体验版or 正式环境
    curEnv: 'prod', // 当前选择的云端环境
    version: '', // 生产环境版本号
    isWsOn: isWsConnected(),
    showPerfLog: (storage.get('show_perf_log') as boolean) ?? false,
    count: 0, // 第N次执行
  },

  lifetimes: {
    ready() {
      const info = wx.getAccountInfoSync()

      this.setData({
        envVersion: info.miniProgram.envVersion,
        curEnv: storage.get(`${info.miniProgram.envVersion}_env`) as string,
        version: info.miniProgram.version,
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    onUnload() {
      console.log('[debug page unload]')
      if (auto_timer) {
        clearInterval(auto_timer)
        auto_timer = null
      }
    },

    /**
     * 切换云端环境，开发用
     */
    toggleEnv() {
      const envList = ['dev', 'sit', 'prod']
      wx.showActionSheet({
        itemList: envList,
        success: (res) => {
          console.log('showActionSheet', res)
          const env = envList[res.tapIndex] as 'dev' | 'sit' | 'prod'

          if (this.data.curEnv === env) {
            return
          }
          setCurrentEnv(env)

          logout()
        },
        fail(res) {
          console.log(res.errMsg)
        },
      })
    },
    toggleWs({ detail }: { detail: boolean }) {
      this.setData({ isWsOn: detail })
      if (detail) {
        startWebsocketService()
      } else {
        closeWebSocket()
      }
    },
    togglePerfLog({ detail }: { detail: boolean }) {
      this.setData({ showPerfLog: detail })
      storage.set('show_perf_log', detail, null)
    },
    // 调试用，自动执行全开全关
    trailFunc(MAX_COUNT = 20) {
      const INTERVAL = 5000
      auto_timer = setInterval(() => {
        this.setData({
          count: this.data.count + 1,
        })
        Logger.trace(`第${this.data.count + 1}次执行`)
        if (this.data.count > MAX_COUNT && auto_timer) {
          clearInterval(auto_timer)
          auto_timer = null
          this.setData({
            count: 0,
          })
        }

        allDevicePowerControl({ houseId: homeStore.currentHomeId, onOff: 1 })

        setTimeout(() => allDevicePowerControl({ houseId: homeStore.currentHomeId, onOff: 0 }), INTERVAL)
      }, INTERVAL * 2)
    },
    toggleTrials() {
      const length = 5
      const itemList = Array.from({ length }, (_, k) => `执行${(k + 1) * 10}次`)
      wx.showActionSheet({
        itemList,
        success: (res) => {
          const maxCount = (res.tapIndex + 1) * 10
          this.trailFunc(maxCount)
        },
        fail(res) {
          console.log(res.errMsg)
        },
      })
    },
  },
})
