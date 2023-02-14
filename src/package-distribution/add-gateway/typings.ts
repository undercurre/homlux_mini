export type StatusName = 'linking' | 'networking' | 'success' | 'error' | 'bind'

export interface IPageData {
  status: StatusName
  currentStep: string
}
