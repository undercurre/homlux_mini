/**
 * 校验输入的是否非法，合法字符中文、英文、数字
 */
export function checkInputNameIllegal(input: string) {
  return /[^a-zA-Z0-9\u4E00-\u9FA5]/g.test(input)
}
