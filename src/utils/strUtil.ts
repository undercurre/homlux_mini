export const strUtil = {
  /**
   * 获取拼装参数后的完整url
   * @param url
   * @param params
   */
  getUrlWithParams(url: string, params: Record<string, string | number> = {}) {
    let result = ''

    Object.entries(params).forEach(([key, value]) => {
      result += `${key}=${value}&`
    })

    result = result.substring(0, result.length - 1) //末尾是&
    return result ? `${url}?${result}` : url
  },
  /**
   * 16进制字符串转ArrayBuffer
   * @param str
   */
  hexStringToArrayBuffer: (str: string) => {
    if (!str) {
      return new ArrayBuffer(0)
    }
    const buffer = new ArrayBuffer(str.length / 2)
    const dataView = new DataView(buffer)
    let ind = 0
    for (let i = 0, len = str.length; i < len; i += 2) {
      const code = parseInt(str.substr(i, 2), 16)
      dataView.setUint8(ind, code)
      ind++
    }
    return buffer
  },
  // ArrayBuffer转16进制字符串示例
  ab2hex(buffer: ArrayBuffer) {
    const hexArr = Array.prototype.map.call(new Uint8Array(buffer), function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    })
    return hexArr.join('')
  },
}
