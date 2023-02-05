import { observable } from 'mobx-miniprogram'

export const device = observable({
  /**
   * 选了了那些设备
   */
  selectList: [] as string[],
  /**
   * 选择了什么类型
   */
  selectType: [] as string[],
  /**
   * 选择了多少个开关
   */
  selectSwitchList: [] as string[],
})

export const deviceBinding = {
  store: device,
  fields: ['selectList', 'selectType', 'selectSwitchList'],
  actions: [],
}
