import { ComponentWithComputed } from 'miniprogram-computed'
import { deviceStore } from '../../store/index'
import { StatusType } from './typings'

ComponentWithComputed({
  data: {
    deviceList: [] as Device.DeviceItem[],
    status: 'processing' as StatusType,
    groupName: '',
  },
  computed: {},

  methods: {
    onLoad() {
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.on('createGroup', (data) => {
        const deviceList = deviceStore.deviceFlattenList.filter(
          (device: Device.DeviceItem) =>
            data.lightList.includes(device.deviceId) || data.lightList.includes(device.uniId),
        )
        console.log(data.lightList, deviceList)

        this.setData({
          deviceList,
        })
      })
    },
  },
})
