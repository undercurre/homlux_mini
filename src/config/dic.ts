/**
 * 字典表文件
 */
export const AC_MODE = {
  auto: '自动',
  cool: '制冷',
  heat: '制热',
  fan: '送风',
  dry: '抽湿',
} as Record<string, string>

export const CAC_MODE = {
  mode_1: '制冷',
  mode_2: '除湿',
  mode_4: '送风',
  mode_8: '制热',
} as Record<string, string>

// 485空调模式图标映射
export const MODE_ICON_MAP = {
  1: 'cool',
  2: 'dry',
  4: 'fan',
  8: 'heat',
} as Record<string, string>

// 485空调风速图标映射
export const WIND_ICON_MAP = {
  1: 'wind_3',
  2: 'wind_2',
  4: 'wind_1',
} as Record<string, string>

export const CAC_FA_WINDSPEED = {
  windSpeed_1: '3档',
  windSpeed_2: '2档',
  windSpeed_4: '1档',
} as Record<string, string>

// 风扇灯 风速->档位
export const WIND_SPEED_MAP = {
  1: 1,
  21: 2,
  41: 3,
  61: 4,
  81: 5,
  100: 6,
} as Record<number, number>

// 风扇灯 风速场景key-> 场景名
export const FAN_SCENE_MAP = {
  breathing_wind: '自然风',
  fanmanual: '手动模式',
} as Record<string, string>
