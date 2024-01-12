export const sceneMap = {
  'all-on': {
    value: 'all-on',
    name: '全开',
    isDefault: true,
  },
  'all-off': {
    value: 'all-off',
    name: '全关',
    isDefault: true,
  },
  bright: {
    value: 'bright',
    name: '明亮',
    isDefault: true,
  },
  mild: {
    value: 'mild',
    name: '柔和',
    isDefault: true,
  },
  general: {
    value: 'general',
    name: '通用',
    isDefault: false,
  },
  catering: {
    value: 'catering',
    name: '餐饮',
    isDefault: false,
  },
  'go-home': {
    value: 'go-home',
    name: '回家',
    isDefault: false,
  },
  'leave-hoom': {
    value: 'leave-hoom',
    name: '离家',
    isDefault: false,
  },
  leisure: {
    value: 'leisure',
    name: '休闲',
    isDefault: false,
  },
  movie: {
    value: 'movie',
    name: '观影',
    isDefault: false,
  },
  night: {
    value: 'night',
    name: '夜灯',
    isDefault: false,
  },
  read: {
    value: 'read',
    name: '阅读',
    isDefault: false,
  },
}

export const sceneList = Object.entries(sceneMap)

export const autoSceneIconList = Array.from({ length: 16 }, (_, i) => `icon-${i + 1}`)

export const adviceSceneNameList = ['回家', '离家', '就餐', '会客', '睡眠', '晨起', '阅读', '观影']

export const scenePropertyOptions = {
  power: [
    { title: '关闭', key: 'power', value: 0 },
    { title: '开启', key: 'power', value: 1 },
  ],
  acMode: [
    { title: '不设置', key: 'mode', value: '' },
    { title: '自动', key: 'mode', value: 'auto' },
    { title: '制冷', key: 'mode', value: 'cool' },
    { title: '制热', key: 'mode', value: 'heat' },
    { title: '送风', key: 'mode', value: 'fan' },
    { title: '除湿', key: 'mode', value: 'dry' },
  ],
  acTemperature: Array.from({ length: 15 }, (_, i) => ({
    title: i === 0 ? '不设置' : `${i + 16}℃`,
    value: i === 0 ? i : i + 16,
    key: 'temperature',
  })),
  acWindSpeed: [
    { title: '不设置', key: 'wind_speed', value: 0 },
    { title: '自动', key: 'wind_speed', value: 102 },
    { title: '1档', key: 'wind_speed', value: 40 },
    { title: '2档', key: 'wind_speed', value: 60 },
    { title: '3档', key: 'wind_speed', value: 80 },
  ],
}
