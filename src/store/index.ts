import { configure } from 'mobx-miniprogram'
export { others, othersBinding } from './others'
export { user, userBinding } from './user'
export { room, roomBinding } from './room'
export { homeStore, homeBinding } from './home'
export { device, deviceBinding } from './device'

configure({ enforceActions: 'observed' })
