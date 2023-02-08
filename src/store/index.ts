import { configure } from 'mobx-miniprogram'
export { others, othersBinding } from './others'
export { user, userBinding } from './user'
export { room, roomBinding } from './room'
export { home, homeBinding } from './home'
export { device, deviceBinding } from './device'
export { scene, sceneBinding } from './scene'

configure({ enforceActions: 'observed' })
