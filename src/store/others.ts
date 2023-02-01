import { observable, runInAction } from 'mobx-miniprogram'

export const others = observable({
  isLoadedSvg: false,
  setIsLoadSvg: function () {
    runInAction(() => {
      others.isLoadedSvg = true
    })
  },
})

export const othersBinding = {
  store: others,
  fields: ['isLoadedSvg'],
  actions: ['setIsLoadSvg'],
}
