/**
 * 校验输入的是否只包含中文、英文、数字、小数点、英文中/下划线
 */
export function validateInputName(input: string) {
  return !/[^/a-zA-Z0-9\u4E00-\u9FA5]/g.test(input)
}
