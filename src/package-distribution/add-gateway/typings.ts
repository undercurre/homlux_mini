export type StatusName = 'linking' | 'networking' | 'success' | 'error'

export interface IPageData {
  status: StatusName
  currentStep: string
}
