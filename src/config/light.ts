// 通用的色温设置，不能取到 productId 时兜底用
export const maxColorTempK = 6000
export const minColorTempK = 2400

// 根据 productId 判断色温
export const colorTempKRange: Record<string, number[]> = {
  'midea.hlight.001.001': [2700, 6500], // 睿逸筒灯
  'midea.hlight.002.001': [2400, 6500], // 灯带
  'midea.hlight.003.001': [2700, 6500], // 睿铂筒灯
}
