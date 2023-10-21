/**
 * Created by liujim on 2017/8/26.
 */
class Helper {
  static showAlertViewCommon(msg) {
    $.event.trigger('showTooltips', [{ isShow: true, message: msg }])
    setTimeout(() => {
      $.event.trigger('showTooltips', [{ isShow: false, message: msg }])
    }, 1500)
  }

  static showLoadingView(isShow) {
    $.event.trigger('showLoadingView', [{ isShow: isShow }])
  }

  static decimalArrayToHexStrArray(origin) {
    return origin.map(function (item) {
      return item.toString(16)
    })
  }

  static decimalArrayToHexStrArrayFormat(origin) {
    let item = ''
    return origin.map(function (_item) {
      item = _item.toString(16)
      return item.length == 1 ? '0' + item : item
    })
  }

  static decimalArrayToHexArray(origin) {
    return origin.map(function (item) {
      return parseInt(item) //int compatible with hex
    })
  }

  static hexArrayToHexStrArray(origin) {
    return origin.map(function (item) {
      return item.toString(16)
    })
  }

  static hexArrayToDecimalArray(origin) {
    return origin.map(function (item) {
      return parseInt(item) & 0xff
    })
  }

  static hexStrArrayToDecimalArray(origin) {
    return origin.map(function (item) {
      return parseInt('0x' + item) & 0xff
    })
  }

  static strArrayToIntArray(origin) {
    return origin.map(function (item) {
      return parseInt(item)
    })
  }

  static clone = function (original) {
    let clone = {}
    for (let i in original) {
      if (typeof original[i] === 'object') {
        clone[i] = this.clone(original[i])
      } else {
        clone[i] = original[i]
      }
    }
    return clone
  }

  static cloneDeep = function (original) {
    let clone = {}
    for (let i in original) {
      if (typeof original[i] === 'object' && !(original[i] instanceof Array)) {
        clone[i] = this.cloneDeep(original[i])
      } else {
        if (original[i] instanceof Array) {
          clone[i] = this.arrayClone(original[i])
        } else {
          clone[i] = original[i]
        }
      }
    }
    return clone
  }

  static merge(origin, addition) {
    for (let key in addition) {
      if (typeof addition[key] !== 'object' || addition[key] instanceof Array) {
        origin[key] = addition[key]
      } else {
        this.merge(origin[key], addition[key])
      }
    }
  }

  static arrayClone(orginal) {
    let result = []

    orginal.map((item) => {
      result.push(item)
    })

    return result
  }

  static arrayConcat(origin, addition) {
    let result = this.arrayClone(origin)
    addition.map((item) => {
      if (!this.inArray(result, item)) {
        result.push(item)
      }
    })

    return result
  }

  static parseUnsignedInt = function (origin) {
    return parseInt(origin)
  }

  static hexStrAlignLeft(str) {
    if (str.length < 2) {
      return '0' + str
    } else {
      return str
    }
  }

  static inArray(container, search) {
    let isExist = false
    container.map((item) => {
      if (item == search) {
        isExist = true
      }
    })
    return isExist
  }

  static removeSingleValueFromArray(container, value) {
    //return by ref
    let valueIndex = 0
    container.map((item, index) => {
      if (item == value) {
        valueIndex = index
        return
      }
    })
    container.splice(valueIndex, 1)
  }

  static getJsonLength(json) {
    let counter = 0
    for (let i in json) {
      counter++
    }
    return counter
  }

  static dayNameMapping(num) {
    let dayMap = [
      t.getText('week_Mon'),
      t.getText('week_Tue'),
      t.getText('week_Wed'),
      t.getText('week_Thu'),
      t.getText('week_Fri'),
      t.getText('week_Sat'),
      t.getText('week_Sun'),
    ]

    let dayName = dayMap[num - 1] != undefined ? dayMap[num - 1] : ''

    return dayName
  }

  static dayArrToStr(week) {
    let repeatDays = ''
    if (week.length != 7) {
      week.map((item, index) => {
        repeatDays += Helper.dayNameMapping(item)
        if (index != week.length - 1) {
          repeatDays += '.'
        }
      })
    } else {
      repeatDays = t.getText('week_everyday')
    }

    return repeatDays
  }

  static UTCToLocal(utcTime) {
    let date = new Date()
    let y = date.getUTCFullYear()
    let m = date.getUTCMonth()
    let d = date.getUTCDate()
    let s = 0
    let utc = Date.UTC(y, m, d, parseInt(utcTime.split(':')[0]), parseInt(utcTime.split(':')[1]), s)

    let local = new Date(utc)
    let hourLocal = local.getHours().toString().length < 2 ? '0' + local.getHours() : local.getHours().toString()
    let minuteLocal =
      local.getMinutes().toString().length < 2 ? '0' + local.getMinutes() : local.getMinutes().toString()

    return hourLocal + ':' + minuteLocal
  }

  static localToUTC(localTime) {
    let date = new Date()
    let y = date.getFullYear()
    let m = date.getMonth()
    let d = date.getDate()
    let s = 0
    let local = new Date(y, m, d, parseInt(localTime.split(':')[0]), parseInt(localTime.split(':')[1]), s)

    let hourUTC = local.getUTCHours().toString().length < 2 ? '0' + local.getUTCHours() : local.getUTCHours().toString()
    let minuteUTC =
      local.getUTCMinutes().toString().length < 2 ? '0' + local.getUTCMinutes() : local.getUTCMinutes().toString()

    return hourUTC + ':' + minuteUTC
  }

