declare namespace DoorLock {
  interface StateData {
    electronicLock: number // 电子反锁状态
    intelligentScene: number // 智能模式（省电模式反转）
  }

  // transmit接口返回的结构
  interface DoorLockItem {
    doorOnline: '0' | '1' | '2' // 品类服保存的门锁在离线状态，比美居更及时
    event: {
      stateData: StateData
    }
  }
}
