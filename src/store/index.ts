import { configure } from 'mobx-miniprogram'
export { others, othersBinding } from './others'
export { user, userBinding } from './user'
export { room, roomBinding } from './room'
export { home, homeBinding } from './home'

configure({ enforceActions: 'observed' })
