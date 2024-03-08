import { deviceStore, homeStore } from '../store/index'
import homOs from 'js-homos'
import { Logger, emitter, debounce } from './index'

export async function initHomeOs() {
  if (!homeStore.currentHomeId) {
    Logger.debug('initHomeOs终止, homeStore.currentHomeId:', homeStore.currentHomeId)
    return
  }
  await homeStore.initLocalKey()

  // 调试阶段可写死传递host参数，PC模拟调试
  homOs.login({
    homeId: homeStore.currentHomeDetail.houseId,
    key: homeStore.key,
    // host: { ip: '192.168.0.37', devId: '1701438900167637', SSID: 'test' },
  })

  homOs.onMessage((res: { topic: string; reqId?: string; data: IAnyObject; ts: string }) => {
    const { topic, reqId, data } = res

    // 子设备状态变更
    if (topic === '/local/subDeviceStatus') {
      const deviceInfo = data.deviceStatusInfoList[0]

      emitter.emit('msgPush', {
        source: 'mqtt',
        reqId: reqId,
        result: {
          eventType: 'device_property',
          eventData: {
            deviceId: deviceInfo.devId,
            event: deviceInfo.deviceProperty,
            modelName: deviceInfo.modelName,
          },
        },
      })
    } else if (topic === 'updateDeviceListLan' || topic === 'updateGroupListLan') {
      updateHomeDataLanInfo() // 防抖处理
    } else {
      Logger.console('➤ 未处理的mqtt推送：', res)
    }
  })
}

/**
 * 局域网家庭设备、灯组数据更新
 */
const updateHomeDataLanInfo = debounce(() => {
  Logger.console('局域网家庭数据更新执行')
  deviceStore.updateAllRoomDeviceListLanStatus()
  emitter.emit('msgPush', {
    source: 'mqtt',
    result: {
      eventType: 'updateHomeDataLanInfo',
      eventData: {},
    },
  })
}, 2000)
