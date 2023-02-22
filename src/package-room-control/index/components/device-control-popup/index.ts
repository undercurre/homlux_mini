import { storage } from '../../../../utils/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceBinding, deviceStore } from '../../../../store/index'
import { proName, proType } from '../../../../config/index'
import { controlDevice } from '../../../../apis/index'

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
      observer() {},
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
    barWidth: 0,
    isRender: false,
    tab: '' as '' | 'light' | 'switch' | 'curtain',
    lightInfoInner: {
      Level: 10,
      ColorTemp: 20,
      maxColorTempK: 6000,
      minColorTempK: 2400,
    },
    curtainInfo: {
      left: 50,
      right: 50,
    },
    linkType: '',
    linkList: [] as string[],
    showLinkPopup: false,
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
    deviceIdTypeMap(data): Record<string, string> {
      if (data.deviceList) {
        return Object.fromEntries(
          data.deviceList.map((device: Device.DeviceItem) => [device.deviceId, proName[device.proType]]),
        )
      }
      return {}
    },
    deviceIdInfoMap(data): Record<string, Device.DeviceItem> {
      if (data.deviceList) {
        return Object.fromEntries(data.deviceList.map((device: Device.DeviceItem) => [device.deviceId, device]))
      }
      return {}
    },
    lightDeviceMap(data): Record<string, boolean> {
      if (data.deviceList) {
        return Object.fromEntries(
          data.deviceList
            .filter((device: Device.DeviceItem) => device.proType === proType['light'])
            .map((device: Device.DeviceItem) => [device.deviceId, true]),
        )
      }
      return {}
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
      const _componentHeight = 776 * divideRpxByPx
      let _minHeight = 0
      if (bottomBarHeight === 0) {
        bottomBarHeight = 32 // 如果没有高度，就给个高度，防止弹窗太贴底部
      }
      _minHeight = divideRpxByPx * 60 + bottomBarHeight
      this.data._minHeight = _minHeight
      this.data._componentHeight = _componentHeight
      this.data._bottom = _minHeight - _componentHeight
      this.data._wfullpx = divideRpxByPx * 750
      this.data._divideRpxByPx = divideRpxByPx
      this.setData({
        barWidth: 686 * divideRpxByPx,
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleBarTap() {
      const from = this.properties.popup ? 0 : this.data._bottom
      const to = this.properties.popup ? this.data._bottom : 0

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
        () => {
          this.triggerEvent('popMove')
        },
      )
    },
    handleSwitchLinkPopup(e: { currentTarget: { dataset: { link: string } } }) {
      this.setData({
        linkType: e.currentTarget.dataset.link,
        showLinkPopup: true,
      })
    },
    handleTabTap(e: { currentTarget: { dataset: { tab: 'light' | 'switch' | 'curtain' } } }) {
      this.setData({
        tab: e.currentTarget.dataset.tab,
      })
    },
    async sendDeviceControl(type: 'colorTemp' | 'level' | 'onOff', OnOff?: number) {
      // 拿出选中的设备
      const selectLightdevice: Device.DeviceItem[] = []
      deviceStore.selectList.forEach((deviceId) => {
        if (this.data.lightDeviceMap[deviceId]) {
          selectLightdevice.push(this.data.deviceIdInfoMap[deviceId])
        }
      })
      // 按照网关区分
      const gatewaySelectDeviceMap: Record<string, Device.DeviceItem[]> = {}
      selectLightdevice.forEach((device) => {
        if (gatewaySelectDeviceMap[device.gatewayId]) {
          gatewaySelectDeviceMap[device.gatewayId].push(device)
        } else {
          gatewaySelectDeviceMap[device.gatewayId] = [device]
        }
      })
      const controlTask = [] as Promise<unknown>[]
      // 给每个网关的灯下发
      Object.entries(gatewaySelectDeviceMap).forEach((entries) => {
        if (type === 'level') {
          controlTask.push(
            controlDevice({
              topic: '/subdevice/control',
              deviceId: entries[0],
              method: 'lightControl',
              inputData: entries[1].map((devive) => ({
                devId: devive.deviceId,
                ep: 1,
                Level: this.data.lightInfoInner.Level,
              })),
            }),
          )
        } else if (type === 'colorTemp') {
          controlTask.push(
            controlDevice({
              topic: '/subdevice/control',
              deviceId: entries[0],
              method: 'lightControl',
              inputData: entries[1].map((devive) => ({
                devId: devive.deviceId,
                ep: 1,
                ColorTemp: this.data.lightInfoInner.ColorTemp,
              })),
            }),
          )
        } else {
          controlTask.push(
            controlDevice({
              topic: '/subdevice/control',
              deviceId: entries[0],
              method: 'lightControl',
              inputData: entries[1].map((devive) => ({
                devId: devive.deviceId,
                ep: 1,
                OnOff,
              })),
            }),
          )
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
      this.sendDeviceControl('level')
    },
    handleLevelDragEnd() {
      this.sendDeviceControl('level')
    },
    handleColorTempDragEnd() {
      this.sendDeviceControl('colorTemp')
    },
    handleColorTempChange(e: { detail: number }) {
      this.setData({
        'lightInfoInner.ColorTemp': e.detail,
      })
      this.sendDeviceControl('colorTemp')
    },
    handleColorTempDrag(e: { detail: { value: number } }) {
      this.setData({
        'lightInfoInner.ColorTemp': e.detail.value,
      })
    },
    handleAllOn() {
      this.sendDeviceControl('onOff', 1)
    },
    handleAllOff() {
      this.sendDeviceControl('onOff', 0)
    },
    handleLinkPopupClose() {
      this.setData({
        showLinkPopup: false,
      })
    },
    handleLinkPopupConfirm(e: { detail: string[] }) {
      this.setData({
        showLinkPopup: false,
        linkList: e.detail,
      })
    },
  },
})
