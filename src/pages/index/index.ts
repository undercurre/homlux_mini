import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import Toast from '../../skyline-components/mz-toast/toast'
import Dialog from '../../skyline-components/mz-dialog/dialog'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'

// TODO 精简bindings
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
  sceneStore,
  userStore,
} from '../../store/index'
import {
  storage,
  throttle,
  emitter,
  WSEventType,
  showLoading,
  hideLoading,
  strUtil,
  delay,
  Logger,
  isLightOn,
} from '../../utils/index'
import {
  MAX_DEVICES_USING_WS,
  NO_WS_REFRESH_INTERVAL,
  PRO_TYPE,
  ROOM_CARD_H,
  ROOM_CARD_M,
  ROOM_CARD_TOP,
  defaultImgDir,
} from '../../config/index'
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
  return Math.max(0, Math.min(maxIndex, Math.floor((y + ROOM_CARD_M / 2) / ROOM_CARD_M)))
}

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [
    BehaviorWithStore({ storeBindings: [othersBinding, roomBinding, userBinding, homeBinding, deviceBinding] }),
    pageBehavior,
  ],
  data: {
    defaultImgDir,
    navigationBarHeight: (storage.get('navigationBarHeight') as number) + 'px',
    navigationBarAndStatusBarHeight:
      (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 'px',
    // 状态栏高度
    statusBarHeight: storage.get('statusBarHeight') + 'px',
    // 可滚动区域高度
    scrollViewHeight:
      (storage.get('windowHeight') as number) -
      (storage.get('statusBarHeight') as number) -
      (storage.get('bottomBarHeight') as number) - // IPX
      90 - // 开关、添加按钮
      (storage.get('navigationBarHeight') as number),
    _system: storage.get('system') as string,
    selectHomeMenu: {
      x: '30rpx',
      y: '200rpx',
      isShow: false,
    },
    addMenu: {
      x: '430rpx',
      y: (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 60 + 'px',
      arrowX: 236,
      width: 300,
      height: 300,
      isShow: false,
      list: [
        {
          name: '添加设备',
          key: 'device',
          icon: 'add',
          value: '/package-distribution/pages/choose-device/index',
        },
        {
          name: '创建场景',
          key: 'auto',
          icon: 'auto',
          value: '/package-automation/automation-add/index',
        },
        // TODO 权限区分
        {
          name: '连接其它平台',
          key: 'platform',
          icon: 'auth',
          value: '/package-auth/pages/index/index',
        },
      ],
    },
    allOnBtnTap: false,
    allOffBtnTap: false,
    showHomeSelect: false,
    loading: true,
    _isAcceptShare: false, // 是否已经触发过接受分享逻辑
    isMoving: false,
    roomPos: {} as Record<string, PosType>,
    accumulatedY: 0, // 可移动区域高度
    placeholder: {
      y: 0,
      index: -1,
    } as PosType,
    touchClientY: 0,
    scrollTop: 0,
    lightSummary: {} as Record<string, { lightCount: number; lightOnCount: number }>, // 灯总数、亮灯数统计，按房间id
    isLogin: false,
    isCreator: false,
    isManager: false,
    homeList: [] as Home.IHomeItem[],
    currentHomeName: '', // 当前房间名称
    currentHomeId: '',
    isShowHomeControl: false, // 是否显示全局控制开关（需要有灯或者开关）
    roomList: [] as Room.RoomInfo[],
    _scrolledWhenMoving: false, // 拖拽时，被动发生了滚动
    _lastClientY: 0, // 上次触控采样时 的Y坐标
    _isFirstShow: true, // 是否首次加载
    _from: '', // 页面进入来源
    _timeId: null as null | number,
    _timer: 0, // 记录加载时间点
  },
  computed: {
    // currentHomeName() {
    //   if (homeStore.currentHomeDetail && homeStore.currentHomeDetail.houseName) {
    //     if (homeStore.currentHomeDetail.houseName.length > 6) {
    //       return homeStore.currentHomeDetail.houseName.slice(0, 6) + '...'
    //     }
    //     return homeStore.currentHomeDetail?.houseName
    //   }
    //   return ''
    // },
    // 是否显示全局控制开关（需要有灯或者开关）
    // isShowHomeControl() {
    //   if (!deviceStore.allRoomDeviceList?.length) {
    //     return false
    //   }
    //   const lightTypes = [PRO_TYPE.light, PRO_TYPE.switch, PRO_TYPE.bathHeat, PRO_TYPE.clothesDryingRack] as string[]
    //   return deviceStore.allRoomDeviceList.some((device: Device.DeviceItem) => lightTypes.includes(device.proType))
    // },
    homeMenuList(data) {
      if (!data.homeList?.length) {
        return []
      }
      const list = (data.homeList as Home.IHomeItem[])
        .sort((_: Home.IHomeItem, b: Home.IHomeItem) => (b.defaultHouseFlag ? 1 : -1))
        .map((home) => ({
          ...home,
          value: home.houseId,
          key: home.houseId,
          name: home.houseName?.length > 6 ? home.houseName.slice(0, 6) + '...' : home.houseName,
          checked: home.houseId === data.currentHomeId,
          tag: home.defaultHouseFlag ? '创建' : '',
        }))

      return list
    },
  },
  watch: {
    isInit(data) {
      // 如果已初始化，但仍在loading
      if (this.data.loading && data) {
        this.setData({ loading: !data })
      }
    },
    // roomList() {
    //   this.renewRoomPos()
    // },
  },

  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        console.debug('index-getTabBar')
        this.getTabBar().setData({
          selected: 0,
        })
      }
    },
  },

  methods: {
    // 生命周期或者其他钩子
    async onLoad(query: { from?: string }) {
      this.data._from = query.from ?? ''
      // 若未设置过默认页，则跳转到start页选择首页
      if (!othersStore.defaultPage) {
        wx.reLaunch({
          url: `/pages/start/index`,
        })
      }
      if (othersStore.isInit) {
        this.setData({
          loading: false,
        })
      }
      if (this.data._timeId) {
        clearTimeout(this.data._timeId)
        this.data._timeId = null
      }
    },
    onHide() {
      // 隐藏之前展示的下拉菜单
      emitter.off('wsReceive')

      if (this.data._timeId) {
        clearTimeout(this.data._timeId)
        this.data._timeId = null
      }
    },
    async onShow() {
      this.data._timer = Date.now()
      // 房间选择恢复默认
      if (roomStore.currentRoomId) {
        roomStore.setCurrentRoom('')
      }

      if (!this.data._isFirstShow || this.data._from === 'addDevice') {
        await homeStore.updateRoomCardList()
      }
      if (othersStore.isInit) {
        this.pageDataSync('onShow')
      }
      this.data._isFirstShow = false

      setTimeout(() => {
        this.acceptShare()
      }, 1000)
      if (!othersStore.isInit) {
        this.setData({
          loading: true,
        })
      }

      this.autoRefreshDevice()

      emitter.off('wsReceive')
      emitter.on('wsReceive', (res) => {
        const { eventType, eventData } = res.result
        if (eventType === 'device_property') {
          // 设备状态上报，更新亮灯数
          if (
            typeof eventData.event?.power !== 'number' ||
            !eventData.deviceId ||
            eventData.deviceId.length > 16 || // 灯组、房间
            !eventData.modelName
          ) {
            return
          }
          // console.log('设备数：', deviceStore.allRoomDeviceFlattenList.length)
          if (eventData.modelName === 'light' || eventData.modelName.indexOf('wallSwitch') > -1) {
            let { lightOnCount = 0 } = this.data.lightSummary[eventData.roomId] ?? {}
            const uniId = `${eventData.deviceId}:${eventData.modelName}`
            const device = deviceStore.allRoomDeviceFlattenList.find((d) => {
              if (d.proType === PRO_TYPE.switch) {
                return d.uniId === uniId
              }
              return d.deviceId === eventData.deviceId
            })
            if (!device) {
              return
            }
            const oldPower = isLightOn(device) // 查找设备旧的值，如果有变化才更新
            // console.log('[匹配到设备]oldPower', oldPower)

            if (!oldPower && eventData.event.power === 1) {
              lightOnCount++
            } else if (oldPower && eventData.event.power === 0) {
              lightOnCount = Math.max(0, lightOnCount - 1) // 防止异常上报导致小于0
            }
            // FIXME 更新store数据以便比对，但不依赖store更新视图
            device.mzgdPropertyDTOList[eventData.modelName].power = eventData.event.power

            this.setData({
              [`lightSummary.${eventData.roomId}.lightOnCount`]: lightOnCount,
            })
          }
        }
        // Perf: ws消息很多，改用白名单过滤
        else if (
          [
            WSEventType.device_del,
            WSEventType.device_replace,
            WSEventType.device_online_status,
            WSEventType.device_offline_status,
            WSEventType.screen_online_status_sub_device,
            WSEventType.screen_online_status_wifi_device,
            WSEventType.bind_device,
            WSEventType.scene_device_result_status,
            WSEventType.group_device_result_status,
          ].includes(eventType)
        ) {
          this.updateRoomDataThrottle()
        }
      })
    },
    async onReady() {
      emitter.on('pageDataSync', () => {
        this.pageDataSync('on emitter')
      })
      console.log('[Index onReady] 耗时', `${Date.now() - this.data._timer}ms`)
    },

    // TODO 确保数据响应
    async pageDataSync(type?: string) {
      let currentHomeName = ''
      if (homeStore.currentHomeDetail?.houseName) {
        if (homeStore.currentHomeDetail.houseName.length > 6) {
          currentHomeName = homeStore.currentHomeDetail.houseName.slice(0, 6) + '...'
        }
        currentHomeName = homeStore.currentHomeDetail?.houseName
      }
      console.log(type ?? '', '[active pageDataSync]', {
        roomList: JSON.parse(JSON.stringify(roomStore.roomList)),
        isLogin: userStore.isLogin,
        isCreator: homeStore.isCreator,
        isManager: homeStore.isManager,
        hasDevice: deviceStore.allRoomDeviceList?.length,
        currentHomeName,
        isShowHomeControl:
          !!deviceStore.allRoomDeviceList?.length &&
          deviceStore.allRoomDeviceList.some((device: Device.DeviceItem) =>
            ([PRO_TYPE.light, PRO_TYPE.switch, PRO_TYPE.bathHeat, PRO_TYPE.clothesDryingRack] as string[]).includes(
              device.proType,
            ),
          ),
      })
      let homeList
      if (homeStore.homeList?.length) {
        homeList = homeStore.homeList as Home.IHomeItem[]
      }
      this.setData({
        isLogin: userStore.isLogin,
        isCreator: homeStore.isCreator,
        isManager: homeStore.isManager,
        hasDevice: deviceStore.allRoomDeviceList?.length,
        currentHomeName,
        currentHomeId: homeStore.currentHomeId,
        roomList: JSON.parse(JSON.stringify(roomStore.roomList)),
        isShowHomeControl:
          !!deviceStore.allRoomDeviceList?.length &&
          deviceStore.allRoomDeviceList.some((device: Device.DeviceItem) =>
            ([PRO_TYPE.light, PRO_TYPE.switch, PRO_TYPE.bathHeat, PRO_TYPE.clothesDryingRack] as string[]).includes(
              device.proType,
            ),
          ),
        homeList,
        loading: false,
      })

      this.updateLightCount()

      // TODO
      // this.renewRoomPos()
    },

    handleHomeMenu() {
      this.setData({
        'selectHomeMenu.isShow': !this.data.selectHomeMenu.isShow,
      })
    },
    handleAddMenu() {
      this.setData({
        'addMenu.isShow': !this.data.addMenu.isShow,
      })
    },
    async handleHomeTap(e: { detail: string }) {
      this.setData({
        'selectHomeMenu.isShow': false,
      })

      const houseId = e.detail

      this.triggerEvent('select', { houseId })
      showLoading()
      const res = await updateDefaultHouse(houseId)

      if (res.success) {
        await homeStore.homeInit()
      }
      this.pageDataSync('handleHomeTap')
      hideLoading()
    },
    handleAddTap(e: { detail: string }) {
      // console.log('handleAddTap', e)
      this.setData({
        'addMenu.isShow': false,
      })
      const url = e.detail
      wx.navigateTo({ url })
    },

    // 更新灯总数、亮灯数统计
    updateLightCount() {
      const { lightSummary } = this.data
      roomStore.roomList.forEach((room) => {
        lightSummary[room.roomId] = {
          lightCount: 0,
          lightOnCount: 0,
        }
      })
      deviceStore.allRoomDeviceFlattenList.forEach((device) => {
        if (device.deviceType !== 4 && (device.proType === PRO_TYPE.switch || device.proType === PRO_TYPE.light)) {
          lightSummary[device.roomId].lightCount++
        }
        if (isLightOn(device)) {
          lightSummary[device.roomId].lightOnCount++
        }
      })
      console.log('[updateLightCount]lightSummary', lightSummary)
      this.setData({ lightSummary })
    },

    // 节流更新房间卡片信息
    updateRoomDataThrottle: throttle(async function (this: IAnyObject) {
      await homeStore.updateRoomCardList()
      await sceneStore.updateAllRoomSceneList()
      this.updateLightCount()
      this.autoRefreshDevice()
    }, 3000),

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
            y: currentIndex === index ? this.data.roomPos[room.roomId].y : accumulatedY + this.data.touchClientY,
          }
          // 若场景列表为空，或正在拖动，则使用 ROOM_CARD_M
          accumulatedY += !room.sceneList.length || isMoving === true ? ROOM_CARD_M : ROOM_CARD_H
        })

      // 拖动模式，不改变高度
      if (isMoving) {
        this.setData({
          roomPos,
        })
      } else {
        this.setData({
          roomPos,
          accumulatedY,
        })
      }

      // console.log('[currentIndex]', currentIndex, '[roomPos]', Object.values(roomPos))
    },

    acceptShare() {
      if (!this.data.isLogin) {
        return
      }

      if (this.data._isAcceptShare) {
        console.log('已触发过接受分享逻辑')
        return
      }

      this.inviteMember()

      this.accetHomeTransfer()
    },

    inviteMember() {
      const enterOption = wx.getEnterOptionsSync()

      if (enterOption.scene != 1007 && enterOption.scene != 1044) {
        return
      }
      const enterQuery = enterOption.query
      const token = storage.get('token', '')
      const type = enterQuery.type as string
      const houseId = enterQuery.houseId as string
      const time = enterQuery.time as string
      const shareId = enterQuery.shareId as string
      if (token && type && type !== 'transferHome' && houseId && time) {
        this.data._isAcceptShare = true
        console.log(`lmn>>>邀请参数:token=${token}/type=${type}/houseId=${houseId}/time=${time}/shareId=${shareId}`)
        for (let i = 0; i < homeBinding.store.homeList.length; i++) {
          if (homeBinding.store.homeList[i].houseId == houseId) {
            console.log('lmn>>>已经在该家庭')
            return
          }
        }
        const now = new Date().valueOf()
        // 邀请链接一天单次有效
        if (now - parseInt(time) > 86400000) {
          console.log('lmn>>>邀请超时')
          Dialog.confirm({
            title: '邀请过期',
            message: '该邀请已过期，请联系邀请者重新邀请',
            confirmButtonText: '我知道了',
            showCancelButton: false,
            zIndex: 9999,
          })
        } else {
          homeBinding.store
            .inviteMember(houseId, parseInt(type), shareId)
            .then(() => {
              console.log('lmn>>>邀请成功')
              updateDefaultHouse(houseId).finally(() => {
                homeStore.updateHomeInfo().then(() => {
                  homeStore.homeList.forEach((item) => {
                    if (item.houseId == houseId) {
                      Toast(`您已加入${item.houseName}的家`)
                      return
                    }
                  })
                  Toast('您已加入家庭')

                  // 刷新房间和设备列表
                  homeStore.updateRoomCardList()

                  this.updateLightCount()
                })
              })
            })
            .catch((error) => {
              console.error('inviteMember', error)
              if (error.code === 9870) {
                Toast('分享链接已失效')
              } else {
                Toast(error.msg)
              }
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
      const params = wx.getEnterOptionsSync()
      const scene = params.scene
      console.log('wx.getEnterOptionsSync()', params)

      let enterQuery: IAnyObject

      if (scene === 1011) {
        const scanUrl = decodeURIComponent(params.query.q)

        console.log('scanUrl', scanUrl)

        enterQuery = strUtil.getUrlParams(scanUrl)
      } else if (scene === 1007 || scene === 1044) {
        enterQuery = params.query
      } else {
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

      const home = homeBinding.store.homeList.find((item) => item.houseId === houseId && item.houseCreatorFlag)

      if (home) {
        console.log('当前用户已经是对应家庭的创建者')
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
      hideLoading()

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
      } else if (res.code === 9870) {
        Toast('分享链接已失效')
      } else {
        Toast(res.msg)
      }

      this.data._isAcceptShare = true
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
    async handleAllOff() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      // 控制前的亮灯数
      let light_on_in_house = 0,
        light_on_after_seconds = 0
      for (const roomId in this.data.lightSummary) {
        if (this.data.lightSummary[roomId].lightCount) light_on_in_house++
      }
      allDevicePowerControl({ houseId: homeStore.currentHomeId, onOff: 0 })

      await delay(3000)
      for (const roomId in this.data.lightSummary) {
        if (this.data.lightSummary[roomId].lightCount) light_on_after_seconds++
      }

      wx.reportEvent('home_all_off', {
        house_id: homeStore.currentHomeId,
        light_on_in_house,
        light_on_after_seconds,
      })
    },
    /**
     * 用户切换家庭
     */
    handleHomeSelect() {
      this.setData({
        'selectHomeMenu.isShow': false,
        'addMenu.isShow': false,
      })
    },
    /**
     * 用户点击展示/隐藏家庭选择
     */
    handleShowHomeSelectMenu() {
      const diffData = {} as IAnyObject
      diffData.selectHomeMenu = {
        x: '28rpx',
        y:
          (storage.get<number>('statusBarHeight') as number) +
          (storage.get<number>('navigationBarHeight') as number) +
          8 +
          'px',
        isShow: !this.data.selectHomeMenu.isShow,
      }

      // 关闭已打开的其他菜单
      if (!this.data.selectHomeMenu.isShow && this.data.addMenu.isShow) {
        diffData['addMenu.isShow'] = false
      }
      console.log('handleShowHomeSelectMenu', diffData)

      this.setData(diffData)
    },

    showAddMenu() {
      this.setData({ 'addMenu.isShow': true })
    },

    // 开始拖拽
    movableLongpress(e: WechatMiniprogram.TouchEvent) {
      wx.vibrateShort({ type: 'heavy' })

      const rid = e.currentTarget.dataset.rid
      const index = this.data.roomPos[rid].index

      const diffData = {} as IAnyObject
      let touchClientY = 0
      roomStore.roomList
        .sort((a, b) => this.data.roomPos[a.roomId]?.index - this.data.roomPos[b.roomId]?.index)
        .forEach((room, _i) => {
          if (_i < index && room.sceneList.length) {
            touchClientY += ROOM_CARD_M
          }
        })

      diffData.touchClientY = touchClientY
      diffData.isMoving = true
      diffData.placeholder = {
        index,
        y: getPos(index) + this.data.touchClientY,
      }

      console.log('[movableTouchStart] diffData: ', diffData)

      this.setData(diffData)

      this.renewRoomPos(true)

      // 执行一次，防止出现空白位置
      this.movableChangeThrottle(e)
    },

    /**
     * 拖拽时触发的卡片移动效果
     */
    movableChangeThrottle: throttle(function (this: IAnyObject, e: WechatMiniprogram.TouchEvent) {
      const posY = (e.detail.y || e.touches[0]?.clientY) - ROOM_CARD_TOP + this.data.scrollTop - this.data.touchClientY
      const targetOrder = getIndex(posY)
      if (this.data.placeholder.index === targetOrder) {
        return
      }

      const oldOrder = this.data.placeholder.index
      // 节流操作，可能导致movableTouchEnd后仍有movableChange需要执行，丢弃掉
      if (oldOrder < 0) {
        return
      }
      console.log('[movableChange] %d --> %d, posY: %s', oldOrder, targetOrder, posY, e)

      // 更新placeholder的位置
      const isForward = oldOrder < targetOrder
      const diffData = {} as IAnyObject
      diffData[`placeholder.index`] = targetOrder
      diffData[`placeholder.y`] = getPos(targetOrder) + this.data.touchClientY

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
          diffData[`roomPos.${room.roomId}.y`] = getPos(dOrderNum) + this.data.touchClientY
          diffData[`roomPos.${room.roomId}.index`] = dOrderNum

          // 减少遍历消耗
          if (moveCount >= Math.abs(targetOrder - oldOrder)) {
            break
          }
        }
      }

      // 直接更新被拖拽卡片位置
      if (this.data._scrolledWhenMoving || this.data._system.indexOf('iOS') > -1) {
        const rid = e.currentTarget.dataset.rid
        diffData[`roomPos.${rid}.y`] = getPos(targetOrder) + this.data.touchClientY
      }

      // 更新被拖拽卡片的排序num
      diffData[`roomPos.${e.currentTarget.dataset.rid}.index`] = targetOrder

      // FIXME 自动滚动
      // const dir = clientY > this.data._lastClientY ? 'down' : 'up'
      // let { scrollTop } = this.data
      // this.data._lastClientY = clientY
      // if (dir === 'up' && clientY < 200) {
      //   scrollTop -= 50
      // } else if (dir === 'down' && clientY > this.data.scrollViewHeight + 50) {
      //   scrollTop += 50
      // }
      // diffData.scrollTop = scrollTop

      console.log('[movableChange] diffData:', diffData)
      this.setData(diffData)
    }, 500),

    movableTouchMove(e: WechatMiniprogram.TouchEvent) {
      this.movableChangeThrottle(e)
    },

    movableTouchEnd(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.isMoving) {
        return
      }
      const dpos = this.data.placeholder.y

      const diffData = {} as IAnyObject
      diffData.isMoving = false
      diffData.touchClientY = 0

      // 修正卡片位置
      diffData[`roomPos.${e.currentTarget.dataset.rid}.y`] = dpos
      diffData[`placeholder.index`] = -1
      this.setData(diffData)
      console.log('movableTouchEnd:', diffData)

      this.renewRoomPos()
      setTimeout(() => this.renewRoomPos(), 500)

      this.data._scrolledWhenMoving = false

      this.handleSortSaving()
    },

    // 页面滚动
    onPageScroll(e: { detail: { scrollTop: number } }) {
      if (this.data.isMoving || !e?.detail) {
        this.data._scrolledWhenMoving = true
        console.log('scrolled when moving', e)
        return
      }

      const { scrollTop } = e.detail
      console.log('onPageScroll scrollTop: %s, _lastClientY: %s', scrollTop, this.data._lastClientY)
      this.data.scrollTop = scrollTop
    },

    handleSortSaving() {
      const roomSortList = [] as Room.RoomSort[]
      Object.keys(this.data.roomPos).forEach((roomId) => {
        roomSortList.push({
          roomId,
          sort: this.data.roomPos[roomId].index + 1,
        })
      })

      // 更新云端排序
      updateRoomSort(roomSortList)

      // 更新store排序
      const list = [] as Room.RoomInfo[]
      roomStore.roomList.forEach((room) => {
        const { index } = this.data.roomPos[room.roomId]
        list[index] = room
      })
      runInAction(() => {
        roomStore.roomList = list
      })
    },
    // 定时更新设备列表，符合条件则递归执行
    autoRefreshDevice() {
      Logger.log('[autoRefreshDevice]devices amount:', deviceStore.allRoomDeviceList.length)

      if (deviceStore.allRoomDeviceList.length < MAX_DEVICES_USING_WS) {
        if (this.data._timeId) {
          clearTimeout(this.data._timeId)
          this.data._timeId = null
        }
        return
      }

      if (this.data._timeId) {
        clearTimeout(this.data._timeId)
      }

      this.data._timeId = setTimeout(async () => {
        await homeStore.updateRoomCardList()

        this.updateLightCount()
        this.autoRefreshDevice()
      }, NO_WS_REFRESH_INTERVAL)
    },
  },
})
