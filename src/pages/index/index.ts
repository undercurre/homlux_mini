import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
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
import { storage, throttle, emitter, WSEventType, showLoading, hideLoading, strUtil } from '../../utils/index'
import { PRO_TYPE, ROOM_CARD_H, ROOM_CARD_M } from '../../config/index'
import { allDevicePowerControl, updateRoomSort, updateDefaultHouse, changeUserHouse } from '../../apis/index'
import pageBehavior from '../../behaviors/pageBehaviors'

type PosType = Record<'index' | 'y', number>

/**
 * 根据index计算坐标位置
 * @returns {x, y}
 */
function getPos(index: number): number {
  return index * ROOM_CARD_M
}

/**
 * 根据坐标位置计算index
 * TODO 防止超界
 * @returns index
 */
function getIndex(y: number) {
  const maxIndex = roomStore.roomList.length - 1 // 防止越界
  return Math.min(maxIndex, Math.floor((y + ROOM_CARD_M / 2) / ROOM_CARD_M))
}

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
    // 可滚动区域高度
    scrollViewHeight:
      (storage.get<number>('windowHeight') as number) -
      (storage.get<number>('statusBarHeight') as number) -
      (storage.get<number>('bottomBarHeight') as number) - // IPX
      90 - // 开关、添加按钮
      (storage.get<number>('navigationBarHeight') as number),
    selectHomeMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
    addMenu: {
      right: '0px',
      y: '0px',
      isShow: false,
    },
    allOnBtnTap: false,
    allOffBtnTap: false,
    showAddNewRoom: false,
    showHomeSelect: false,
    loading: true,
    isTryInvite: false,
    isMoving: false,
    hasMoved: false,
    roomPos: {} as Record<string, PosType>,
    accumulatedY: 0, // 可移动区域高度
    placeholder: {
      y: 0,
      index: -1,
    } as PosType,
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
          if (([PRO_TYPE.light, PRO_TYPE.switch] as string[]).includes(device.proType)) {
            hasLightOrSwitch = true
            return true
          }
          return false
        })
      }
      return hasLightOrSwitch
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
    roomList() {
      this.renewRoomPos()
    },
  },

  methods: {
    // 生命周期或者其他钩子
    onLoad: function () {
      console.debug('page-index-onLoad')

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

      this.accetHomeTransfer()
    },
    onHide() {
      // 隐藏之前展示的下拉菜单
      this.hideMenu()
      emitter.off('wsReceive')
    },
    async onShow() {
      setTimeout(() => {
        this.inviteMember()
      }, 1000)
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
              runInAction(() => {
                device.mzgdPropertyDTOList[res.result.eventData.ep] = {
                  ...device.mzgdPropertyDTOList[res.result.eventData.ep],
                  ...res.result.eventData.event,
                }
              })

              // 仅为本地更新，暂时取消节流
              this.updateRoomCard()

              // 直接更新store里的数据，更新完退出回调函数
              return
            }
          }
        }
        // Perf: ws消息很多，改用白名单过滤
        else if (
          [
            WSEventType.device_del,
            WSEventType.device_replace,
            WSEventType.device_online_status,
            WSEventType.device_offline_status,
            WSEventType.bind_device,
            WSEventType.scene_device_result_status,
            WSEventType.group_device_result_status,
            WSEventType.screen_move_sub_device,
          ].includes(res.result.eventType)
        ) {
          this.updateRoomData()
        }
      })

      // 房间选择恢复默认
      if (roomStore.currentRoomIndex) {
        runInAction(() => {
          roomStore.currentRoomIndex = 0
        })
      }
    },

    // 节流更新房间卡片信息
    updateRoomData: throttle(() => {
      homeStore.updateRoomCardList()
    }, 3000),

    // 节流更新房间卡片信息
    updateRoomCard: throttle(() => {
      roomStore.updateRoomCardLightOnNum()
    }, 2000),

    /**
     * @description 生成房间位置
     * @param isMoving 是否正在拖动
     */
    renewRoomPos(isMoving = false) {
      const currentIndex = this.data.placeholder.index
      const roomPos = {} as Record<string, PosType>
      let accumulatedY = 0
      roomStore.roomList
        .sort((a, b) => this.data.roomPos[a.roomId]?.index - this.data.roomPos[b.roomId]?.index)
        .forEach((room, index) => {
          roomPos[room.roomId] = {
            index,
            // 正在拖的卡片，不改变位置
            y: currentIndex === index ? this.data.roomPos[room.roomId].y : accumulatedY,
          }
          // 若场景列表为空，或正在拖动，则使用 ROOM_CARD_M
          accumulatedY += !room.endCount || !room.sceneList.length || isMoving === true ? ROOM_CARD_M : ROOM_CARD_H
        })

      this.setData({
        roomPos,
        accumulatedY,
      })
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
      if (token && type && type !== 'transferHome' && houseId && time) {
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
        if (now - parseInt(time) > 86400000) {
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

    /**
     * 接受家庭转让逻辑
     */
    async accetHomeTransfer() {
      if (!this.data.isLogin) {
        console.log('未登录，停止转让逻辑')
        return
      }

      const params = wx.getEnterOptionsSync()
      const scene = params.scene
      console.log('wx.getEnterOptionsSync()', params, 'wx.getLaunchOptionsSync()', wx.getLaunchOptionsSync())

      let enterQuery: IAnyObject

      if (scene === 1011) {
        const scanUrl = decodeURIComponent(params.query.q)

        console.log('scanUrl', scanUrl)

        enterQuery = strUtil.getUrlParams(scanUrl)
      } else if (scene === 1007) {
        enterQuery = params.query
      } else {
        console.log('非家庭转让逻辑')
        return
      }

      const type = enterQuery.type as string
      const houseId = enterQuery.houseId as string
      const expireTime = enterQuery.expireTime as string
      const shareId = enterQuery.shareId as string
      const oldUserId = enterQuery.userId as string

      console.log('enterQuery:', enterQuery)
      if (type !== 'transferHome') {
        console.log('非家庭转让逻辑')
        return
      }

      const now = new Date().valueOf()
      // 判断链接是否过期
      if (now > parseInt(expireTime)) {
        Dialog.confirm({
          title: '该消息过期',
          message: '该消息已过期，请联系创建者重新发送',
          confirmButtonText: '我知道了',
          showCancelButton: false,
          zIndex: 9999,
        })

        return
      }

      showLoading()
      const res = await changeUserHouse({ houseId, type: 2, shareId, changeUserId: oldUserId })

      if (res.success) {
        await updateDefaultHouse(houseId)

        await homeBinding.store.updateHomeInfo()

        Dialog.confirm({
          title: '你已成为当前家庭的创建者',
          message: '家庭无线局域网如发生变更，家庭内的所有设备将会离线，可在智慧屏上修改连接的无线局域网。',
          confirmButtonText: '我知道了',
          showCancelButton: false,
          zIndex: 9999,
        })
      } else {
        Toast(res.msg)
      }

      hideLoading()
    },

    // 收起所有菜单
    hideMenu() {
      this.setData({
        'selectHomeMenu.isShow': false,
        'addMenu.isShow': false,
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

    showAddMenu() {
      this.setData({
        addMenu: {
          right: '25rpx',
          y:
            (storage.get<number>('statusBarHeight') as number) +
            (storage.get<number>('navigationBarHeight') as number) +
            50 +
            'px',
          isShow: !this.data.addMenu.isShow,
        },
      })
    },

    // 开始拖拽，初始化placeholder
    movableTouchStart(e: WechatMiniprogram.TouchEvent) {
      wx.vibrateShort({ type: 'heavy' })

      const rid = e.currentTarget.dataset.rid
      const index = this.data.roomPos[rid].index

      const diffData = {} as IAnyObject
      diffData.isMoving = true
      diffData.placeholder = {
        index,
        y: getPos(index),
      }

      console.log('movableTouchStart:', diffData)

      this.setData(diffData)

      this.renewRoomPos(true)
    },

    /**
     * 拖拽时触发的卡片移动效果
     */
    movableChangeThrottle: throttle(function (this: IAnyObject, e: WechatMiniprogram.TouchEvent) {
      const targetOrder = getIndex(e.detail.y)
      if (this.data.placeholder.index !== targetOrder) {
        const oldOrder = this.data.placeholder.index
        // 节流操作，可能导致movableTouchEnd后仍有movableChange需要执行，丢弃掉
        if (oldOrder < 0) {
          return
        }
        console.log('movableChange: %d-->%d', oldOrder, targetOrder, e)

        // 更新placeholder的位置
        const isForward = oldOrder < targetOrder
        const diffData = {} as IAnyObject
        diffData[`placeholder.index`] = targetOrder
        diffData[`placeholder.y`] = getPos(targetOrder)

        // 更新联动卡片的位置
        let moveCount = 0
        for (const room of roomStore.roomList) {
          const _orderNum = this.data.roomPos[room.roomId].index
          if (
            (isForward && _orderNum > oldOrder && _orderNum <= targetOrder) ||
            (!isForward && _orderNum >= targetOrder && _orderNum < oldOrder)
          ) {
            ++moveCount
            const dOrderNum = isForward ? _orderNum - 1 : _orderNum + 1
            diffData[`roomPos.${room.roomId}.y`] = getPos(dOrderNum)
            diffData[`roomPos.${room.roomId}.index`] = dOrderNum

            // 减少遍历消耗
            if (moveCount >= Math.abs(targetOrder - oldOrder)) {
              break
            }
          }
        }

        // 更新被拖拽卡片的排序num
        diffData[`roomPos.${e.currentTarget.dataset.rid}.index`] = targetOrder

        console.log('movableChange', diffData)
        this.setData(diffData)

        this.data.hasMoved = true
      }
    }, 50),

    movableChange(e: WechatMiniprogram.TouchEvent) {
      if (e.detail.source === 'touch' || e.detail.source === 'friction') {
        this.movableChangeThrottle(e)
      }
    },

    movableTouchEnd(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.isMoving) {
        return
      }
      const dpos = this.data.placeholder.y

      const diffData = {} as IAnyObject
      diffData.isMoving = false
      // 修正卡片位置
      diffData[`roomPos.${e.currentTarget.dataset.rid}.y`] = dpos
      diffData[`placeholder.index`] = -1
      this.setData(diffData)
      console.log('movableTouchEnd:', diffData)

      this.renewRoomPos()

      this.handleSortSaving()
    },

    handleSortSaving() {
      const roomSortList = [] as Room.RoomSort[]
      Object.keys(this.data.roomPos).forEach((roomId) => {
        roomSortList.push({
          roomId,
          sort: this.data.roomPos[roomId].index + 1,
        })
      })

      updateRoomSort(roomSortList)
    },
  },
})
