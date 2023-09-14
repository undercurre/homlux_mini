import { observable, runInAction } from 'mobx-miniprogram'
import { storage } from '../utils/index'
import { deviceConfig } from '../config/remoter'

export const remoterStore = observable({
  // 我的设备列表，只需要保存部分属性
  remoterList: [] as Remoter.DeviceItem[],

  // 遥控器状态映射（目前仅包括发现状态）
  listState: {} as Record<string, boolean>,

  // 当前详情页 addr
  curAddr: '',

  // 列表加载状态
  loaded: false,

  get hasRemoter(): boolean {
    return this.remoterList?.length > 0
  },

  // 所有的地址列表
  get deviceAddrs(): string[] {
    return this.remoterList.map((device) => device.addr)
  },

  // 所有的名称列表
  get deviceNames(): string[] {
    return this.remoterList.map((device) => device.deviceName)
  },

  get remoterMap(): Record<string, Remoter.DeviceItem> {
    return Object.fromEntries(this.remoterList.map((device) => [device.addr, device]))
  },

  // 我的设备列表，用于列表视图展示
  get remoterViewList(): Remoter.DeviceItem[] {
    const list = [...this.remoterList]
    return list
      .map((device) => {
        const { deviceModel, deviceType, addr } = device
        const { devicePic, actions } = deviceConfig[deviceType][deviceModel]

        return {
          ...device,
          dragId: addr,
          devicePic,
          switchStatus: 'off', // TODO
          actions,
          // switchType: actions[0].name!,
          // switchKey: actions[0].key!,

          saved: true,
          connected: false,
          discovered: this.listState[addr],
        }
      })
      .sort((a, b) => a.orderNum! - b.orderNum!)
  },

  // 当前遥控器信息
  get curRemoter(): Remoter.DeviceDetail {
    if (!this.curAddr) {
      return {} as Remoter.DeviceDetail
    }
    const device = this.remoterMap[this.curAddr]
    const { deviceModel, deviceType } = device
    if (!deviceModel || !deviceType) {
      return {} as Remoter.DeviceDetail
    }
    const config = deviceConfig[deviceType][deviceModel]
    return {
      ...config,
      ...device,
    }
  },

  // 从本地缓存初始化/重置【我的设备】列表
  retrieveRmStore() {
    const list = (storage.get('remoterListLS') ?? []) as Remoter.DeviceItem[]

    runInAction(() => {
      this.remoterList = list
    })
  },

  // 更新遥控器状态
  renewRmState(discoveredList: string[]) {
    const state = {} as Record<string, boolean>
    this.remoterList.forEach(({ addr }) => {
      state[addr] = discoveredList.includes(addr)
    })
    runInAction(() => {
      this.listState = state
    })
  },

  // 更新当前进入的详情页地址
  setAddr(addr: string) {
    runInAction(() => {
      this.curAddr = addr
    })
  },

  // 修改当前遥控器名称
  renameCurRemoter(deviceName: string) {
    const index = this.remoterList.findIndex((d) => d.addr === this.curAddr)
    if (index === -1) {
      return
    }

    runInAction(() => {
      this.remoterList[index].deviceName = deviceName
    })
    storage.set('remoterListLS', this.remoterList)
  },

  // 修改当前遥控器默认首页开关
  changeAction(key: number) {
    const index = this.remoterList.findIndex((d) => d.addr === this.curAddr)
    if (index === -1) {
      return
    }

    runInAction(() => {
      this.remoterList[index].defaultAction = key
    })
    storage.set('remoterListLS', this.remoterList)
  },

  // 删除当前遥控器
  removeCurRemoter() {
    const index = this.remoterList.findIndex((device) => device.addr === this.curAddr)
    const list = this.remoterList.splice(index, 1)
    runInAction(() => {
      this.remoterList = list
    })
    storage.set('remoterListLS', list)
  },

  // 整体更新【我的设备】列表，并保存到本地缓存 // TODO 过滤元素，优化类型定义
  saveRmStore(list: Remoter.DeviceItem[]) {
    runInAction(() => {
      this.remoterList = list
    })
    storage.set('remoterListLS', list)
  },

  // 添加新的设备 // TODO 过滤元素，优化类型定义
  addRemoter(device: Remoter.DeviceItem) {
    const list = [...this.remoterList, device]
    storage.set('remoterListLS', list)
    runInAction(() => {
      this.remoterList.push(device)
    })
  },
})

export const remoterBinding = {
  store: remoterStore,
  fields: ['hasRemoter', 'remoterViewList', 'curRemoter'],
  actions: [],
}
