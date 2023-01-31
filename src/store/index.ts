import { configure } from 'mobx-miniprogram'
export { others, othersBinding } from './others'
export { user, userBinding } from './user'
export { room, roomBinding } from './room'

configure({ enforceActions: 'observed' })
