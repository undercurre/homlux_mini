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

/**
 * 下载并打开文档
 */
export async function wxOpenDocs(url: string) {
  return new Promise<WechatMiniprogram.GeneralCallbackResult>((resolve, reject) =>
    wx.downloadFile({
      url,
      success: function (res) {
        const filePath = res.tempFilePath
        wx.openDocument({
          filePath,
          success: function (res) {
            console.log('打开文档成功', res)
            resolve(res)
          },
          fail: function (err) {
            reject(err)
          },
        })
      },
    }),
  )
}
