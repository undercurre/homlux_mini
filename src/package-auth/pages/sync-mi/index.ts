import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { delay, Logger, storage } from '../../../utils/index'
import { getToken } from '../../../apis/index'
import { deviceStore } from '../../../store/index'
import { SCREEN_PID } from '../../../config/index'

ComponentWithComputed({
  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    gatewayList: [] as Device.DeviceItem[],
    listHeight: 0,
    loading: false,
    checkIndex: 0, // 选择的家庭index
    miHomeMenu: {
      x: '30rpx',
      y: (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 160 + 'px',
      arrowX: 100,
      width: 400,
      height: 300,
      isShow: false,
    },
    miHomeList: [
      {
        name: '2483的家',
        checked: true,
        tag: '创建',
      },
      {
        name: 'xxxx的家',
      },
      {
        name: 'yyyy的家',
      },
      {
        name: 'zzzz的家',
      },
    ],
  },

  computed: {},

  methods: {
    async onLoad(query: { code: string }) {
      console.log('[onLoad]sync-mi, query.code ===', query.code)

      const res = await getToken(query.code).catch((err) => {
        Logger.error(err)
      })

      console.log('[onLoad] getToken', res)
      this.setData({
        gatewayList: deviceStore.allRoomDeviceList
          ?.filter((device) => device.deviceType === 1 && !SCREEN_PID.includes(device.productId))
          .map((device) => ({
            ...device,
            checked: true,
            auth: true,
          })),
      })

      await delay(500)
      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              listHeight: res[0].height - 20,
            })
          }
        })
    },

    onCheckHome() {
      this.setData({
        'miHomeMenu.isShow': true,
      })
    },

    handleMenuTap() {
      this.setData({
        'miHomeMenu.isShow': false,
      })
    },
    handleMenuClose() {
      this.setData({
        'miHomeMenu.isShow': false,
      })
    },

    async toConfirm() {},
  },
})
