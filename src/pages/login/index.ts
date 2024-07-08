import Toast from '../../skyline-components/mz-toast/toast'
import { login, saveWxSubscribe } from '../../apis/index'
import { homeStore, othersStore, sceneStore, userStore } from '../../store/index'
import { storage, showLoading, hideLoading, Logger } from '../../utils/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { LOGIN_TEMPLATE_ID_LIST } from '../../config/index'

// pages/login/index.ts
Component({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    isAgree: false,
    checkImg: '/assets/img/base/check.png',
    uncheckImg: '/assets/img/base/uncheck.png',
    marginTop: 0,
    _hasRequestSubscribeMessage: false,
    _tmplIds: [] as string[], // 已经授权成功的模板列表
  },

  methods: {
    onLoad() {
      const navigationBarAndStatusBarHeight =
        (storage.get<number>('statusBarHeight') as number) + (storage.get<number>('navigationBarHeight') as number)
      this.setData({
        marginTop: 200 - navigationBarAndStatusBarHeight,
      })
    },

    async handleLoginTap() {
      if (!this.data.isAgree) {
        Toast('请同意协议')
        return
      }

      const msgRes = await wx
        .requestSubscribeMessage({
          tmplIds: LOGIN_TEMPLATE_ID_LIST,
        })
        .catch((err) => err)

      Logger.debug('requestSubscribeMessage', msgRes)

      this.data._hasRequestSubscribeMessage = true

      // 订阅通过需要记录授权的模板id，用于登录后记录到云端
      if (msgRes.errMsg.includes('ok')) {
        for (const key in msgRes) {
          if (msgRes[key] === 'accept') {
            this.data._tmplIds.push(key)
          }
        }
      }

      this.saveWxSubscribe()
    },

    async saveWxSubscribe() {
      Logger.debug('saveWxSubscribe')
      if (userStore.openId && this.data._hasRequestSubscribeMessage) {
        const res = await saveWxSubscribe({ openId: userStore.openId, templateIdList: this.data._tmplIds })

        Logger.debug('saveWxSubscribe', res)
      }
    },

    handleLoginClick(e: { detail: { code: string } & { detail: { code: string } } }) {
      console.log('handleLoginClick', e)
      const code = e.detail.code || e.detail.detail.code // 微信bug，兼容skyline模式，返回的detail数据结构不一致

      if (!code) {
        Toast('取消登录')
        return
      }

      showLoading()

      wx.login({
        success: (res) => {
          console.log('login', res, e)
          if (res.code) {
            wx.getFuzzyLocation({
              type: 'wgs84',
              complete: async (locationRes: IAnyObject) => {
                console.log('getFuzzyLocation-complete', locationRes)
                const params = {
                  jsCode: res.code,
                  code: code,
                }

                if (!locationRes.errno) {
                  Object.assign(params, { lat: locationRes.latitude, lon: locationRes.longitude })
                }

                await this.login(params)

                hideLoading()
              },
            })
          } else {
            Toast('登录失败！')
            console.log('登录失败！' + res.errMsg)
            hideLoading()
          }
        },
        fail(err) {
          Logger.error('wx.login-error', err)
          hideLoading()
        },
      })
    },

    async login(data: { jsCode: string; code: string; lat?: number; lon?: number }) {
      const loginRes = await login(data)
      if (loginRes.success && loginRes.result) {
        Logger.log('loginRes', loginRes)
        storage.set('token', loginRes.result.token, null)
        userStore.openId = loginRes.result.openId

        this.saveWxSubscribe()
        await userStore.updateUserInfo()
        userStore.setIsLogin(true)
        othersStore.setIsInit(false)
        homeStore.homeInit()
        sceneStore.updateAllRoomSceneList()

        wx.switchTab({
          url: '/pages/index/index',
        })
      } else {
        Toast('登录失败！')
      }
    },

    onAgreeClick(event: { detail: boolean }) {
      console.log('onAgreeClick', event)

      this.setData({
        isAgree: event.detail,
      })
    },

    toPage(e: WechatMiniprogram.TouchEvent) {
      wx.navigateTo({
        url: '/package-about/pages/protocol-show/index?protocal=' + e.currentTarget.dataset.value,
      })
    },
  },
})
