import { observable } from 'mobx-miniprogram'

export const device = observable({
  selectList: [] as string[],
  selectType: [] as string[],
})

export const deviceBinding = {
  store: device,
  fields: ['selectList', 'selectType'],
  actions: [],
}
