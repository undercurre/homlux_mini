export const ble = {
  transferBroadcastData(msgStr: string) {
    const macStr = msgStr.substr(6, 12)
    let arr = []

    for (let i = 0; i < macStr.length; i = i + 2) {
      arr.push(macStr.substr(i, 2).toUpperCase())
    }

    arr = arr.reverse()

    return {
      brand: msgStr.substr(0, 4),
      isConfig: msgStr.substr(4, 2),
      mac: arr.join(':'),
      deviceCategory: msgStr.substr(18, 2),
      deviceModel: msgStr.substr(20, 2),
      version: msgStr.substr(22, 2),
      protocolVersion: msgStr.substr(24, 2),
    }
  },

  getCheckNum(msgArr: Array<number>) {
    let sum = 0

    for(let i=0;i < msgArr.length - 1;i++) {
      sum += msgArr[i]
    }

    sum = ~sum
    sum +=1

    return sum
  }
}
