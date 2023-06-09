import { Logger, isArrEqual, storage, throttle, showLoading, hideLoading } from '../../../../utils/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, deviceStore, sceneStore, homeStore } from '../../../../store/index'
import { maxColorTempK, minColorTempK, colorTempKRange, proType } from '../../../../config/index'
import {
  controlDevice,
  findDevice,
  getLampDeviceByHouseId,
  updateScene,
  getRelLampInfo,
  editLampAndSwitchAssociated,
  delLampAndSwitchAssociated,
  getRelDeviceInfo,
  editSwitchAndSwitchAssociated,
  delSwitchAndSwitchAssociated,
} from '../../../../apis/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import pageBehavior from '../../../../behaviors/pageBehaviors'

let throttleTimer = 0
// 关联类型文描映射
const descMap = {
  light: '关联灯具',
  switch: '关联开关',
  scene: '关联场景',
  none: '未关联',
}

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] }), pageBehavior],
  options: {
    styleIsolation: 'apply-shared',
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  /**
   * 组件的属性列表
   */
  properties: {
    controlPopup: {
      type: Boolean,
      value: true,
      observer(value) {
        // controlPopup 变化触发弹窗展开或收起（折叠）
        console.log('controlPopup %s, trigger popupMove()', value)
        this.popupMove()
        this.updateLinkInfo()
      },
    },
    checkedList: {
      type: Array,
      value: [] as string[],
      observer(value) {
        Logger.log('checkedList', value)
        this.updateLinkInfo()
        // 当controlPopup已是false时，则由数量变化为0触发，收起弹窗
        if (value.length === 0 && !this.data.controlPopup) {
          console.log('checkedList %s, trigger popupMove()', value)
          this.popupMove()
        }
        // 色温范围计算
        else if (value.length) {
          const deviceId = this.data.checkedList[0]
          if (deviceId.indexOf(':') !== -1) {
            return // 排除面板
          }
          const deviceMap = deviceStore.allRoomDeviceMap
          const { productId } = deviceMap[deviceId]
          const [minColorTempK, maxColorTempK] = colorTempKRange[productId]

          this.setData({
            minColorTempK,
            maxColorTempK,
          })
        }
      },
    },
    lightStatus: {
      type: Object,
      value: {} as Record<string, number>,
      observer(value) {
        this.setData({
          'lightInfoInner.Level': value.Level ?? 0,
          'lightInfoInner.ColorTemp': value.ColorTemp ?? 0,
        })
      },
    },
    checkedType: {
      type: Array,
      value: [] as string[],
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    _divideRpxByPx: 0,
    _halfHideBottom: 0, // 叠起来在底部时的bottom值
    _minHeight: 0,
    _componentHeight: 0,
    _wfullpx: 0,
    _touchStartY: 0,
    _isTouchStart: false,
    info: {
      bottomBarHeight: 0,
      componentHeight: 0,
      divideRpxByPx: 0,
    },
    isRender: false,
    tab: '' as '' | 'light' | 'switch' | 'curtain',
    lightInfoInner: {
      Level: 10,
      ColorTemp: 20,
    },
    maxColorTempK,
    minColorTempK,
    curtainInfo: {
      left: 50,
      right: 50,
    },
    /** 提供给关联选择的列表 */
    list: [] as (Device.DeviceItem | Scene.SceneItem)[],
    /** 当前选中的开关，处于是什么关联模式 */
    linkType: 'none' as 'none' | 'light' | 'switch' | 'scene',
    /** 关联弹出框，需要开关去关联什么模式 */
    selectLinkType: 'none' as 'none' | 'light' | 'switch' | 'scene',
    /** 已选中设备或场景 TODO */
    linkSelectList: [] as string[],
    showLinkPopup: false,
    showSelectLinkPopup: false,
    allOnPress: false,
    allOffPress: false,
    _switchRelInfo: {
      switchUniId: '', // 当前记录关联信息的面板，清空了才会重新更新数据
      lampRelList: Array<Device.IMzgdLampRelGetDTO>(), // 当前面板的灯关联数据
      switchRelList: Array<Device.IMzgdRelGetDTO>(), // 当前面板的关联面板数据
    },
    _allSwitchLampRelList: Array<Device.IMzgdLampDeviceInfoDTO>(), // 家庭所有面板的灯关联关系数据
  },

  computed: {
    colorTempK(data) {
      return (data.lightInfoInner.ColorTemp / 100) * (data.maxColorTempK - data.minColorTempK) + data.minColorTempK
    },
    lightTab(data) {
      if (data.checkedType) {
        return data.checkedType.includes('light')
      }
      return false
    },
    switchTab(data) {
      if (data.checkedType) {
        return data.checkedType.includes('switch')
      }
      return false
    },
    curtainTab(data) {
      if (data.checkedType) {
        return data.checkedType.includes('curtain')
      }
      return false
    },
    disabledLinkSetting(data) {
      return data.isVisitor
    },

    linkTypeDesc(data) {
      return descMap[data.linkType]
    },

    selectCardPopupTitle(data) {
      let title = ''

      if (data.selectLinkType === 'light') {
        title = '关联智能灯'
      } else if (data.selectLinkType === 'switch') {
        title = '关联智能开关'
      } else if (data.selectLinkType === 'scene') {
        title = '关联场景'
      }
      return title
    },
  },

  watch: {
    /**
     * 监听当前选择类型
     * TODO 不使用watch？
     */
    checkedType(value) {
      if (value.length > 0) {
        if (!value.includes(this.data.tab)) {
          this.setData({
            tab: value[0],
          })
        }
      } else {
        this.setData({
          tab: '',
        })
      }
    },
    // allRoomDeviceList() {
    //   Logger.log('device-control-popup:watch-allRoomDeviceList')
    //   this.updateLinkInfo()
    // },
  },

  lifetimes: {
    /**
     * 初始化数据
     */
    ready() {
      const divideRpxByPx = storage.get<number>('divideRpxByPx')
        ? (storage.get<number>('divideRpxByPx') as number)
        : 0.5
      let bottomBarHeight = storage.get<number>('bottomBarHeight') as number
      const _componentHeight = 600 * divideRpxByPx
      let _minHeight = 0
      if (bottomBarHeight === 0) {
        bottomBarHeight = 32 // 如果没有高度，就给个高度，防止弹窗太贴底部
      }
      _minHeight = divideRpxByPx * 60 + bottomBarHeight
      this.data._minHeight = _minHeight // 最小高度
      this.data._componentHeight = _componentHeight // 组件高度
      this.data._halfHideBottom = _minHeight - _componentHeight // 组件相对底部高度
      this.data._wfullpx = divideRpxByPx * 750 // 屏幕宽度
      this.data._divideRpxByPx = divideRpxByPx // px rpx比率
      this.setData({
        info: {
          bottomBarHeight: bottomBarHeight,
          divideRpxByPx,
          componentHeight: _componentHeight,
        },
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // TODO: 简化if-else
    popupMove() {
      const { checkedList } = this.data
      const lower = -this.data._componentHeight + 'px'
      const upper = `${this.properties.controlPopup ? 0 : this.data._halfHideBottom}px`
      if (this.data._componentHeight === 0) {
        this.data._halfHideBottom = -this.data._componentHeight
        return // 这时候还没有第一次渲染，from是0，不能正确执行动画
      }

      if (checkedList.length > 0) {
        this.setData({
          isRender: true,
        })
        // 打开
        this.animate(
          '#popup',
          [
            {
              opacity: 0,
              bottom: lower,
            },
            {
              opacity: 1,
              bottom: upper,
            },
          ],
          100,
        )
      } else if (checkedList.length === 0) {
        // 收起
        this.animate(
          '#popup',
          [
            {
              opacity: 1,
              bottom: upper,
            },
            {
              opacity: 0,
              bottom: lower,
            },
          ],
          100,
          () => {
            this.setData({
              isRender: false,
            })
          },
        )
      }
    },

    /**
     * 根据面板ID和面板开关获取关联的灯
     */
    async updateLamoRelInfo(deviceId: string, switchId: string) {
      const res = await getRelLampInfo({
        primaryDeviceId: deviceId,
        primarySwitchId: switchId,
      })

      if (res.success) {
        this.data._switchRelInfo.lampRelList = res.result.lampRelList
      }
    },

    /**
     * 根据面板ID和面板开关获取主动、被动的面板开关
     */
    async getRelSwitchInfo(deviceId: string, switchId: string) {
      const res = await getRelDeviceInfo({
        primaryDeviceId: deviceId,
        primarySwitchId: switchId,
      })

      if (res.success) {
        this.data._switchRelInfo.switchRelList = res.result.primaryRelDeviceInfo.concat(res.result.secondRelDeviceInfo)
      }
    },
    /**
     * 选择的设备为单个开关时触发更新【开关关联信息】
     */
    async updateLinkInfo() {
      const switchUniId = this.data.checkedList[0]
      const switchRelInfo = this.data._switchRelInfo
      // 仅弹窗时且选择的是开关面板时触发，通过_switchRelInfo.switchUniId标志是否为空来防止重复请求
      if (
        !this.data.controlPopup ||
        !this.data.checkedList[0]?.includes(':') ||
        switchUniId === switchRelInfo.switchUniId
      ) {
        return
      }

      switchRelInfo.switchUniId = switchUniId

      Logger.log('updateLinkInfo')
      const [deviceId, switchId] = switchUniId.split(':')

      let linkType = 'none' as 'none' | 'light' | 'switch' | 'scene'

      // 优先判断场景关联信息（已有数据）
      if (deviceStore.switchSceneConditionMap[switchUniId]) {
        linkType = 'scene'
      } else {
        await Promise.all([this.updateLamoRelInfo(deviceId, switchId), this.getRelSwitchInfo(deviceId, switchId)])

        if (switchRelInfo && switchRelInfo.lampRelList.length) {
          linkType = 'light'
        } else if (switchRelInfo && switchRelInfo.switchRelList.length) {
          linkType = 'switch'
        }
      }

      this.setData({
        linkType: linkType,
      })
    },
    handleTouchStart(e: WechatMiniprogram.TouchEvent) {
      if (e.touches.length > 1) {
        this.data._isTouchStart = false
        return
      }
      this.data._touchStartY = e.touches[0].pageY
      this.data._isTouchStart = true
    },
    handleTouchMove(e: WechatMiniprogram.TouchEvent) {
      if (e.touches.length > 1 || !this.data._isTouchStart) {
        this.data._isTouchStart = false
        return
      }
      const isMoveUp = this.data._touchStartY - e.touches[0].pageY > 0
      console.log('isMoveUp', isMoveUp)
      this.triggerEvent('popMove', isMoveUp ? 'up' : 'down')
      this.data._isTouchStart = false
    },
    handleClose() {
      this.triggerEvent('popMove', 'down')
    },
    handleLinkPopup() {
      const switchUniId = this.data.checkedList[0]
      // 关联设备或者场景，必须要选中一个开关
      if (!switchUniId) {
        return
      }

      // 关联场景显示逻辑
      if (this.data.selectLinkType === 'scene') {
        this.setData({
          list: [...sceneStore.allRoomSceneList],
          linkSelectList: deviceStore.switchSceneConditionMap[switchUniId]
            ? [deviceStore.switchSceneConditionMap[switchUniId]]
            : [],
          showLinkPopup: true,
        })
        return
      }

      let linkSelectList = [] as string[]
      let list = [] as Device.DeviceItem[]

      console.log('allRoomDeviceFlattenList', deviceStore.allRoomDeviceFlattenList)
      const relInfo = this.data._switchRelInfo

      if (this.data.selectLinkType === 'light') {
        list = deviceStore.allRoomDeviceFlattenList.filter((item) => item.proType === proType.light)

        linkSelectList = relInfo.lampRelList.map((device) => device.lampDeviceId.replace('group-', ''))
      } else if (this.data.selectLinkType === 'switch') {
        list = deviceStore.allRoomDeviceFlattenList.filter(
          (item) => item.proType === proType.switch && item.uniId !== switchUniId,
        )

        // 合并主动和被动关联的开关列表数据，并去重，作为已选列表
        linkSelectList = relInfo.switchRelList.map((device) => `${device.deviceId}:${device.switchId}`)
      }
      this.setData({
        list,
        linkSelectList,
        showLinkPopup: true,
      })
    },

    async handleLinkSelect(e: { detail: string }) {
      const deviceMap = deviceStore.allRoomDeviceFlattenMap
      const switchUniId = this.data.checkedList[0]
      const selectId = e.detail

      // 取消选择逻辑
      if (this.data.linkSelectList.includes(selectId)) {
        const index = this.data.linkSelectList.findIndex((id) => id === selectId)
        this.data.linkSelectList.splice(index, 1)
        this.setData({
          linkSelectList: [...this.data.linkSelectList],
        })
        return
      }

      const switchSceneConditionMap = deviceStore.switchSceneConditionMap

      if (['light', 'switch'].includes(this.data.selectLinkType)) {
        const device = deviceMap[selectId]
        this.findDevice(device)

        const linkScene = switchSceneConditionMap[selectId]
        const lampRelList = this.data._allSwitchLampRelList.filter(
          (item) => `${item.panelId}:${item.switchId}` === selectId,
        ) // 指定面板的灯关联关系列表

        if (this.data.selectLinkType === 'switch' && (linkScene || lampRelList.length)) {
          const dialogRes = await Dialog.confirm({
            message: `此开关已关联${linkScene ? '场景' : '灯具'}，是否取消关联？`,
            cancelButtonText: '取消',
            confirmButtonText: '确定',
            zIndex: 2000,
            context: this,
          })
            .then(() => true)
            .catch(() => false)

          if (!dialogRes) {
            return
          }
        }

        // 灯具关联，只允许关联1个
        this.setData({
          linkSelectList: this.data.selectLinkType === 'switch' ? [...this.data.linkSelectList, selectId] : [selectId],
        })
      } else if (this.data.selectLinkType === 'scene') {
        const switchSceneActionMap = deviceStore.switchSceneActionMap

        if (switchSceneActionMap[switchUniId]?.includes(selectId)) {
          const dialogRes = await Dialog.confirm({
            message: '此开关已被其他场景使用，是否需要变更？',
            cancelButtonText: '取消',
            confirmButtonText: '变更',
            zIndex: 2000,
            context: this,
          })
            .then(() => true)
            .catch(() => false)

          if (!dialogRes) {
            return
          }
        }

        this.setData({
          linkSelectList: [selectId],
        })
      }
    },
    handleSelectLinkPopup() {
      if (this.data.disabledLinkSetting) {
        const message = '只能创建者及管理员进行关联'
        Toast({ message, zIndex: 9999 })
        return
      }

      this.setData({
        showSelectLinkPopup: true,
      })
    },
    handleSelectLinkPopupClose() {
      this.setData({
        showSelectLinkPopup: false,
      })
    },
    async handleSelectLinkPopupConfirm(e: { detail: 'light' | 'switch' | 'scene' }) {
      this.setData({
        showSelectLinkPopup: false,
        selectLinkType: e.detail,
      })

      if (e.detail === 'switch') {
        const res = await getLampDeviceByHouseId({ houseId: homeStore.currentHomeId })

        if (res.success) {
          this.data._allSwitchLampRelList = res.result
        }
      }
      setTimeout(() => {
        this.handleLinkPopup()
      }, 500)
    },
    handleLinkPopupClose() {
      this.setData({
        showLinkPopup: false,
      })
    },
    handleLinkPopupReturn() {
      this.setData({
        showLinkPopup: false,
      })
      this.handleSelectLinkPopup()
    },
    /** 关联开关 */
    async updateSwitchAssociate() {
      const switchUniId = this.data.checkedList[0]
      const [deviceId, switchId] = switchUniId.split(':')
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap

      // 遍历linkSelectList所选择的面板，是否存在已有关联，若是存在灯关联或者场景关联，则删除
      for (const uniId of this.data.linkSelectList) {
        const sceneId = switchSceneConditionMap[uniId]
        // 若存在场景关联则删除
        if (sceneId) {
          const res = await updateScene({
            sceneId: sceneId,
            updateType: '2',
          })

          if (!res.success) {
            Toast({ message: '删除场景关联失败', zIndex: 9999 })
          }

          // 若存在场景关联，则不可能存在灯关联，无需判断后面的逻辑
          return
        }

        const lampRelList = this.data._allSwitchLampRelList.filter(
          (item) => `${item.panelId}:${item.switchId}` === uniId,
        ) // 指定面板的灯关联关系列表

        if (lampRelList.length) {
          // 删除指定面板和灯的关联数据
          const [selectedDeviceId, selectedSwitchId] = uniId.split(':')

          const res = await delLampAndSwitchAssociated({
            deviceId: selectedDeviceId,
            switchId: selectedSwitchId,
            relIds: lampRelList.map((item) => item.lampDeviceId).join(','),
          })

          if (!res.success) {
            Toast({ message: '删除面板已有的灯关联失败', zIndex: 9999 })
            return
          }
        }
      }

      // 编辑面板和面板的关联数据
      return editSwitchAndSwitchAssociated({
        primaryDeviceId: deviceId,
        primarySwitchId: switchId,
        secondSwitchs: this.data.linkSelectList.map((item) => item.replace(':', '-')).join(','),
      })
    },

    /**
     * 更新场景绑定数据
     */
    async updataSceneLink() {
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      const switchUniId = this.data.checkedList[0]
      const [deviceId, switchId] = switchUniId.split(':')

      if (this.data.linkSelectList[0] === switchSceneConditionMap[switchUniId]) {
        // 选择没变化，不执行操作
        return
      }

      const sceneId = this.data.linkSelectList[0]
      const updateSceneDto = {
        conditionType: '0',
        sceneId: sceneId,
      } as Scene.UpdateSceneDto
      console.log(switchSceneConditionMap, switchUniId, switchSceneConditionMap[switchUniId])

      if (
        switchSceneConditionMap[switchUniId] &&
        this.data.linkSelectList[0] !== switchSceneConditionMap[switchUniId]
      ) {
        // 更新场景关联，先取消关联当前场景，再关联其他场景
        const res = await updateScene({
          conditionType: '0',
          sceneId: switchSceneConditionMap[switchUniId],
          updateType: '2',
        })

        if (!res.success) {
          Toast({
            message: '更新失败',
            zIndex: 99999,
          })
          return
        }
      }

      // 关联新的场景
      updateSceneDto.deviceConditions = [
        {
          deviceId,
          controlEvent: [
            {
              ep: Number(switchId),
              ButtonScene: 1,
            },
          ],
        },
      ]
      updateSceneDto.updateType = '3'

      await updateScene(updateSceneDto)
    },

    /**
     * 删除面板的关联关系
     */
    async deleteAssocite() {
      const switchUniId = this.data.checkedList[0]
      const [deviceId, switchId] = switchUniId.split(':')
      let res

      if (this.data.linkType === 'light') {
        // 删除面板和灯的关联数据
        res = await delLampAndSwitchAssociated({
          deviceId,
          switchId,
          relIds: this.data._switchRelInfo.lampRelList.map((item) => item.relId).join(','),
        })
      } else if (this.data.linkType === 'switch') {
        // 删除面板和面板的关联数据
        res = await delSwitchAndSwitchAssociated({
          relIds: this.data._switchRelInfo.switchRelList.map((item) => item.relId).join(','),
        })
      } else if (this.data.linkType === 'scene') {
        // 删除场景关联
        const sceneId = deviceStore.switchSceneConditionMap[switchUniId]
        if (sceneId) {
          res = await updateScene({
            sceneId: sceneId,
            updateType: '2',
          })
        }
      }

      if (!res?.success) {
        Toast({
          message: '解除原绑定关系失败',
          zIndex: 99999,
        })
      }

      return res
    },

    async editAssocite() {
      const switchUniId = this.data.checkedList[0]
      const [deviceId, switchId] = switchUniId.split(':')
      let res

      if (this.data.selectLinkType === 'light') {
        const deviceMap = deviceStore.allRoomDeviceMap
        const device = deviceMap[this.data.linkSelectList[0]]

        if (device.deviceType === 4) {
          this.data.linkSelectList[0] = 'group-' + this.data.linkSelectList[0]
        }

        // 编辑和灯的关联数据
        res = await editLampAndSwitchAssociated({
          primaryDeviceId: deviceId,
          primarySwitchId: switchId,
          lampDevices: this.data.linkSelectList.join(','),
        })
      } else if (this.data.selectLinkType === 'switch') {
        res = await this.updateSwitchAssociate()
      } else if (this.data.selectLinkType === 'scene') {
        res = await this.updataSceneLink()
      }

      return res
    },

    async handleLinkPopupConfirm() {
      this.setData({
        showLinkPopup: false,
      })
      const switchUniId = this.data.checkedList[0]
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      const lampRelList = this.data._allSwitchLampRelList.map((item) => `${item.panelId}:${item.switchId}`) // 指定面板的灯关联关系列表
      const switchRelList = this.data._switchRelInfo.switchRelList.map((item) => `${item.deviceId}:${item.switchId}`) // 指定面板的灯关联关系列表
      const { linkType, selectLinkType, linkSelectList } = this.data

      // 选择没变化，不执行操作
      if (
        (linkType === 'none' && linkSelectList.length === 0) ||
        (linkType === 'scene' && linkSelectList[0] === switchSceneConditionMap[switchUniId]) ||
        (linkType === 'light' && isArrEqual(linkSelectList, lampRelList)) ||
        (linkType === 'switch' && isArrEqual(linkSelectList, switchRelList))
      ) {
        Logger.log('关联关系没发生变化，不执行操作')
        return
      }

      // 若面板已存在关联的情况下
      // 1、若面板已存在关联且与新关联数据的类型不一致
      // 2、已选择的列表为空时即清空原有绑定关系
      // 执行删除已有关联操作
      if (linkType !== 'none' && (linkType !== selectLinkType || linkSelectList.length === 0)) {
        // 变更绑定类型的情况下弹框确认
        if (linkType !== selectLinkType) {
          const dialogRes = await Dialog.confirm({
            message: `此开关已${descMap[linkType]}，是否变更？`,
            cancelButtonText: '取消',
            confirmButtonText: '确定',
            zIndex: 2000,
            context: this,
          })
            .then(() => true)
            .catch(() => false)

          if (!dialogRes) {
            return
          }
        }

        showLoading()
        const delRes = await this.deleteAssocite()

        if (!delRes?.success) {
          hideLoading()
          return
        }
      }

      showLoading()
      // 编辑新增新的绑定关系数据
      // 若选择的数据linkSelectList为空,无需执行编辑操作
      if (linkSelectList.length > 0) {
        await this.editAssocite()
      }

      await Promise.all([
        // sceneStore.updateSceneList(),
        sceneStore.updateAllRoomSceneList(),
        deviceStore.updateSubDeviceList(),
        // deviceStore.updateAllRoomDeviceList(),
      ])

      this.data._switchRelInfo.switchUniId = '' // 置空标志位，否则不会更新数据
      this.updateLinkInfo()
      this.triggerEvent('updateList')

      hideLoading()
    },
    handleTabTap(e: { currentTarget: { dataset: { tab: 'light' | 'switch' | 'curtain' } } }) {
      this.setData({
        tab: e.currentTarget.dataset.tab,
      })
    },
    async switchSendDeviceControl(OnOff: number) {
      const deviceMap = deviceStore.allRoomDeviceMap
      // 按照网关区分
      const gatewaySelectDeviceMap: Record<string, Device.DeviceItem[]> = {}
      this.data.checkedList
        .filter((id: string) => id.includes(':'))
        .forEach((uniId: string) => {
          const [deviceId, ep] = uniId.split(':')
          if (gatewaySelectDeviceMap[deviceMap[deviceId].gatewayId]) {
            const index = gatewaySelectDeviceMap[deviceMap[deviceId].gatewayId].findIndex(
              (device) => device.deviceId === deviceId,
            )
            if (index != -1) {
              gatewaySelectDeviceMap[deviceMap[deviceId].gatewayId][index].switchInfoDTOList.push({
                switchId: ep,
              } as unknown as Device.MzgdPanelSwitchInfoDTO)
            } else {
              gatewaySelectDeviceMap[deviceMap[deviceId].gatewayId].push({
                ...deviceMap[deviceId],
                switchInfoDTOList: [{ switchId: ep } as unknown as Device.MzgdPanelSwitchInfoDTO],
              })
            }
          } else {
            gatewaySelectDeviceMap[deviceMap[deviceId].gatewayId] = [
              {
                ...deviceMap[deviceId],
                switchInfoDTOList: [{ switchId: ep } as unknown as Device.MzgdPanelSwitchInfoDTO],
              },
            ]
          }
          // 先改掉缓存中设备的值(创建场景需要新的属性值)
          deviceStore.deviceMap[deviceId].mzgdPropertyDTOList[ep].OnOff = OnOff
        })
      // 给每个网关的开关下发
      Object.entries(gatewaySelectDeviceMap).forEach((entries) => {
        const controlData = [] as Record<string, string | number>[]
        entries[1].forEach((device) => {
          device.switchInfoDTOList.forEach((switchInfo) => {
            controlData.push({
              devId: device.deviceId,
              ep: parseInt(switchInfo.switchId),
              OnOff,
            })
          })
        })
        controlDevice({
          topic: '/subdevice/control',
          deviceId: entries[0],
          method: 'panelSingleControl',
          inputData: controlData,
        })
      })
    },
    async lightSendDeviceControl(type: 'colorTemp' | 'level' | 'onOff', OnOff?: number) {
      const deviceMap = deviceStore.allRoomDeviceMap
      const currentRoomDeviceMap = deviceStore.deviceMap
      // 拿出选中的设备
      const selectLightDevice: Device.DeviceItem[] = []
      this.data.checkedList
        .filter((uniId: string) => !uniId.includes(':'))
        .forEach((deviceId: string) => {
          if (deviceMap[deviceId].proType === proType.light) {
            selectLightDevice.push(deviceMap[deviceId])
          }
        })
      // 先改掉缓存中设备的值(创建场景需要新的属性值)
      selectLightDevice.forEach((device) => {
        if (type === 'level') {
          currentRoomDeviceMap[device.deviceId].mzgdPropertyDTOList['1'].Level = this.data.lightInfoInner.Level
        } else if (type === 'colorTemp') {
          currentRoomDeviceMap[device.deviceId].mzgdPropertyDTOList['1'].ColorTemp = this.data.lightInfoInner.ColorTemp
        } else if (type === 'onOff') {
          currentRoomDeviceMap[device.deviceId].mzgdPropertyDTOList['1'].OnOff = OnOff as number
        }
      })
      // 按照网关区分
      const gatewaySelectDeviceMap: Record<string, Device.DeviceItem[]> = {}
      selectLightDevice.forEach((device) => {
        if (gatewaySelectDeviceMap[device.gatewayId]) {
          gatewaySelectDeviceMap[device.gatewayId].push(device)
        } else {
          gatewaySelectDeviceMap[device.gatewayId] = [device]
        }
      })
      // 给每个网关的灯下发
      Object.entries(gatewaySelectDeviceMap).forEach((entries) => {
        if (type === 'level') {
          controlDevice({
            topic: '/subdevice/control',
            deviceId: entries[0],
            method: 'lightControl',
            inputData: entries[1].map((devive) => ({
              devId: devive.deviceId,
              ep: 1,
              Level: this.data.lightInfoInner.Level,
            })),
          })
        } else if (type === 'colorTemp') {
          controlDevice({
            topic: '/subdevice/control',
            deviceId: entries[0],
            method: 'lightControl',
            inputData: entries[1].map((devive) => ({
              devId: devive.deviceId,
              ep: 1,
              ColorTemp: this.data.lightInfoInner.ColorTemp,
            })),
          })
        } else {
          controlDevice({
            topic: '/subdevice/control',
            deviceId: entries[0],
            method: 'lightControl',
            inputData: entries[1].map((devive) => ({
              devId: devive.deviceId,
              ep: 1,
              OnOff,
            })),
          })
        }
      })
    },
    handleLevelDrag: throttle(function (this: IAnyObject, e: { detail: { value: number } }) {
      this.setData({
        'lightInfoInner.Level': e.detail.value,
      })
    }),
    handleLevelChange(e: { detail: number }) {
      this.setData({
        'lightInfoInner.Level': e.detail,
      })
      this.lightSendDeviceControl('level')
    },
    handleLevelDragEnd() {
      this.lightSendDeviceControl('level')
    },
    handleColorTempDragEnd() {
      this.lightSendDeviceControl('colorTemp')
    },
    handleColorTempChange(e: { detail: number }) {
      this.setData({
        'lightInfoInner.ColorTemp': e.detail,
      })
      this.lightSendDeviceControl('colorTemp')
    },
    handleColorTempDrag: throttle(function (this: IAnyObject, e: { detail: { value: number } }) {
      this.setData({
        'lightInfoInner.ColorTemp': e.detail.value,
      })
    }),
    handleAllOn() {
      if (throttleTimer) {
        return
      }
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      this.setData({
        allOnPress: true,
      })
      throttleTimer = setTimeout(() => {
        throttleTimer = 0
        this.setData({
          allOnPress: false,
        })
      }, 900)
      if (this.data.tab === 'light') {
        this.lightSendDeviceControl('onOff', 1)
      } else if (this.data.tab === 'switch') {
        this.switchSendDeviceControl(1)
      }
      this.triggerEvent('updateList')
    },
    handleAllOff() {
      if (throttleTimer) {
        return
      }
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      this.setData({
        allOffPress: true,
      })
      throttleTimer = setTimeout(() => {
        throttleTimer = 0
        this.setData({
          allOffPress: false,
        })
      }, 900)
      if (this.data.tab === 'light') {
        this.lightSendDeviceControl('onOff', 0)
      } else if (this.data.tab === 'switch') {
        this.switchSendDeviceControl(0)
      }
    },
    findDevice(device: Device.DeviceItem) {
      findDevice({ gatewayId: device.gatewayId, devId: device.deviceId })
    },
    toDetail() {
      wx.navigateTo({
        url: `/package-mine/device-manage/device-detail/index?deviceId=${this.data.checkedList[0]}`,
      })
    }
  },
})
