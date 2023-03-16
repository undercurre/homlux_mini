import Toast from '@vant/weapp/toast/toast'
import { controlDevice, delAssociated, queryDeviceInfoByDeviceId } from '../../apis/index'
import { deviceStore } from '../../store/index'
import { delay } from '../../utils/index'

// 解开关联
export async function removeRel(deviceId: string, ep: string) {
  const rel = deviceStore.deviceRelMap[`${deviceId}:${ep}`]
  if (!rel) {
    return true
  }
  const relId = rel.lightRelId ? rel.lightRelId : rel.switchRelId!
  const relDeviceList = deviceStore.relDeviceMap[relId]
  const distSwitchList = relDeviceList.filter((uniId) => uniId !== `${deviceId}:${ep}` && uniId.includes(':'))
  if (relDeviceList.length <= 2) {
    // 只剩下2个设备关联，直接删除关联
    const res = await delAssociated({
      relType: rel.lightRelId ? '0' : '1',
      lightRelId: relId,
      switchRelId: relId,
    })
    if (res.success) {
      return true
    }
    Toast('取消关联失败')
    return false
  } else if (distSwitchList.length === 0) {
    // 只剩下一个开关绑灯，直接删除
    const res = await delAssociated({
      relType: rel.lightRelId ? '0' : '1',
      lightRelId: relId,
      switchRelId: relId,
    })
    if (res.success) {
      return true
    }
    Toast('取消关联失败')
    return false
  } else {
    // 只去除一个开关关联
    const res = await delAssociated({
      relType: rel.lightRelId ? '0' : '1',
      lightRelId: relId,
      switchRelId: relId,
      deviceIds: [`${deviceId}:${ep}`],
    })
    if (res.success) {
      return true
    }
    Toast('取消关联失败')
    return false
  }
}

export async function transformSwitchToNormal(gatewayId: string, deviceId: string, ep: number) {
  // 关联灯模式，先转换成0
  await controlDevice({
    deviceId: gatewayId,
    topic: '/subdevice/control',
    method: 'panelModeControl',
    inputData: [
      {
        ButtonMode: 0,
        ep,
        devId: deviceId,
      },
    ],
  })
  for (let index = 0; index < 6; index++) {
    const res = await queryDeviceInfoByDeviceId({
      deviceId,
    })
    if (res.success) {
      if (res.result.mzgdPropertyDTOList[ep].ButtonMode === 0) {
        return true
      } else {
        await delay(500)
        continue
      }
    } else {
      Toast('获取设备状态失败')
      return false
    }
  }
  Toast('更新设备状态失败')
  return false
}

export async function transformSwitchToLinkLight(gatewayId: string, deviceId: string, ep: number) {
  // 关联灯模式，需要下发转换成3
  await controlDevice({
    deviceId: gatewayId,
    topic: '/subdevice/control',
    method: 'panelModeControl',
    inputData: [
      {
        ButtonMode: 3,
        ep,
        devId: deviceId,
      },
    ],
  })
  for (let index = 0; index < 6; index++) {
    const res = await queryDeviceInfoByDeviceId({
      deviceId,
    })
    if (res.success) {
      if (res.result.mzgdPropertyDTOList[ep].ButtonMode === 3) {
        return true
      } else {
        await delay(500)
        continue
      }
    } else {
      Toast('获取设备状态失败')
      return false
    }
  }
  Toast('更新设备状态失败')
  return false
}
