import Toast from '../../skyline-components/mz-toast/toast'
import Dialog from '../../skyline-components/mz-dialog/dialog'
import { ComponentWithStore } from 'mobx-miniprogram-bindings'
import { homeStore, othersStore, roomStore, deviceStore, sceneStore, userStore } from '../../store/index'
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
  MENU_ADD_AUTOMATION,
  MENU_ADD_DEVICE,
  MENU_ADD_PLATFORM,
  NO_WS_REFRESH_INTERVAL,
  PRO_TYPE,
  ROOM_CARD_W,
  ROOM_CARD_H,
  ROOM_CARD_M,
  defaultImgDir,
} from '../../config/index'
import { allDevicePowerControl, updateRoomSort, updateDefaultHouse, changeUserHouse } from '../../apis/index'
import pageBehavior from '../../behaviors/pageBehaviors'

ComponentWithStore({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  storeBindings: [
    {
      store: deviceStore,
      fields: ['allRoomDeviceList'],
      actions: {},
    },
    {
      store: homeStore,
      fields: ['homeList', 'currentHomeDetail', 'isCreator', 'isManager', 'currentHomeId'],
      actions: {},
    },
    {
      store: roomStore,
      fields: ['roomList'],
      actions: {},
    },
    {
      store: userStore,
      fields: ['isLogin'],
      actions: {},
    },
    {
      store: othersStore,
      fields: ['isInit'],
      actions: {},
    },
  ],
  behaviors: [pageBehavior],
  data: {
    ROOM_CARD_W,
    ROOM_CARD_H,
    ROOM_CARD_M,
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
      (storage.get('navigationBarHeight') as number) +
      'px',
    _system: storage.get('system') as string,
    selectHomeMenu: {
      x: '30rpx',
      y: (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 10 + 'px',
      isShow: false,
    },
    addMenu: {
      x: '430rpx',
      y: (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 60 + 'px',
      arrowX: 236,
      width: 300,
      height: 300,
      isShow: false,
      list: [],
    },
    allOnBtnTap: false,
    allOffBtnTap: false,
    showHomeSelect: false,
    _isAcceptShare: false, // 是否已经触发过接受分享逻辑
    editMode: false,
    lightSummary: {} as Record<string, { lightCount: number; lightOnCount: number }>, // 灯总数、亮灯数统计，按房间id
    hasDevice: false,
    homeList: [] as Home.IHomeItem[],
    homeMenuList: [] as Home.IHomeItem[], // 家庭选择菜单数据
    currentHomeIndex: 0,
    currentHomeName: '', // 当前房间名称
    isShowHomeControl: false, // 是否显示全局控制开关（需要有灯或者开关）
    roomCardList: [] as roomInfo[],
    cardListConfig: {
      draggable: true,
    },
    _isFirstShow: true, // 是否首次加载
    _from: '', // 页面进入来源
    _timeId: null as null | number,
    _timer: 0, // 记录加载时间点
  },
  observers: {
    'homeList,currentHomeId'(homeList: Home.IHomeItem[], currentHomeId: string) {
      let res
      if (!homeList?.length) {
        res = []
      }
      res = homeList
        .sort((_, b) => (b.defaultHouseFlag ? 1 : -1))
        .map((home) => ({
          ...home,
          value: home.houseId,
          key: home.houseId,
          name: home.houseName?.length > 6 ? home.houseName.slice(0, 6) + '...' : home.houseName,
          checked: home.houseId === currentHomeId,
          tag: home.houseCreatorFlag ? '创建' : '',
        }))
      this.setData({ homeMenuList: res })
    },
    currentHomeDetail(homeDetail) {
      let { houseName = '' } = homeDetail ?? {}
      if (houseName.length > 6) {
        houseName = houseName.slice(0, 6) + '...'
      }
      this.setData({
        currentHomeName: houseName,
      })
    },
    allRoomDeviceList(allDevice: Device.DeviceItem[]) {
      this.setData({
        hasDevice: !!allDevice?.length,
        isShowHomeControl:
          !!allDevice?.length &&
          allDevice.some((device) =>
            ([PRO_TYPE.light, PRO_TYPE.switch, PRO_TYPE.bathHeat, PRO_TYPE.clothesDryingRack] as string[]).includes(
              device.proType,
            ),
          ),
      })
    },
    isInit(isInit) {
      if (isInit) {
        this.updateLightCount()
      }
    },
    isCreator(isCreator) {
      this.setData({
        'addMenu.list': isCreator
          ? [MENU_ADD_DEVICE, MENU_ADD_AUTOMATION, MENU_ADD_PLATFORM]
          : [MENU_ADD_DEVICE, MENU_ADD_AUTOMATION],
      })
    },
    'roomList,lightSummary.**'(roomList: roomInfo[], lightSummary) {
      const roomCardList = roomList.map((room) => ({
        ...room,
        ...lightSummary[room.roomId],
        id: room.roomId,
      }))
      this.setData({ roomCardList })
    },
  },

  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
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

      // 隐藏可能弹出的菜单
      this.setData({
        'selectHomeMenu.isShow': false,
        'addMenu.isShow': false,
      })
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

      this.data._isFirstShow = false

      setTimeout(() => {
        this.acceptShare()
      }, 1000)

      this.autoRefreshDevice()

      emitter.off('wsReceive')
      emitter.on('wsReceive', (res) => {
        const { eventType, eventData } = res.result

        // 设备状态上报
        if (eventType === 'device_property') {
          // 过滤不需要处理的上报：开关状态、设备id、modelName 缺失；灯组、房间上报
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
            const lightSummary = this.data.lightSummary[eventData.roomId] ?? {}
            let { lightOnCount = 0 } = lightSummary
            const { lightCount = 0 } = lightSummary
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
              lightOnCount = Math.min(lightCount, lightOnCount + 1) // 防止异常上报导致大于最大值
            } else if (oldPower && eventData.event.power === 0) {
              lightOnCount = Math.max(0, lightOnCount - 1) // 防止异常上报导致小于0
            }
            // FIXME 更新store数据以便比对，但不依赖store更新视图
            device.mzgdPropertyDTOList[eventData.modelName].power = eventData.event.power

            this.setData({
              [`lightSummary.${eventData.roomId}.lightOnCount`]: lightOnCount,
            })

            // 节流主动刷新
            this.updateLightCountThrottle()
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
      console.log('[Index onReady] 耗时', `${Date.now() - this.data._timer}ms`)
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
        sceneStore.updateAllRoomSceneList()
        this.updateLightCount()
      }
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

    // 节流更新灯组统计
    updateLightCountThrottle: throttle(
      async function (this: IAnyObject) {
        await deviceStore.updateAllRoomDeviceList()
        this.updateLightCount()
      },
      10000,
      false, // 不立即触发首次
    ),

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
        for (let i = 0; i < homeStore.homeList.length; i++) {
          if (homeStore.homeList[i].houseId == houseId) {
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
          homeStore
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

      const home = homeStore.homeList.find((item) => item.houseId === houseId && item.houseCreatorFlag)

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

        await homeStore.updateHomeInfo()

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

    handleDragBegin() {
      console.log('[handleDragBegin]')

      this.setData({
        editMode: true,
      })
    },

    handleSortSaving(e: WechatMiniprogram.CustomEvent<{ isMoved: boolean; list: roomInfo[] }>) {
      const { isMoved, list } = e.detail
      const diffData = { editMode: false } as IAnyObject

      // 移动过才需要更新数据
      if (isMoved) {
        const roomMap = Object.fromEntries(list.map((room) => [room.roomId, room]))
        const roomSortData = [] as Room.RoomSort[]

        for (const index in this.data.roomCardList) {
          const { roomId } = this.data.roomCardList[index]
          const { orderNum } = roomMap[roomId] // !! index 与 orderNum 的对应关系可能已发生改变
          diffData[`roomCardList[${index}].orderNum`] = orderNum
          roomSortData.push({
            roomId,
            sort: orderNum,
          })
        }

        // 更新云端排序
        updateRoomSort(roomSortData)
      }
      this.setData(diffData)
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
