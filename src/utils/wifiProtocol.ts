import { aesUtil, strUtil } from '../utils/index'

export const wifiProtocol = {
  encodeCmd(params: { topic: string; data: IAnyObject; key: string }) {
    const message = aesUtil.encrypt(
      JSON.stringify({
        reqId: Date.now().toString(), //随机数
        topic: params.topic, //指令名称:获取网关IP
        data: params.data,
      }),
      params.key,
    )

    return strUtil.hexStringToArrayBuffer(message)
  },

  decodeCmd(message: ArrayBuffer, key: string) {
    const msg = strUtil.ab2hex(message)

    console.log('udpClient.onMessage', msg)

    const reply = aesUtil.decrypt(msg, key)

    return JSON.parse(reply) as IAnyObject
  },
}
