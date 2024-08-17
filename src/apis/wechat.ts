/**
 * 查询用户信息
 */

export async function wxRequestSubscribeMessage(tmplIds: string[]) {
  return new Promise<WechatMiniprogram.RequestSubscribeMessageSuccessCallbackResult>((resolve, reject) =>
    wx.requestSubscribeMessage({
      tmplIds,
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        reject(err)
      },
    }),
  )
}
