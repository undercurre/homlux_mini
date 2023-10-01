import Dialog from '../../../../miniprogram_npm/m-ui/mx-dialog/dialog'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paths = require('../../../utils/paths')
const commonDialog = {
  /**
   * 查看指引通用方法
   * @param {*} obj
   * obj: {
   *  title: '',
   *  message: '',
   *  type: 'location',
   *  permissionTypeList: ''
   * }
   */
  showCommonDialog(obj) {
    Dialog.confirm({
      title: obj.title || '',
      message: obj.message,
      confirmButtonText: obj.confirmButtonText,
      confirmButtonColor: obj.confirmButtonColor,
      cancelButtonColor: obj.cancelButtonColor,
      messageAlign: 'left',
    })
      .then((res) => {
        if (res.action == 'confirm') {
          if (obj.type == 'location') {
            wx.navigateTo({
              url: paths.locationGuide + `?permissionTypeList=${JSON.stringify(obj.permissionTypeList)}`,
            })
          }
          if (obj.type == 'blue') {
            wx.navigateTo({
              url: paths.blueGuide + `?permissionTypeList=${JSON.stringify(obj.permissionTypeList)}`,
            })
          }
        }
        // on confirm
      })
      .catch(() => {
        // on cancel
      })
  },
}

module.exports = {
  commonDialog,
}
