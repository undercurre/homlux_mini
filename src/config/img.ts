// import { getEnv } from './index'

//小程序（图片存放）
const domain = 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux'

// const imgBaseUrl = `${domain}/${getEnv() === 'sit' || getEnv() == 'dev' ? 'sit' : 'prod'}`

export const ShareImgUrl = `${domain}/welcome.png`

export const meijuImgDir = `${domain}/meiju`

// https://www.smartmidea.net/projects/sit/meiju-lite-assets/shareImg/meiju/addDeviceAboutImg/ic_2.4GHzremind@3x.png
// 美居配网迁移的图片
export const imgList = {
  linkGuide: `${meijuImgDir}/addDevice/wifi_img_lianjiezhiyin.png`,
  wifiConnect: `${meijuImgDir}/addDevice/wifi_ic_img_connect.png`,
  questino: `${meijuImgDir}/addDevice/ic_2.4GHzremind@3x.png`,
}
