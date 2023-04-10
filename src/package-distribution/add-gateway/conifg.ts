type StatusName = 'linking' | 'networking' | 'success' | 'error' | 'bind'

export interface IPageData {
  status: StatusName
}

export const stepListForBind = [
  {
    text: '连接设备',
  },
  {
    text: '设备联网',
  },
  {
    text: '账号绑定',
  },
]

export const stepListForChangeWiFi = [
  {
    text: '连接设备',
  },
  {
    text: '设备联网',
  },
]
