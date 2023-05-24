import Toast from '@vant/weapp/toast/toast'
import { delAssociated } from '../../apis/index'
import { deviceStore } from '../../store/index'

// 开关解开关联
export async function removeSwitchRel(deviceId: string, ep: string) {
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
