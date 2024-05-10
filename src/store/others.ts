import { observable, runInAction } from 'mobx-miniprogram'
import { emitter } from '../utils/eventBus'

export const othersStore = observable({
  isInit: false,
  defaultPage: '', // 默认首页 'index' || 'remoter' || 'mine'

  setIsInit(value: boolean) {
    runInAction(() => {
      this.isInit = value
    })
    emitter.emit('pageDataSync')
  },

  setDefaultPage(value: string) {
    runInAction(() => {
      this.defaultPage = value
    })
  },
})

export const othersBinding = {
  store: othersStore,
  fields: ['isInit'],
  actions: [],
}
