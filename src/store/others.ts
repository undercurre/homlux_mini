import { observable } from 'mobx-miniprogram'

export const othersStore = observable({})

export const othersBinding = {
  store: othersStore,
  fields: [],
  actions: [],
}
