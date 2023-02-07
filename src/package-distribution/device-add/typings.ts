export type StatusName = 'networking' | 'success' | 'error' | 'bind'

export interface IPageData {
  status: StatusName
  currentStep: string
}
