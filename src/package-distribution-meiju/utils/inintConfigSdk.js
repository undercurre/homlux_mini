/*
 * @desc: sdk升级配置文件
 * @author: zhucc22
 * @Date: 2023-07-11 14:03:36
 */
import requestService from 'm-miniBaseSDK/requestService'
import pluginTrack from 'm-miniBaseSDK/pluginTrack'
import deviceSubscribe from 'm-miniBaseSDK/deviceSubscribe'
import { api } from '../api'
import config from '../common/js/config'
import trackApiList from '../track/oneKeyTrack/config/trackApiList.js'
import { authorizedCommonTrack, trackLoaded, getCustomParam } from '../track/track.js'
import cloudMethods from '../globalCommon/js/cloud.js'
import trackConfig from '../track/oneKeyTrack/config/index.js'
import { deviceImgMap } from './deviceImgMap'
import { clickEventTracking } from '../track/track.js'
import { modelIds, templateIds, faultTemplate, jumpCleanBuy, disposableInfo } from '../globalCommon/js/templateIds'

//初始化插件埋点sdk
const pluginTrackSdkInit = new pluginTrack({
  getCustomParam: getCustomParam,
  trackConfig: trackConfig,
  config: config,
})
//初始化接口请求sdk
const requestServiceInit = new requestService({
  api: api,
  config: config,
  trackApiList: trackApiList,
  authorizedCommonTrack: authorizedCommonTrack,
  trackLoaded: trackLoaded,
  deviceImgMap: deviceImgMap,
  cloudMethods: cloudMethods,
  pluginRequestTrack: pluginTrackSdkInit.pluginRequestTrack,
})
//初始化消息推送sdk
const deviceSubscribeInit = new deviceSubscribe({
  requestService: requestServiceInit.requestService,
  rangersBurialPoint: requestServiceInit.rangersBurialPoint,
  clickEventTracking: clickEventTracking,
  templateIds: templateIds,
  getDeviceSn: pluginTrackSdkInit.getDeviceSn,
})

const globalCommonConfig = {
  requestService: requestServiceInit.requestService,
  uploadFileTask: requestServiceInit.uploadFileTask,
  requestBurialPoint: requestServiceInit.requestBurialPoint,
  rangersBurialPoint: requestServiceInit.rangersBurialPoint,
  pluginApiTrack: requestServiceInit.pluginApiTrack,
  pluginTrack: pluginTrackSdkInit,
  pluginRequestTrack: pluginTrackSdkInit.pluginRequestTrack,
  pluginEventTrack: pluginTrackSdkInit.pluginEventTrack,
  clickEventPluginTracking: pluginTrackSdkInit.clickEventPluginTracking,
  getDeviceInfo: pluginTrackSdkInit.getDeviceInfo,
  setPluginDeviceInfo: pluginTrackSdkInit.setPluginDeviceInfo,
  getDeviceSn: pluginTrackSdkInit.getDeviceSn,
  getTemplateId: deviceSubscribeInit.getTemplateId,
  getSnTicket: deviceSubscribeInit.getSnTicket,
  openSubscribeModal: deviceSubscribeInit.openSubscribeModal,
  openDisposableSubscribeModal: deviceSubscribeInit.openDisposableSubscribeModal,
  modelIds: modelIds,
  templateIds: templateIds,
  faultTemplate: faultTemplate,
  jumpCleanBuy: jumpCleanBuy,
  disposableInfo: disposableInfo,
}

module.exports = {
  requestServiceInit,
  pluginTrackSdkInit,
  globalCommonConfig,
}
