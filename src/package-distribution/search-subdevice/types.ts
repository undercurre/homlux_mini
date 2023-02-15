export interface IBleDevice {
  deviceUuid: string
  mac: string
  name: string
  icon: string
  isChecked?: boolean // 是否被选中
}
