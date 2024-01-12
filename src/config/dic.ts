/**
 * 字典表文件
 */
interface AirConditionerMode {
  [key: string]: string
}
export const airConditionerMode: AirConditionerMode = {
  auto: '自动',
  cool: '制冷',
  heat: '制热',
  fan: '送风',
  dry: '除湿',
}