  static inputFilter(value) {
    //todo
    return value.replace(
      /[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF][\u200D|\uFE0F]|[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[0-9|*|#]\uFE0F\u20E3|[0-9|#]\u20E3|[\u203C-\u3299]\uFE0F\u200D|[\u203C-\u3299]\uFE0F|[\u2122-\u2B55]|\u303D|[\\A9|\\AE]\u3030|\\uA9|\\uAE|\u3030/gi,
      '',
    )
    //return value;
  }

  static getShortText(text, maxLength) {
    let _text = text + ''
    let result = _text

    if (_text.length > maxLength) {
      result = _text.substring(0, maxLength) + '...'
    }

    return result
  }

  static isWeixinNavigator() {
    let ua = window.navigator.userAgent.toLowerCase()
    if (ua.match(/MicroMessenger/i) == 'micromessenger') {
      return true
    } else {
      return false
    }
  }

  /**
   * 视频加载兼容处理
   */
  static videoCompatible() {
    var isIPhone = window.navigator.appVersion.match(/iphone/gi)
    var creat_video = function () {
      var _video = document.getElementsByClassName('video-i')
      if (_video.length > 0) {
        for (var i = 0; i < _video.length; i++) {
          var _that = _video[i]
          _that.addEventListener('click', function (e) {
            var _this = e.currentTarget,
              _videoUrl = _this.getAttribute('data-src'),
              _img = _this.children[0].getAttribute('src'),
              _dom = document.createElement('video'),
              _autoPlayAllowed = true,
              _loading = document.createElement('div'),
              _p,
              _process = document.createElement('i')
            _noSound = document.createElement('em')
            if (_this.getAttribute('data-video')) {
              var _video = _this.parentNode.querySelectorAll('video')
              var _noSound = _this.parentNode.querySelectorAll('.no-sound')
              if (_video.length > 0) {
                _dom = _video[0]
                // if (_dom.ended) {
                if (isIPhone) {
                  //修改Ios11状态不准，视频无法播放的问题
                  if (_dom.src.indexOf('random') > -1) {
                    _dom.src = _dom.src.split('random=')[0] + 'random=' + _dom.src.split('random=')[1] + 1
                  } else {
                    _dom.src = _dom.src + '?random=' + Math.floor(Math.random() * (100 - 10 + 1) + 10)
                  }
                }
                _noSound[0].classList.remove('hide')
                _dom.play()
                _this.classList.add('hide')
                _dom.classList.remove('hide')
                // }
              }
              return
            }
            _this.setAttribute('data-video', '1')
            _process.setAttribute('class', 'vjs-process')
            _process.innerHTML = '加载中...'
            _loading.setAttribute('class', 'vjs-loading-spinner')
            _dom.setAttribute('src', _videoUrl)
            _dom.setAttribute('controls', 'controls')
            _dom.setAttribute('autoPlay', 'false')
            _dom.setAttribute('class', 'video-container-style')
            // _dom.setAttribute('x5-video-player-type', 'h5');
            _this.parentNode.appendChild(_loading)
            _this.parentNode.appendChild(_process)
            _this.parentNode.classList.add('vjs-waiting')
            _noSound.setAttribute('class', 'no-sound')
            _noSound.innerHTML = '无声'
            // _dom.setAttribute('webkit-playsinline', 'webkit-playsinline');
            // _dom.setAttribute('playsinline', 'playsinline');
            _dom.setAttribute('poster', _img)
            _p = _dom.play()
            console.time('加载毫秒')
            var _dom_buffered_promise = function () {
              var _end = _dom.buffered.end(0)
              var _duration = _dom.duration
              var _a = Math.round((_end / _duration) * 100)
              _process.innerHTML = _a + '%'
              console.log(_end + ' ' + _duration)
              if (_a < 10) {
                setTimeout(_dom_buffered, 200)
              } else {
                _dom_buffered()
              }
            }
            var _dom_buffered = function () {
              _this.parentNode.classList.remove('vjs-waiting')
              _this.classList.add('hide')
              _process.classList.add('hide')
              _this.parentNode.appendChild(_dom)
              _this.parentNode.appendChild(_noSound)
              _dom.addEventListener('ended', function () {
                _dom.classList.add('hide')
                _this.classList.remove('hide')
                _noSound.classList.add('hide')
              })
              _dom.currentTime = 0
              console.timeEnd('加载毫秒')
            }
            if (_p instanceof Promise) {
              _p.catch(function (error) {
                console.log(error.message)
                if (error.name === 'NotAllowedError') {
                  _autoPlayAllowed = false
                }
              }).then(function (e) {
                if (_autoPlayAllowed) {
                  _dom_buffered_promise()
                }
              })
            } else {
              //ios8-9拿不到promise需要给个延时处理
              setTimeout(function () {
                _dom_buffered()
              }, 4000)
            }
          })
        }
      }
    }

    new creat_video()
  }
}

export default Helper
