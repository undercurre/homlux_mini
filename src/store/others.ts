import { observable, runInAction } from 'mobx-miniprogram'

export const othersStore = observable({
  isInit: false,

  setIsInit() {
    runInAction(() => {
      this.isInit = true
    })
  },
})

export const othersBinding = {
  store: othersStore,
  fields: ['isInit'],
  actions: [],
}
