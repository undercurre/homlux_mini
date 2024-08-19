import { homluxOssUrl } from './img'

/**
 * 隐私协议文档等配置文件
 */
export const DOC_List: IDoc[] = [
  {
    label: '隐私协议',
    url: `${homluxOssUrl}/downloadFile/美的照明HOMLUX隐私协议.docx`,
    isShowLogin: true,
  },
  {
    label: '软件许可及用户服务协议',
    url: `${homluxOssUrl}/downloadFile/软件许可及用户服务协议-美的照明.docx`,
    isShowLogin: true,
  },
  {
    label: '美的智能门锁隐私协议',
    url: `${homluxOssUrl}/downloadFile/美的智能门锁隐私协议.doc`,
    isShowLogin: true,
  },
  {
    label: '权限列表',
    url: `${homluxOssUrl}/downloadFile/美的照明权限列表.xlsx`,
  },
  {
    label: '已收集个人信息清单',
    url: `${homluxOssUrl}/downloadFile/已收集个人信息清单-美的照明.xlsx`,
  },
  {
    label: '第三方共享个人信息清单',
    url: `${homluxOssUrl}/downloadFile/第三方共享个人信息清单-美的照明.xlsx`,
  },
]

interface IDoc {
  label: string // 文件名称
  url: string // 文件链接
  isShowLogin?: boolean // 是否在登录时展示，不设置则默认false
}
