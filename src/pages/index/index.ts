import { ComponentWithComputed } from 'miniprogram-computed'
import { othersBinding, roomBinding, userBinding, homeBinding, deviceBinding, homeStore } from '../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { storage } from '../../utils/index'
import { proType } from '../../config/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { allDevicePowerControl } from '../../apis/index'
import { emitter } from '../../utils/eventBus'
import { updateDefaultHouse } from '../../apis/index'
let throttleTimer = 0
ComponentWithComputed({
  behaviors: [
    BehaviorWithStore({ storeBindings: [othersBinding, roomBinding, userBinding, homeBinding, deviceBinding] }),
  ],
  data: {
    dropdownMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
    selectHomeMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
    contentHeight: 0,
    allOnBtnTap: false,
    allOffBtnTap: false,
    showAddNewRoom: false,
    showHomeSelect: false,
    isRefresh: false,
  },
  computed: {
    currentHomeName(data) {
      if (data.currentHomeDetail) {
        return data.currentHomeDetail?.houseName ?? ''
      }
      return ''
    },
    // 家庭是否有设备
    hasDevice(data) {
      return data.allRoomDeviceList && data.allRoomDeviceList.length > 0
    },
    // 是否显示全局控制开关（需要有灯或者开关）
    isShowHomeControl(data) {
      let hasLightOrSwitch = false
      if (data.allRoomDeviceList) {
        data.allRoomDeviceList.some((device: Device.DeviceItem) => {
          if (([proType.light, proType.switch] as string[]).includes(device.proType)) {
            hasLightOrSwitch = true
            return true
          }
          return false
        })
      }
      return hasLightOrSwitch
    },
  },

  methods: {
    // 生命周期或者其他钩子
    onLoad: function () {
      // 更新tabbar状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 0,
        })
      }
      this.updateContentHeight()
    },
    onHide() {
      // 隐藏之前展示的下拉菜单
      this.hideMenu()
      emitter.off('wsReceive')
    },
    async onPullDownRefresh() {
      try {
        await homeStore.updateHomeInfo({ loading: true })
      } finally {
        this.setData({
          isRefresh: false,
        })
      }
    },

    onShow() {
      setTimeout(() => {
        this.inviteMember()
      }, 1000)
      if (homeStore.currentHomeId) {
        homeStore.updateRoomCardList()
      }
      emitter.off('wsReceive')
      emitter.on('wsReceive', () => {
        if (!throttleTimer) {
          throttleTimer = setTimeout(() => {
            homeStore.updateRoomCardList()
            throttleTimer = 0
          }, 500) as unknown as number
        }
      })
    },

    inviteMember() {
      const enterQuery = wx.getEnterOptionsSync().query
      const token = storage.get('token', '')
      const type = enterQuery.type as string
      const houseId = enterQuery.houseId as string
      const time = enterQuery.time as string
      if (token && type && houseId && time) {
        console.log(`lmn>>>邀请参数:token=${token}/type=${type}/houseId=${houseId}/time=${time}`)
        for (let i = 0; i < homeBinding.store.homeList.length; i++) {
          if (homeBinding.store.homeList[i].houseId == houseId) {
            console.log('lmn>>>已经在该家庭')
            return
          }
        }
        const now = new Date().valueOf()
        if (now - parseInt(time) > 86400000) {
          console.log('lmn>>>邀请超时')
          Dialog.confirm({
            title: '邀请过期',
            message: '该邀请已过期，请联系邀请者重新邀请',
            confirmButtonText: '我知道了',
          })
        } else {
          homeBinding.store
            .inviteMember(houseId, parseInt(type))
            .then(() => {
              console.log('lmn>>>邀请成功')
              updateDefaultHouse(houseId).finally(() => {
                homeBinding.store.updateHomeInfo().then(() => {
                  homeBinding.store.homeList.forEach((item) => {
                    if (item.houseId == houseId) {
                      Toast(`您已加入${item.houseName}的家`)
                      return
                    }
                  })
                  Toast('您已加入家庭')
                })
              })
            })
            .catch(() => {
              Toast('加入家庭失败')
            })
        }
      } else {
        console.log('lmn>>>无效邀请参数')
      }
    },

    // 收起所有菜单
    hideMenu() {
      // this.doHomeSelectArrowAnimation(false, this.data.selectHomeMenu.isShow)
      this.setData({
        'dropdownMenu.isShow': false,
        'selectHomeMenu.isShow': false,
      })
      // if (e && e.detail && e.detail.x) {
      //   wx.createSelectorQuery()
      //     .select('#addIcon')
      //     .boundingClientRect()
      //     .exec((res) => {
      //       // 点中加按钮以外的地方都要隐藏下拉菜单
      //       if (
      //         res[0] &&
      //         (e.detail.x > res[0].right ||
      //           e.detail.x < res[0].left ||
      //           e.detail.y > res[0].bottom ||
      //           e.detail.y < res[0].top)
      //       ) {
      //         this.setData({
      //           'dropdownMenu.isShow': false,
      //           'selectHomeMenu.isShow': false,
      //         })
      //       }
      //     })
      // } else {
      //   this.setData({
      //     'dropdownMenu.isShow': false,
      //     'selectHomeMenu.isShow': false,
      //   })
      // }
    },
    /**
     * 跳转到登录页
     */
    toLogin() {
      wx.navigateTo({
        url: '/pages/login/index',
      })
    },
    /**
     * 点击全屋开按钮
     */
    handleAllOn() {
      this.hideMenu()
      allDevicePowerControl({
        houseId: homeStore.currentHomeId,
        onOff: 1,
      })
      this.animate(
        `#all-on`,
        [
          {
            opacity: 0,
          },
          {
            opacity: 1,
          },
        ],
        30,
        () => {
          this.animate(
            `#all-on`,
            [
              {
                opacity: 1,
              },
              {
                opacity: 0,
              },
            ],
            60,
          )
        },
      )
    },
    /**
     * 点击全屋关按钮
     */
    handleAllOff() {
      this.hideMenu()
      allDevicePowerControl({ houseId: homeStore.currentHomeId, onOff: 0 })
      this.animate(
        `#all-off`,
        [
          {
            opacity: 0,
          },
          {
            opacity: 1,
          },
        ],
        30,
        () => {
          this.animate(
            `#all-off`,
            [
              {
                opacity: 1,
              },
              {
                opacity: 0,
              },
            ],
            60,
          )
        },
      )
    },
    /**
     * 点击加号按钮下拉
     */
    handleDropdown() {
      wx.createSelectorQuery()
        .select('#addIcon')
        .boundingClientRect()
        .exec((res) => {
          this.setData({
            dropdownMenu: {
              x: '20rpx',
              y: res[0].bottom + 10 + 'px',
              isShow: !this.data.dropdownMenu.isShow,
            },
            'selectHomeMenu.isShow': false,
          })
        })
    },
    handleAddDevice() {
      wx.navigateTo({ url: '/package-distribution/scan/index' })
    },
    /**
     * 用户点击下拉菜单项
     * @param e
     */
    handleMenuSelect(e: { detail: 'addDevice' | 'addRoom' | 'inviteFamily' }) {
      if (e.detail === 'addDevice') {
        this.handleAddDevice()
      } else if (e.detail === 'addRoom') {
        this.setData({
          showAddNewRoom: true,
        })
      } else if (e.detail === 'inviteFamily') {
        console.log(3)
      }
      this.setData({
        'dropdownMenu.isShow': false,
      })
    },
    /**
     * 用户切换家庭
     */
    handleHomeSelect() {
      // this.doHomeSelectArrowAnimation(false, this.data.selectHomeMenu.isShow)
      this.setData({
        'selectHomeMenu.isShow': false,
      })
    },
    /**
     * 用户点击展示/隐藏家庭选择
     */
    handleShowHomeSelectMenu() {
      // this.doHomeSelectArrowAnimation(!this.data.selectHomeMenu.isShow, this.data.selectHomeMenu.isShow)
      this.setData({
        selectHomeMenu: {
          x: '28rpx',
          y:
            (storage.get<number>('statusBarHeight') as number) +
            (storage.get<number>('navigationBarHeight') as number) +
            8 +
            'px',
          isShow: !this.data.selectHomeMenu.isShow,
        },
        'dropdownMenu.isShow': false,
      })
    },
    /**
     * 隐藏添加房间popup
     */
    handleHideAddNewRoom() {
      this.setData({
        showAddNewRoom: false,
      })
    },
    updateContentHeight() {
      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },
    doHomeSelectArrowAnimation(newValue: boolean, oldValue: boolean) {
      if (newValue === oldValue) {
        return
      }
      if (newValue) {
        this.animate(
          '#homeSelectArrow',
          [
            {
              rotateZ: 0,
            },
            {
              rotateZ: 180,
            },
          ],
          200,
        )
      } else {
        this.animate(
          '#homeSelectArrow',
          [
            {
              rotateZ: 180,
            },
            {
              rotateZ: 0,
            },
          ],
          200,
        )
      }
    },
  },
})
