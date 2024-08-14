import { observable, runInAction } from 'mobx-miniprogram'

export const doorLockStore = observable({
  // 门锁信息
  doorLockInfo: {} as DoorLock.DoorLockItem,

  doorOnline: false,

  /**
   * 主动更新门锁信息
   */
  updateReport() {
    runInAction(() => {
      this.doorOnline = true
    })
  },
})

export const deviceBinding = {
  store: doorLockStore,
  fields: ['doorOnline'],
  actions: [],
}
