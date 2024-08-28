export const LOGIN_TEMPLATE_ID_LIST = [
  'dS3Bg8G1Xy90OL6cn6BgeTD7bsbXkpKLeeNSlcilX2s', // 加入家庭邀请通知
]

export const DOORLOCK_TEMPLATE_ID_LIST = [
  '9Y8Bgu2Nr2nXqzjl3iBcHqzk63GDKFuUpqU6U8DXNA4', // 有人逗留提醒
  '5E33-rFp45ZBfV23O_l866mxa1L-RbyAgx5TtDNJoHQ', // 门锁电量不足提醒
  'CiB5fBR6Hi2KzcWEBu_uXzHzTtEsgCkyyT7fj8cBYAM', // 门锁撬动告警
  'TI95cSnYE4UIbYFIpQuphx7HYCvrrEF7GFvba5i4FNs', // 门锁异常提醒
] as string[]

// CMDTYPE 到模板ID的映射
export const CMDTYPE_TO_TEMPLATE_ID = {
  '133': DOORLOCK_TEMPLATE_ID_LIST[3], // 5次后锁定
  '134': DOORLOCK_TEMPLATE_ID_LIST[2], // 门锁被撬
  '135': DOORLOCK_TEMPLATE_ID_LIST[1], // 低电量
  '136': DOORLOCK_TEMPLATE_ID_LIST[3], // 开门失败
  '137': DOORLOCK_TEMPLATE_ID_LIST[3], // 关门失败
  '159': DOORLOCK_TEMPLATE_ID_LIST[0], // 门外逗留
} as Record<string, string>

// CMDTYPE 到模板名称的映射
export const CMDTYPE_TO_TEMPLATE_NAME = {
  '133': '门锁异常提醒',
  '134': '门锁撬动告警',
  '135': '门锁电量不足提醒',
  '136': '门锁异常提醒',
  '137': '门锁异常提醒',
  '159': '有人逗留提醒',
} as Record<string, string>
