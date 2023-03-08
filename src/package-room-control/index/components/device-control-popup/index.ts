import { storage } from '../../../../utils/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceBinding, deviceStore, sceneStore } from '../../../../store/index'
import { maxColorTempK, minColorTempK, proType } from '../../../../config/index'
import { controlDevice, createAssociated, delAssociated, updateAssociated, updateScene } from '../../../../apis/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] })],

  /**
   * 组件的属性列表
   */
  properties: {
    popup: {
      type: Boolean,
      value: true,
      observer(value) {
        const from = this.data._bottom
        const to = value ? 0 : this.data._minHeight - this.data._componentHeight
        this.data._bottom = to
        this.animate(
          '#popup',
          [
            {
              bottom: from + 'px',
              ease: 'ease-in-out',
            },
            {
              bottom: to + 'px',
              ease: 'ease-in-out',
            },
          ],
          200,
        )
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    _divideRpxByPx: 0,
    _bottom: 0, // 收起来时的bottom值
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
      maxColorTempK,
      minColorTempK,
    },
    curtainInfo: {
      left: 50,
      right: 50,
    },
    /** 提供给关联选择的列表 */
    list: [] as (Device.DeviceItem | Scene.SceneItem)[],
    linkType: '' as '' | 'light' | 'switch' | 'scene',
    /** 已选中设备或场景 */
    linkSelectList: [] as string[],
    showLinkPopup: false,
    relId: {
      switchRelId: '',
      lightRelId: '',
    },
    selectSwitchUniId: '',
  },

  computed: {
    colorTempK(data) {
      return (
        (data.lightInfoInner.ColorTemp / 100) *
          (data.lightInfoInner.maxColorTempK - data.lightInfoInner.minColorTempK) +
        data.lightInfoInner.minColorTempK
      )
    },
    lightTab(data) {
      if (data.selectType) {
        return data.selectType.includes('light')
      }
      return false
    },
    switchTab(data) {
      if (data.selectType) {
        return data.selectType.includes('switch')
      }
      return false
    },
    curtainTab(data) {
      if (data.selectType) {
        return data.selectType.includes('curtain')
      }
      return false
    },
    isSelectMultiSwitch(data) {
      if (data.selectList) {
        let count = 0
        data.selectList.forEach((deviceId: string) => {
          if (deviceId.includes(':')) {
            count++
          }
        })
        return count > 1
      }
      return false
    },
  },

  watch: {
    lightInfo(value) {
      this.setData({
        'lightInfoInner.Level': value.Level,
        'lightInfoInner.ColorTemp': value.ColorTemp,
      })
    },
    /**
     * 监听选择列表，执行动画
     * @param value 选择列表
     */
    selectList(value) {
      const from = -this.data._componentHeight
      const to = this.properties.popup ? 0 : this.data._bottom
      if (this.data._componentHeight === 0) {
        this.data._bottom = -this.data._componentHeight
        return // 这时候还没有第一次渲染，from是0，不能正确执行动画
      }
      if (value.length > 0 && !this.data.isRender) {
        this.setData({
          isRender: true,
        })
        this.animate(
          '#popup',
          [
            {
              opacity: 0,
              bottom: from + 'px',
            },
            {
              opacity: 1,
              bottom: to + 'px',
            },
          ],
          200,
        )
      } else if (value.length === 0) {
        this.animate(
          '#popup',
          [
            {
              opacity: 1,
              bottom: to + 'px',
            },
            {
              opacity: 0,
              bottom: -this.data._componentHeight + 'px',
            },
          ],
          200,
          () => {
            this.setData({
              isRender: false,
            })
          },
        )
      }
    },
    /**
     * 监听当前选择类型
     */
    selectType(value) {
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
  },

  lifetimes: {
    /**
     * 初始化数据
     */
    attached() {
      const divideRpxByPx = storage.get<number>('divideRpxByPx')
        ? (storage.get<number>('divideRpxByPx') as number)
        : 0.5
      let bottomBarHeight = storage.get<number>('bottomBarHeight') as number
      const _componentHeight = 840 * divideRpxByPx
      let _minHeight = 0
      if (bottomBarHeight === 0) {
        bottomBarHeight = 32 // 如果没有高度，就给个高度，防止弹窗太贴底部
      }
      _minHeight = divideRpxByPx * 60 + bottomBarHeight
      this.data._minHeight = _minHeight // 最小高度
      this.data._componentHeight = _componentHeight // 组件高度
      this.data._bottom = _minHeight - _componentHeight // 组件相对底部高度
      this.data._wfullpx = divideRpxByPx * 750 // 屏幕宽度
      this.data._divideRpxByPx = divideRpxByPx // px rpx比率
      console.log('attached', this.data._minHeight, this.data._bottom)
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
    handlePopup() {
      this.triggerEvent('popMove', 'up')
    },
    handleLinkPopup(e: { currentTarget: { dataset: { link: 'light' | 'switch' | 'scene' } } }) {
      const deviceMap = deviceStore.deviceMap
      const switchUniId = deviceStore.selectList.find((uniId) => uniId.includes(':'))
      // 关联设备或者场景，必须要选中一个开关
      if (!switchUniId) {
        return
      }
      if (e.currentTarget.dataset.link === 'scene') {
        this.setData({
          linkType: e.currentTarget.dataset.link,
          list: [...sceneStore.sceneList],
          linkSelectList: deviceStore.switchSceneMap[switchUniId] ? [deviceStore.switchSceneMap[switchUniId]] : [],
          showLinkPopup: true,
          selectSwitchUniId: switchUniId,
        })
        return
      }
      const switchItem = deviceMap[switchUniId.split(':')[0]].switchInfoDTOList.find(
        (switchItem) => switchItem.switchId === switchUniId.split(':')[1],
      )
      const switchRelId = switchItem?.switchRelId ?? ''
      const lightRelId = switchItem?.lightRelId ?? ''
      // let linkSelectList = []
      let list = [] as Device.DeviceItem[]
      if (e.currentTarget.dataset.link === 'light') {
        list = deviceStore.allRoomDeviceFlattenList
          .map((device) => ({
            // 勾选上关联
            ...device,
            isChecked: device.lightRelId !== '' && device.lightRelId === lightRelId,
          }))
          .filter((item) => !item.uniId.includes(':'))
        // linkSelectList = list
        //   .filter((device) => device.lightRelId && device.lightRelId === lightRelId)
        //   .map((device) => device.deviceId)
      } else if (e.currentTarget.dataset.link === 'switch') {
        list = deviceStore.allRoomDeviceFlattenList
          .filter((item) => item.uniId.includes(':'))
          .map((device) => ({
            ...device,
            isChecked:
              device.switchInfoDTOList[0].switchRelId !== '' && device.switchInfoDTOList[0].switchRelId === switchRelId,
          }))
          .filter((item) => item.uniId !== switchUniId)
        // linkSelectList = list
        //   .filter(
        //     (device) =>
        //       device.switchInfoDTOList[0].switchRelId && device.switchInfoDTOList[0].switchRelId === switchRelId,
        //   )
        //   .map((device) => device.uniId)
      }
      console.log(list)
      this.setData({
        linkType: e.currentTarget.dataset.link,
        list,
        linkSelectList: [],
        relId: {
          switchRelId,
          lightRelId,
        },
        showLinkPopup: true,
        selectSwitchUniId: switchUniId,
      })
    },
    handleLinkSelect(e: { detail: string }) {
      if (this.data.linkSelectList.includes(e.detail)) {
        const index = this.data.linkSelectList.findIndex((id) => id === e.detail)
        this.data.linkSelectList.splice(index, 1)
        this.setData({
          linkSelectList: [...this.data.linkSelectList],
        })
        return
      }
      const deviceMap = deviceStore.deviceMap
      if (this.data.linkType === 'light') {
        if (deviceMap[e.detail].lightRelId && this.data.relId.lightRelId !== deviceMap[e.detail].lightRelId) {
          wx.showToast({
            icon: 'none',
            title: '设备已被关联',
          })
          return
        }
        this.setData({
          linkSelectList: [...this.data.linkSelectList, e.detail],
        })
      } else if (this.data.linkType === 'switch') {
        const switchItem = deviceMap[e.detail.split(':')[0]].switchInfoDTOList.find(
          (switchItem) => switchItem.switchId === e.detail.split(':')[1],
        )
        if (switchItem?.switchRelId && this.data.relId.switchRelId !== switchItem?.switchRelId) {
          wx.showToast({
            icon: 'none',
            title: '设备已被关联',
          })
          return
        }
        this.setData({
          linkSelectList: [...this.data.linkSelectList, e.detail],
        })
      } else if (this.data.linkType === 'scene') {
        this.setData({
          linkSelectList: [e.detail],
        })
      }
    },
    handleLinkPopupClose() {
      this.setData({
        showLinkPopup: false,
      })
    },
    async updateLightAssociate() {
      const selectSwitchUniId = this.data.selectSwitchUniId
      // 关联灯
      if (this.data.relId.lightRelId && this.data.linkSelectList.length !== 0) {
        const rawLinkDeviceSelectList = (this.data.list as Device.DeviceItem[])
          .filter((device) => device.lightRelId && device.lightRelId === this.data.relId.lightRelId)
          .map((device) => device.deviceId)
        // 更新关联
        const delAssociateDevice = rawLinkDeviceSelectList.filter(
          (deviceId) => !this.data.linkSelectList.includes(deviceId),
        )
        const addAssociateDevice = this.data.linkSelectList.filter(
          (deviceId) => !rawLinkDeviceSelectList.includes(deviceId),
        )
        if (delAssociateDevice.length !== 0) {
          // 部分设备删除关联
          await delAssociated({
            relType: '0',
            lightRelId: this.data.relId.lightRelId,
            deviceIds: delAssociateDevice,
          })
        }
        if (addAssociateDevice.length !== 0) {
          // 部分设备添加关联
          await updateAssociated({
            relType: '0',
            lightRelId: this.data.relId.lightRelId,
            deviceIds: addAssociateDevice,
          })
        }
      } else if (this.data.relId.lightRelId && this.data.linkSelectList.length === 0) {
        // 删除关联
        await delAssociated({
          relType: '0',
          lightRelId: this.data.relId.lightRelId,
        })
      } else if (!this.data.relId.lightRelId && this.data.linkSelectList.length !== 0) {
        // 创建依赖
        await createAssociated({
          deviceIds: [selectSwitchUniId, ...this.data.linkSelectList],
          relType: '0',
        })
      }
    },
    async updateSwitchAssociate() {
      const selectSwitchUniId = this.data.selectSwitchUniId
      // 关联开关
      if (this.data.relId.switchRelId && this.data.linkSelectList.length !== 0) {
        const rawLinkDeviceSelectList = (this.data.list as Device.DeviceItem[])
          .filter(
            (device) =>
              device.switchInfoDTOList[0].switchRelId &&
              device.switchInfoDTOList[0].switchRelId === this.data.relId.switchRelId,
          )
          .map((device) => device.uniId)
        // 更新关联
        const delAssociateDevice = rawLinkDeviceSelectList.filter(
          (deviceId) => !this.data.linkSelectList.includes(deviceId),
        )
        const addAssociateDevice = this.data.linkSelectList.filter(
          (deviceId) => !rawLinkDeviceSelectList.includes(deviceId),
        )
        if (delAssociateDevice.length !== 0) {
          // 部分设备删除关联
          await delAssociated({
            relType: '1',
            switchRelId: this.data.relId.switchRelId,
            deviceIds: delAssociateDevice,
          })
        }
        if (addAssociateDevice.length !== 0) {
          // 部分设备添加关联
          await updateAssociated({
            relType: '1',
            switchRelId: this.data.relId.switchRelId,
            deviceIds: addAssociateDevice,
          })
        }
      } else if (this.data.relId.switchRelId && this.data.linkSelectList.length === 0) {
        // 删除关联
        await delAssociated({
          relType: '1',
          switchRelId: this.data.relId.switchRelId,
        })
      } else if (!this.data.relId.switchRelId && this.data.linkSelectList.length !== 0) {
        // 创建依赖
        await createAssociated({
          deviceIds: [selectSwitchUniId, ...this.data.linkSelectList],
          relType: '1',
        })
      }
    },
    async updataSceneLink() {
      const switchSceneMap = deviceStore.switchSceneMap
      if (this.data.linkSelectList.length === 0 && switchSceneMap[this.data.selectSwitchUniId]) {
        // 取消关联
        await updateScene({
          updateType: '2',
          sceneId: switchSceneMap[this.data.selectSwitchUniId],
          conditionType: '0',
        })
        return
      }
      if (
        this.data.linkSelectList[0] === switchSceneMap[this.data.selectSwitchUniId] ||
        (this.data.linkSelectList.length === 0 && !switchSceneMap[this.data.selectSwitchUniId])
      ) {
        // 没变化，不执行操作
        return
      }
      const sceneId = this.data.linkSelectList[0]
      const updateSceneDto = {
        conditionType: '0',
        sceneId: sceneId,
      } as Scene.UpdateSceneDto
      console.log(switchSceneMap, this.data.selectSwitchUniId, switchSceneMap[this.data.selectSwitchUniId])
      if (
        this.data.linkSelectList.length !== 0 &&
        switchSceneMap[this.data.selectSwitchUniId] &&
        this.data.linkSelectList[0] !== switchSceneMap[this.data.selectSwitchUniId]
      ) {
        // 更新关联，先取消关联当前场景，再关联其他场景
        const res = await updateScene({
          conditionType: '0',
          sceneId: switchSceneMap[this.data.selectSwitchUniId],
          updateType: '2',
        })
        if (!res.success) {
          wx.showToast({
            icon: 'error',
            title: '更新失败',
          })
          return
        }
        // 关联新的场景
        updateSceneDto.deviceConditions = [
          {
            deviceId: this.data.selectSwitchUniId.split(':')[0],
            controlEvent: [
              {
                ep: Number(this.data.selectSwitchUniId.split(':')[1]),
                ButtonScene: 1,
              },
            ],
          },
        ]
        updateSceneDto.updateType = '3'
        await updateScene(updateSceneDto)
        return
      }
      if (this.data.linkSelectList.length !== 0 && !switchSceneMap[this.data.selectSwitchUniId]) {
        // 增加关联
        updateSceneDto.deviceConditions = [
          {
            deviceId: this.data.selectSwitchUniId.split(':')[0],
            controlEvent: [
              {
                ep: Number(this.data.selectSwitchUniId.split(':')[1]),
                ButtonScene: 1,
              },
            ],
          },
        ]
        updateSceneDto.updateType = '3'
        await updateScene(updateSceneDto)
      }
    },
    async handleLinkPopupConfirm() {
      this.setData({
        showLinkPopup: false,
      })
      if (this.data.linkType === 'light') {
        await this.updateLightAssociate()
        await deviceStore.updateSubDeviceList()
      } else if (this.data.linkType === 'switch') {
        await this.updateSwitchAssociate()
        await deviceStore.updateSubDeviceList()
      } else if (this.data.linkType === 'scene') {
        await this.updataSceneLink()
        await sceneStore.updateSceneList()
      }
    },
    handleTabTap(e: { currentTarget: { dataset: { tab: 'light' | 'switch' | 'curtain' } } }) {
      this.setData({
        tab: e.currentTarget.dataset.tab,
      })
    },
    async switchSendDeviceControl(OnOff: number) {
      const deviceMap = deviceStore.deviceMap
      // 按照网关区分
      const gatewaySelectDeviceMap: Record<string, Device.DeviceItem[]> = {}
      deviceStore.selectList
        .filter((id) => id.includes(':'))
        .forEach((uniId) => {
          if (gatewaySelectDeviceMap[deviceMap[uniId.split(':')[0]].gatewayId]) {
            const index = gatewaySelectDeviceMap[deviceMap[uniId.split(':')[0]].gatewayId].findIndex(
              (device) => device.deviceId === uniId.split(':')[0],
            )
            if (index != -1) {
              gatewaySelectDeviceMap[deviceMap[uniId.split(':')[0]].gatewayId][index].switchInfoDTOList.push({
                switchId: uniId.split(':')[1],
              } as unknown as Device.MzgdPanelSwitchInfoDTO)
            } else {
              gatewaySelectDeviceMap[deviceMap[uniId.split(':')[0]].gatewayId].push({
                ...deviceMap[uniId.split(':')[0]],
                switchInfoDTOList: [{ switchId: uniId.split(':')[1] } as unknown as Device.MzgdPanelSwitchInfoDTO],
              })
            }
          } else {
            gatewaySelectDeviceMap[deviceMap[uniId.split(':')[0]].gatewayId] = [
              {
                ...deviceMap[uniId.split(':')[0]],
                switchInfoDTOList: [{ switchId: uniId.split(':')[1] } as unknown as Device.MzgdPanelSwitchInfoDTO],
              },
            ]
          }
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
          // method: controlData.length > 1 ? 'panelControl' : 'panelSingleControl', // todo: 有问题
          method: 'panelSingleControl',
          inputData: controlData,
        })
      })
    },
    async lightSendDeviceControl(type: 'colorTemp' | 'level' | 'onOff', OnOff?: number) {
      const deviceMap = deviceStore.deviceMap
      // 拿出选中的设备
      const selectLightDevice: Device.DeviceItem[] = []
      deviceStore.selectList
        .filter((uniId) => !uniId.includes(':'))
        .forEach((deviceId) => {
          if (deviceMap[deviceId].proType === proType.light) {
            selectLightDevice.push(deviceMap[deviceId])
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
    handleLevelDrag(e: { detail: { value: number } }) {
      this.setData({
        'lightInfoInner.Level': e.detail.value,
      })
    },
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
    handleColorTempDrag(e: { detail: { value: number } }) {
      this.setData({
        'lightInfoInner.ColorTemp': e.detail.value,
      })
    },
    handleAllOn() {
      if (this.data.tab === 'light') {
        this.lightSendDeviceControl('onOff', 1)
      } else if (this.data.tab === 'switch') {
        this.switchSendDeviceControl(1)
      }
    },
    handleAllOff() {
      if (this.data.tab === 'light') {
        this.lightSendDeviceControl('onOff', 0)
      } else if (this.data.tab === 'switch') {
        this.switchSendDeviceControl(0)
      }
    },
  },
})
