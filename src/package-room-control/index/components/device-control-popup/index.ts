import { storage } from '../../../../utils/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceBinding, deviceStore, sceneStore } from '../../../../store/index'
import { maxColorTempK, minColorTempK, proType } from '../../../../config/index'
import { controlDevice, createAssociated, delAssociated, updateAssociated, updateScene } from '../../../../apis/index'
import {
  transformSwitchToNormal,
  removeSwitchRel,
  transformSwitchToLinkLight,
  removeLightRel,
} from '../../../utils/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'

let throttleTimer = 0

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
        this.updateCurrentLinkTypeDesc()
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
    selectLinkType: '' as '' | 'light' | 'switch' | 'scene',
    /** 已选中设备或场景 */
    linkSelectList: [] as string[],
    showLinkPopup: false,
    showSelectLinkPopup: false,
    relId: {
      switchRelId: '',
      lightRelId: '',
    },
    selectSwitchUniId: '',
    allOnPress: false,
    allOffPress: false,
    currentLinkTypeDesc: '未关联',
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
        'lightInfoInner.Level': value.Level ?? 0,
        'lightInfoInner.ColorTemp': value.ColorTemp ?? 0,
      })
    },
    isEditSelectMode(value) {
      this.popupMove(deviceStore.selectList, value)
    },
    selectList(value) {
      this.popupMove(value, deviceStore.isEditSelectMode)
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
    allRoomDeviceList() {
      this.updateCurrentLinkTypeDesc()
    },
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
      const _componentHeight = 716 * divideRpxByPx
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
    popupMove(selectList: string[], isEditMode: boolean) {
      this.updateCurrentLinkTypeDesc()
      const from = -this.data._componentHeight
      const to = this.properties.popup ? 0 : this.data._bottom
      if (this.data._componentHeight === 0) {
        this.data._bottom = -this.data._componentHeight
        return // 这时候还没有第一次渲染，from是0，不能正确执行动画
      }
      if (isEditMode) {
        if (this.data.isRender) {
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
      } else {
        if (selectList.length > 0 && !this.data.isRender) {
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
        } else if (selectList.length === 0) {
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
      }
    },
    updateCurrentLinkTypeDesc() {
      if (deviceStore.selectList) {
        let mode = '未关联'
        const switchUniId = deviceStore.selectList.find((uniId) => uniId.includes(':'))
        if (switchUniId) {
          const rel = deviceStore.deviceRelMap[switchUniId]
          if (rel && rel.lightRelId) {
            mode = '关联灯'
          } else if (rel && rel.switchRelId) {
            mode = '关联开关'
          } else if (deviceStore.switchSceneMap[switchUniId]) {
            mode = '关联场景'
          }
        }
        this.setData({
          currentLinkTypeDesc: mode,
        })
      }
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
    handlePopup() {
      this.triggerEvent('popMove', 'up')
    },
    handleLinkPopup() {
      const deviceMap = deviceStore.allRoomDeviceMap
      const switchUniId = deviceStore.selectList.find((uniId) => uniId.includes(':'))
      // 关联设备或者场景，必须要选中一个开关
      if (!switchUniId) {
        return
      }
      if (this.data.selectLinkType === 'scene') {
        console.log('sceneStore.allRoomSceneList', sceneStore.allRoomSceneList)
        this.setData({
          list: [...sceneStore.allRoomSceneList],
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
      let linkSelectList = [] as string[]
      let list = [] as Device.DeviceItem[]
      if (this.data.selectLinkType === 'light') {
        list = deviceStore.allRoomDeviceFlattenList.filter((item) => !item.uniId.includes(':'))
        linkSelectList = list
          .filter((device) => device.lightRelId !== '' && device.lightRelId === lightRelId)
          .map((device) => device.deviceId)
      } else if (this.data.selectLinkType === 'switch') {
        list = deviceStore.allRoomDeviceFlattenList
          .filter((item) => item.uniId.includes(':'))
          .filter((item) => item.uniId !== switchUniId)
        linkSelectList = list
          .filter(
            (device) =>
              device.switchInfoDTOList[0].switchRelId && device.switchInfoDTOList[0].switchRelId === switchRelId,
          )
          .map((device) => device.uniId)
      }
      this.setData({
        list,
        linkSelectList,
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
      if (['light', 'switch'].includes(this.data.selectLinkType)) {
        this.setData({
          linkSelectList: [...this.data.linkSelectList, e.detail],
        })
      } else if (this.data.selectLinkType === 'scene') {
        const sceneId = e.detail
        const switchSceneMap = deviceStore.switchSceneMap
        if (switchSceneMap[this.data.selectSwitchUniId] === sceneId) {
          Dialog.confirm({
            message: '此开关已被其他场景使用，是否需要变更？',
            cancelButtonText: '取消',
            confirmButtonText: '变更',
            zIndex: 2000,
          }).then(async () => {
            this.setData({
              linkSelectList: [e.detail],
            })
          })
        } else {
          this.setData({
            linkSelectList: [e.detail],
          })
        }
      }
    },
    handleSelectLinkPopup() {
      if (this.data.isSelectMultiSwitch) {
        Toast({ message: '只能单选开关进行关联', zIndex: 9999 })
        return
      }
      const switchUniId = deviceStore.selectList.find((uniId) => uniId.includes(':'))
      if (switchUniId) {
        const rel = deviceStore.deviceRelMap[switchUniId]
        if (rel && rel.lightRelId) {
          this.setData({
            linkType: 'light',
          })
        } else if (rel && rel.switchRelId) {
          this.setData({
            linkType: 'switch',
          })
        } else if (deviceStore.switchSceneMap[switchUniId]) {
          this.setData({
            linkType: 'scene',
          })
        } else {
          this.setData({
            linkType: '',
          })
        }
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
    handleSelectLinkPopupConfirm(e: { detail: 'light' | 'switch' | 'scene' }) {
      this.setData({
        showSelectLinkPopup: false,
        selectLinkType: e.detail,
      })
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
    /** 关联灯 */
    async updateLightAssociate() {
      const selectSwitchUniId = this.data.selectSwitchUniId
      const deviceMap = deviceStore.allRoomDeviceMap
      const device = deviceMap[selectSwitchUniId.split(':')[0]]
      // 先查一下有没有关联开关，有先解开关联
      const rel = deviceStore.deviceRelMap[selectSwitchUniId]
      if (rel && rel.switchRelId) {
        const res = await removeSwitchRel(selectSwitchUniId.split(':')[0], selectSwitchUniId.split(':')[1])
        if (!res) {
          return
        }
      }
      // 查一下有没有关联场景，有先解开关联
      const sceneId = deviceStore.switchSceneMap[selectSwitchUniId]
      if (sceneId) {
        const res = await updateScene({
          sceneId: sceneId,
          updateType: '2',
        })
        if (!res.success) {
          Toast({
            message: '解除绑定失败',
            zIndex: 99999,
          })
          return
        }
      }

      // 取消所有已选的灯的关联
      if (this.data.linkSelectList.length === 0) {
        // 先将ButtonMode转成0
        const isSuccess = await transformSwitchToNormal(
          device.gatewayId,
          selectSwitchUniId.split(':')[0],
          Number(selectSwitchUniId.split(':')[1]),
        )
        if (!isSuccess) {
          return
        }
        if (this.data.relId.lightRelId) {
          // 删除关联
          await delAssociated({
            relType: '0',
            lightRelId: this.data.relId.lightRelId,
          })
        }
        // 删除关联后不需要执行后续逻辑
        return
      } else {
        // 根据relMap判断关联的数量，执行取消某个灯关联或者删除关联
        const relDeviceMap = deviceStore.relDeviceMap
        this.data.linkSelectList.forEach((uniId) => {
          if (deviceMap[uniId].lightRelId && deviceMap[uniId].lightRelId !== this.data.relId.lightRelId) {
            const index = relDeviceMap[deviceMap[uniId].lightRelId].findIndex((id) => id === uniId)
            relDeviceMap[deviceMap[uniId].lightRelId].splice(index, 1)
            if (relDeviceMap[deviceMap[uniId].lightRelId].length < 2) {
              // 删除关联
              delAssociated({
                relType: '0',
                lightRelId: deviceMap[uniId].lightRelId,
              })
            } else {
              removeLightRel(uniId)
            }
          }
        })
      }

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
        // 如果当前ButtomMode是0，需要转换成3
        if (device.mzgdPropertyDTOList[selectSwitchUniId.split(':')[1]].ButtonMode !== 3) {
          const isSuccess = await transformSwitchToLinkLight(
            device.gatewayId,
            selectSwitchUniId.split(':')[0],
            Number(selectSwitchUniId.split(':')[1]),
          )
          if (!isSuccess) {
            return
          }
        }
        // 创建依赖
        await createAssociated({
          deviceIds: [selectSwitchUniId, ...this.data.linkSelectList],
          relType: '0',
        })
      }
    },
    async updateSwitchAssociate() {
      const selectSwitchUniId = this.data.selectSwitchUniId
      const deviceFlattenMap = deviceStore.allRoomDeviceFlattenMap
      const device = deviceStore.allRoomDeviceMap[selectSwitchUniId.split(':')[0]]
      // 先查一下有没有关联灯，有先解开关联，然后转成普通开关
      const rel = deviceStore.deviceRelMap[selectSwitchUniId]
      if (rel && rel.lightRelId) {
        // 如果之前是关联灯，直接取消整个关联
        const res = await delAssociated({
          relType: '0',
          lightRelId: rel.lightRelId,
        })
        if (!res.success) {
          Toast({
            message: '解除绑定失败',
            zIndex: 99999,
          })
          return
        }
        const isSuccess = await transformSwitchToNormal(
          device.gatewayId,
          selectSwitchUniId.split(':')[0],
          Number(selectSwitchUniId.split(':')[1]),
        )
        if (!isSuccess) {
          Toast({
            message: '开关转换失败',
            zIndex: 99999,
          })
          return
        }
      }
      // 查一下有没有关联场景，有先解开关联
      const sceneId = deviceStore.switchSceneMap[selectSwitchUniId]
      if (sceneId) {
        const res = await updateScene({
          sceneId: sceneId,
          updateType: '2',
        })
        if (!res.success) {
          Toast({
            message: '解除绑定失败',
            zIndex: 99999,
          })
          return
        }
      }

      // 取消所有已选的开关的关联
      if (this.data.linkSelectList.length === 0) {
        // 先将ButtonMode转成0
        const isSuccess = await transformSwitchToNormal(
          device.gatewayId,
          selectSwitchUniId.split(':')[0],
          Number(selectSwitchUniId.split(':')[1]),
        )
        if (!isSuccess) {
          return
        }
        if (this.data.relId.switchRelId) {
          // 删除关联
          await delAssociated({
            relType: '1',
            switchRelId: this.data.relId.switchRelId,
          })
        }
        // 删除关联后不需要执行后续逻辑
        return
      } else {
        // 根据relMap判断关联的数量，执行取消某个灯关联或者删除关联
        const relDeviceMap = deviceStore.relDeviceMap
        this.data.linkSelectList.forEach((uniId) => {
          const switchRelId = deviceFlattenMap[uniId].switchInfoDTOList[0].switchRelId
          if (switchRelId && switchRelId !== this.data.relId.switchRelId) {
            const index = relDeviceMap[switchRelId].findIndex((id) => id === uniId)
            relDeviceMap[switchRelId].splice(index, 1)
            if (relDeviceMap[switchRelId].length < 2) {
              // 删除关联
              delAssociated({
                relType: '1',
                switchRelId,
              })
            } else {
              removeSwitchRel(uniId.split(':')[0], uniId.split(':')[1])
            }
          }
        })
      }

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
      const switchUniId = deviceStore.selectList.find((uniId) => uniId.includes(':'))
      if (!switchUniId) {
        return
      }
      const device = deviceStore.allRoomDeviceMap[switchUniId.split(':')[0]]
      const selectDevice = deviceStore.allRoomDeviceMap[switchUniId.split(':')[0]]
      const switchId = switchUniId.split(':')[1]
      // 先解开开关的其他关联
      const res = await removeSwitchRel(selectDevice.deviceId, switchId)
      if (!res) {
        return
      }
      if (
        selectDevice.mzgdPropertyDTOList[switchId].ButtonMode &&
        selectDevice.mzgdPropertyDTOList[switchId].ButtonMode === 3
      ) {
        // 关联灯模式，先转换成0
        const isSuccess = await transformSwitchToNormal(device.gatewayId, selectDevice.deviceId, Number(switchId))
        if (!isSuccess) {
          return
        }
      }
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
          Toast({
            message: '更新失败',
            zIndex: 99999,
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
      if (this.data.selectLinkType === 'light') {
        await this.updateLightAssociate()
      } else if (this.data.selectLinkType === 'switch') {
        await this.updateSwitchAssociate()
      } else if (this.data.selectLinkType === 'scene') {
        await this.updataSceneLink()
      }
      await Promise.all([
        sceneStore.updateSceneList(),
        sceneStore.updateAllRoomSceneList(),
        deviceStore.updateSubDeviceList(),
        deviceStore.updateAllRoomDeviceList(),
      ])
      this.triggerEvent('updateList')
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
      deviceStore.selectList
        .filter((id) => id.includes(':'))
        .forEach((uniId) => {
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
          // method: controlData.length > 1 ? 'panelControl' : 'panelSingleControl', // todo: 有问题
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
      deviceStore.selectList
        .filter((uniId) => !uniId.includes(':'))
        .forEach((deviceId) => {
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
  },
})
