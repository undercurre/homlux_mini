import { configure } from 'mobx-miniprogram'
export { othersStore, othersBinding } from './others'
export { userStore, userBinding } from './user'
export { roomStore, roomBinding } from './room'
export { homeStore, homeBinding } from './home'
export { deviceStore, deviceBinding } from './device'
export { sceneStore, sceneBinding } from './scene'
export { autosceneStore, autosceneBinding } from './autoscene'
export { remoterStore, remoterBinding } from './remoter'

configure({ enforceActions: 'observed' })
