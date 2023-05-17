import { ComponentWithComputed } from 'miniprogram-computed'
import {
  othersBinding,
  roomBinding,
  userBinding,
  homeBinding,
  deviceBinding,
  homeStore,
  othersStore,
  roomStore,
  deviceStore,
} from '../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { storage } from '../../utils/index'
import { proType } from '../../config/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { allDevicePowerControl } from '../../apis/index'
import { emitter } from '../../utils/eventBus'
import { updateDefaultHouse } from '../../apis/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { runInAction } from 'mobx-miniprogram'
let throttleTimer = 0
let hasUpdateInTimer = false
ComponentWithComputed({
  behaviors: [
    BehaviorWithStore({ storeBindings: [othersBinding, roomBinding, userBinding, homeBinding, deviceBinding] }),
    pageBehavior,
  ],
  data: {
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    // 状态栏高度
    statusBarHeight: storage.get<number>('statusBarHeight') + 'px',
    selectHomeMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
    allOnBtnTap: false,
    allOffBtnTap: false,
    showAddNewRoom: false,
    showHomeSelect: false,
    loading: true,
    isTryInvite: false,
  },
  computed: {
    currentHomeName(data) {
      if (data.currentHomeDetail && data.currentHomeDetail.houseName) {
        if (data.currentHomeDetail.houseName.length > 6) {
          return data.currentHomeDetail.houseName.slice(0, 6) + '...'
        }
        return data.currentHomeDetail?.houseName
      }
      return ''
    },
    // 家庭是否有设备
    hasDevice(data) {
      if (data.allRoomDeviceList) {
        return data.allRoomDeviceList.length
      }
      return false
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
    // 判断是否是创建者或者管理员，其他角色不能添加设备
    canAddDevice(data) {
      return data.isCreator || data.isAdmin
    },
  },
  watch: {
    isInit(data) {
      if (data) {
        this.animate(
          '#skeleton',
          [
            {
              opacity: 1,
            },
            {
              opacity: 0,
            },
          ],
          200,
          () => {
            this.setData({
              loading: false,
            })
          },
        )
      }
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
      if (othersStore.isInit) {
        this.setData({
          loading: false,
        })
      }
    },
    onHide() {
      // 隐藏之前展示的下拉菜单
      this.hideMenu()
      emitter.off('wsReceive')
    },
    onShow() {
      setTimeout(() => {
        this.inviteMember()
      }, 1000)
      if (homeStore.currentHomeId) {
        homeStore.updateRoomCardList()
      }
      if (!othersStore.isInit) {
        this.setData({
          loading: true,
        })
      }
      emitter.off('wsReceive')
      emitter.on('wsReceive', (res) => {
        if (res.result.eventType === 'device_property') {
          // 如果有传更新的状态数据过来，直接更新store
          if (res.result.eventData.event && res.result.eventData.deviceId && res.result.eventData.ep) {
            const device = deviceStore.allRoomDeviceList.find(
              (device) => device.deviceId === res.result.eventData.deviceId,
            )
            if (device) {
              device.mzgdPropertyDTOList[res.result.eventData.ep] = {
                ...device.mzgdPropertyDTOList[res.result.eventData.ep],
                ...res.result.eventData.event,
              }
              if (!throttleTimer) {
                roomStore.updateRoomCardLightOnNum()
                throttleTimer = setTimeout(async () => {
                  if (hasUpdateInTimer) {
                    roomStore.updateRoomCardLightOnNum()
                    hasUpdateInTimer = false
                  }
                  throttleTimer = 0
                }, 300)
              } else {
                hasUpdateInTimer = true
              }
              // 直接更新store里的数据，更新完退出回调函数
              return
            }
          }
        }
        // FIXME ws消息很多，除了connect_success_status外还应该过滤一下
        if (!throttleTimer && res.result.eventType !== 'connect_success_status') {
          homeStore.updateRoomCardList()
          throttleTimer = setTimeout(async () => {
            if (hasUpdateInTimer) {
              homeStore.updateRoomCardList()
              hasUpdateInTimer = false
            }
            throttleTimer = 0
          }, 3000)
        } else if (res.result.eventType !== 'connect_success_status') {
          hasUpdateInTimer = true
        }
      })
      // 房间选择恢复默认
      if (roomStore.currentRoomIndex) {
        runInAction(() => {
          roomStore.currentRoomIndex = 0
        })
      }
    },

    inviteMember() {
      if (wx.getEnterOptionsSync().scene != 1044) {
        console.log('lmn>>>非卡片进入')
        return
      }
      if (this.data.isTryInvite) {
        console.log('lmn>>>已尝试过邀请')
        return
      }
      const enterQuery = wx.getEnterOptionsSync().query
      const token = storage.get('token', '')
      const type = enterQuery.type as string
      const houseId = enterQuery.houseId as string
      const time = enterQuery.time as string
      const shareId = enterQuery.shareId as string
      if (token && type && houseId && time) {
        this.setData({
          isTryInvite: true,
        })
        console.log(`lmn>>>邀请参数:token=${token}/type=${type}/houseId=${houseId}/time=${time}/shareId=${shareId}`)
        for (let i = 0; i < homeBinding.store.homeList.length; i++) {
          if (homeBinding.store.homeList[i].houseId == houseId) {
            console.log('lmn>>>已经在该家庭')
            return
          }
        }
        const now = new Date().valueOf()
        if (now - parseInt(time) > 300000) {
          //86400000
          console.log('lmn>>>邀请超时')
          Dialog.confirm({
            title: '邀请过期',
            message: '该邀请已过期，请联系邀请者重新邀请',
            confirmButtonText: '我知道了',
            zIndex: 9999,
          })
        } else {
          homeBinding.store
            .inviteMember(houseId, parseInt(type), shareId)
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
      this.setData({
        'selectHomeMenu.isShow': false,
      })
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
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      allDevicePowerControl({
        houseId: homeStore.currentHomeId,
        onOff: 1,
      })
    },
    /**
     * 点击全屋关按钮
     */
    handleAllOff() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      allDevicePowerControl({ houseId: homeStore.currentHomeId, onOff: 0 })
    },
    /**
     * 用户切换家庭
     */
    handleHomeSelect() {
      this.setData({
        'selectHomeMenu.isShow': false,
      })
    },
    /**
     * 用户点击展示/隐藏家庭选择
     */
    handleShowHomeSelectMenu() {
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
  },
})
