import { configure } from 'mobx-miniprogram'
export { othersStore, othersBinding } from './othersStore'
export { userStore, userBinding } from './userStore'
export { roomStore, roomBinding } from './roomStore'
export { homeStore, homeBinding } from './home'
export { deviceStore, deviceBinding } from './deviceStore'
export { sceneStore, sceneBinding } from './sceneStore'

configure({ enforceActions: 'observed' })
