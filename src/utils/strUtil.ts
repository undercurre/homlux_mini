// import Nzh from 'nzh'

// const nzhcn = Nzh.cn

export const strUtil = {
  // encodeS(num: number) {
  //   return nzhcn.encodeS(num)
  // },
  /**
   * 获取拼装参数后的完整url
   * @param url
   * @param params
   */
  getUrlWithParams(url: string, params: IAnyObject) {
    let result = ''

    Object.entries(params).forEach(([key, value]) => {
      result += `${key}=${value}&`
    })

    result = result.substring(0, result.length - 1) //末尾是&
    return result ? `${url}?${result}` : url
  },

  /**
   * 获取url的拼接参数
   * @param url
   */
  getUrlParams(url: string) {
    const theRequest: IAnyObject = {}
    if (url.indexOf('?') != -1) {
      const queryString = url.substr(url.indexOf('?') + 1)
      const strs = queryString.split('&')
      for (let i = 0; i < strs.length; i++) {
        theRequest[strs[i].split('=')[0]] = unescape(strs[i].split('=')[1])
      }
    }
    return theRequest
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
