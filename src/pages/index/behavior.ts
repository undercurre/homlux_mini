import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { global, user } from '../../store/index'

export const mobxBehavior = BehaviorWithStore({
  storeBindings: [
    {
      store: global,
      fields: ['homeList', 'currentHomeId', 'isLoadedSvg'],
      actions: ['setIsLoadSvg', 'setShowTabbar'],
    },
    {
      store: user,
      fields: ['userInfo'],
      actions: [],
    },
  ],
})
