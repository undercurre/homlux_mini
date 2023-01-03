import { configure } from 'mobx-miniprogram'
export { global } from './global'
export { user } from './user'
export { room } from './room'

configure({ enforceActions: 'observed' })
