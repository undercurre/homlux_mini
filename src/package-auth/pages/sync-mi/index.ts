import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { delay, Logger, storage } from '../../../utils/index'
import { getToken, miSync } from '../../../apis/index'
import { deviceStore, homeStore } from '../../../store/index'
import { SCREEN_PID } from '../../../config/index'
import Toast from '../../../skyline-components/mz-toast/toast'
import Dialog from '../../../skyline-components/mz-dialog/dialog'

ComponentWithComputed({
  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    gatewayList: [] as (Device.DeviceItem & { auth: boolean; checked: boolean })[],
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

  computed: {
    checkedIds(data) {
      return data.gatewayList.filter((d) => d.checked).map((d) => d.deviceId) ?? []
    },
  },

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
            checked: false,
            auth: false,
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
    onCheckGateway(e: WechatMiniprogram.CustomEvent) {
      const { index } = e.currentTarget.dataset
      const { checked } = this.data.gatewayList[index]
      this.setData({
        [`gatewayList[${index}].checked`]: !checked,
      })
    },

    async toConfirm() {
      const res = await miSync({
        bindKey: 'xxxbindKey',
        miHouseId: 'xxxmiHouseId',
        houseId: homeStore.currentHomeId,
        uid: 'xxxuid',
        deviceId: this.data.checkedIds,
      })
      if (!res.success) {
        Dialog.confirm({
          context: this,
          title: '设备同步数据失败，请检查网络及网关设备是否正常？',
          confirmButtonText: '稍后重试',
          showCancelButton: false,
        }).catch(() => 'cancel')
      }

      Toast('同步成功')
    },
  },
})
