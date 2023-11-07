import Helper from '../Helper.js'
import MeijuService from '../MeijuService'
import { requestService } from '../../../../../../utils/requestService'
import Common from '../../bluetooth/common.js'
import Event from '../../bluetooth/event.js'

let meijuService = new MeijuService()
export default class DeviceComDecorator {
  constructor(bluetoothConn, applianceCode, ctrlType) {
    // this.deviceId = deviceId;
    // this.serviceId = serviceId;
    // this.characteristicId = characteristicId;
    this.bluetoothConn = bluetoothConn
    this.useRemote = false
    this.applianceCode = applianceCode
    this.ctrlType = ctrlType // 1：蓝牙 2：wifi 3：虚拟

    this.timer = null

    this.event = new Event()
  }

  /********************************* 业务函数 *********************************/
  _queryStatus(useLoading) {
    console.log('查询设备状态')
    this.writeData(
      {
        hex: this.AcProcess.makeQueryPackage(),
        attr: {
          query_type: '',
        },
      },
      useLoading,
      '加载中...',
    )
    // this.luaQuery();
  }

  // 查新协议
  _queryStatusNewProtocol(queryType) {
    // this.newProtocolCMD = [CMD.Supercooling, CMD.CONTROLSELFCLEANING, CMD.NONDIRECTWIND];
    this.newProtocolCMD = [CMD.NONDIRECTWIND, CMD.Supercooling, CMD.CONTROLSELFCLEANING]
    // this.newProtocolCMD[CMD.Supercooling] = "";
    console.log('查新协议')
    let order = this.AcProcess.makeQueryPackage(this.newProtocolCMD)
    this.writeData(
      {
        hex: order,
        attr: {
          query_type: queryType,
        },
      },
      true,
      '加载中...',
    )
  }

  /**请求设备sn */
  querySN() {
    this.bluetoothConn.sendBizMsg({
      type: 0x07,
      body: new Uint8Array([0]),
      success: () => {
        console.log('发获取sn指令成功')
      },
    })
  }

  /** 发ssid和密码*/
  bindDeviceTest(hex) {
    // ssid ->
    console.log('wifi信息hex===', hex)
    var enDataBuf = Common.fromHexString(hex)
    console.log('wifi信息enDataBuf===', enDataBuf)
    this.bluetoothConn.sendBizMsg({
      type: 0x69,
      body: enDataBuf,
      success: () => {
        console.log('起热点指令发送成功')
      },
    })
  }

  /**testingMode 工程模式*/
  testingMode() {
    'aa24ac00000000000202404356667f7fff30000000000000000000000a80000000000573be'
    let hex = 'aa16ac00000000000203416100ff05000000001111ea87'
    var enDataBuf = Common.fromHexString(hex)
    console.log('工程模式', enDataBuf, hex)
    this.bluetoothConn.sendBizMsg({
      type: 0x20,
      body: enDataBuf,
      success: () => {
        console.log('起热点指令发送成功')
      },
    })
  }

  writeData(data, useLoading, toast, funcType, callback) {
    let hex = data.hex

    //这里使用`TypedArray视图`中`Uint8Array（无符号 8 位整数）`操作
    if (this.ctrlType == 1) {
      let useLoad = useLoading == undefined ? true : useLoading
      let toastText = toast == undefined || toast == '' ? '控制中...' : toast
      console.log(Helper.decimalArrayToHexStrArrayFormat(hex))
      let hexStr = Helper.decimalArrayToHexStrArrayFormat(hex).join('')
      console.log(hexStr, 'send data')
      if (this.timer != null) {
        clearTimeout(this.timer)
      }
      if (funcType == 'TempControl') {
        this.timer = setTimeout(() => {
          this.sendDataLogic(useLoad, hex, toastText)
        }, 300)
      } else {
        this.sendDataLogic(useLoad, hex, toastText)
      }
    } else if (this.ctrlType == 2) {
      console.log('wifi 来控制')

      let attr = data.attr
      let requestMethod = attr.query_type !== undefined ? meijuService.luaQuery : meijuService.luaControl
      if (attr.query_type === '') {
        delete attr.query_type
      }

      requestMethod(this.applianceCode, {
        ...attr,
      })
        .then((data) => {
          this.luaDataTransformer(data)

          this.event.dispatch('receiveMessageLan', data)
        })
        .catch((err) => {
          console.log(err)
          wx.showToast({
            title: '远程控制失败请检查设备是否已联网',
            icon: 'none',
          })
          // setTimeout(() => {
          //   wx.reLaunch({
          //     url: '/pages/index/index',
          //   })
          // }, 2000);
        })
    } else {
      console.log('虚拟')
    }
  }
  sendDataLogic(useLoad, hex, toastText) {
    console.log(hex)
    var enDataBuf = new Uint8Array(hex)
    if (useLoad) {
      wx.showLoading({
        title: toastText,
        duration: 3000,
      })
    }
    this.bluetoothConn.sendBizMsg({
      type: 0x20,
      body: enDataBuf,
      success: () => {
        console.log('发送指令成功')
        setTimeout(() => {
          wx.hideLoading({
            success: (res) => {},
          })
        }, 500)
      },
    })
  }

  luaDataTransformer(data) {
    let item
    let state

    for (let key in data) {
      item = [key]
      console.log(item)
      if (item !== undefined) {
        state = item.isStandardProto ? this.AcProcess.parser.sendingState : this.AcProcess.parser.newsendingState

        if (state[item.value] !== undefined) {
          if (item.key[data[key]] !== undefined) {
            state[item.value] = item.key[data[key]]
          } else {
            if (item.combinate !== undefined) {
              let comData = data[item.combinate] !== undefined ? data[item.combinate] : 0
              state[item.value] = data[key] + parseFloat(comData)
            } else {
              state[item.value] = data[key]
            }
          }
        } else if (item.reduce !== undefined) {
          for (let key_ in item.reduce) {
            state[key_] = item.reduce[key_](data[key])
          }
        }
      }
    }
  }

  /******************网络控制******************/
  luaQuery() {
    return new Promise((resolve, reject) => {
      // this.showLoading()
      let reqData = {
        applianceCode: this.applianceCode,
        command: {},
        stamp: +new Date(),
        reqId: +new Date(),
      }
      requestService
        .request('luaGet', reqData)
        .then((res) => {
          console.log(res, 'lua查询返回')
          resolve(res)
        })
        .catch((err) => {
          // this.showToast('设备网络异常', err)
          console.log('lua查询错误', JSON.stringify(err))
          // wx.showToast({
          //   title: JSON.stringify(err),
          // })
        })
    })
  }
}
