/*! For license information please see bluetooth-crypto.js.LICENSE.txt */
!(function (t, e) {
  'object' == typeof exports && 'object' == typeof module
    ? (module.exports = e())
    : 'function' == typeof define && define.amd
    ? define([], e)
    : 'object' == typeof exports
    ? (exports['bluetooth-crypto'] = e())
    : (t['bluetooth-crypto'] = e())
})(self, function () {
  return (() => {
    var t = {
        2937: (t, e, r) => {
          'use strict'
          const i = e
          ;(i.bignum = r(5612)),
            (i.define = r(2805).define),
            (i.base = r(8831)),
            (i.constants = r(8439)),
            (i.decoders = r(6893)),
            (i.encoders = r(5891))
        },
        2805: (t, e, r) => {
          'use strict'
          const i = r(5891),
            n = r(6893),
            o = r(4603)
          function a(t, e) {
            ;(this.name = t), (this.body = e), (this.decoders = {}), (this.encoders = {})
          }
          ;(e.define = function (t, e) {
            return new a(t, e)
          }),
            (a.prototype._createNamed = function (t) {
              const e = this.name
              function r(t) {
                this._initNamed(t, e)
              }
              return (
                o(r, t),
                (r.prototype._initNamed = function (e, r) {
                  t.call(this, e, r)
                }),
                new r(this)
              )
            }),
            (a.prototype._getDecoder = function (t) {
              return (
                (t = t || 'der'),
                this.decoders.hasOwnProperty(t) || (this.decoders[t] = this._createNamed(n[t])),
                this.decoders[t]
              )
            }),
            (a.prototype.decode = function (t, e, r) {
              return this._getDecoder(e).decode(t, r)
            }),
            (a.prototype._getEncoder = function (t) {
              return (
                (t = t || 'der'),
                this.encoders.hasOwnProperty(t) || (this.encoders[t] = this._createNamed(i[t])),
                this.encoders[t]
              )
            }),
            (a.prototype.encode = function (t, e, r) {
              return this._getEncoder(e).encode(t, r)
            })
        },
        9410: (t, e, r) => {
          'use strict'
          const i = r(4603),
            n = r(7666).b,
            o = r(6209).Buffer
          function a(t, e) {
            n.call(this, e),
              o.isBuffer(t)
                ? ((this.base = t), (this.offset = 0), (this.length = t.length))
                : this.error('Input not Buffer')
          }
          function s(t, e) {
            if (Array.isArray(t))
              (this.length = 0),
                (this.value = t.map(function (t) {
                  return s.isEncoderBuffer(t) || (t = new s(t, e)), (this.length += t.length), t
                }, this))
            else if ('number' == typeof t) {
              if (!(0 <= t && t <= 255)) return e.error('non-byte EncoderBuffer value')
              ;(this.value = t), (this.length = 1)
            } else if ('string' == typeof t) (this.value = t), (this.length = o.byteLength(t))
            else {
              if (!o.isBuffer(t)) return e.error('Unsupported type: ' + typeof t)
              ;(this.value = t), (this.length = t.length)
            }
          }
          i(a, n),
            (e.C = a),
            (a.isDecoderBuffer = function (t) {
              return (
                t instanceof a ||
                ('object' == typeof t &&
                  o.isBuffer(t.base) &&
                  'DecoderBuffer' === t.constructor.name &&
                  'number' == typeof t.offset &&
                  'number' == typeof t.length &&
                  'function' == typeof t.save &&
                  'function' == typeof t.restore &&
                  'function' == typeof t.isEmpty &&
                  'function' == typeof t.readUInt8 &&
                  'function' == typeof t.skip &&
                  'function' == typeof t.raw)
              )
            }),
            (a.prototype.save = function () {
              return { offset: this.offset, reporter: n.prototype.save.call(this) }
            }),
            (a.prototype.restore = function (t) {
              const e = new a(this.base)
              return (
                (e.offset = t.offset),
                (e.length = this.offset),
                (this.offset = t.offset),
                n.prototype.restore.call(this, t.reporter),
                e
              )
            }),
            (a.prototype.isEmpty = function () {
              return this.offset === this.length
            }),
            (a.prototype.readUInt8 = function (t) {
              return this.offset + 1 <= this.length
                ? this.base.readUInt8(this.offset++, !0)
                : this.error(t || 'DecoderBuffer overrun')
            }),
            (a.prototype.skip = function (t, e) {
              if (!(this.offset + t <= this.length)) return this.error(e || 'DecoderBuffer overrun')
              const r = new a(this.base)
              return (
                (r._reporterState = this._reporterState),
                (r.offset = this.offset),
                (r.length = this.offset + t),
                (this.offset += t),
                r
              )
            }),
            (a.prototype.raw = function (t) {
              return this.base.slice(t ? t.offset : this.offset, this.length)
            }),
            (e.R = s),
            (s.isEncoderBuffer = function (t) {
              return (
                t instanceof s ||
                ('object' == typeof t &&
                  'EncoderBuffer' === t.constructor.name &&
                  'number' == typeof t.length &&
                  'function' == typeof t.join)
              )
            }),
            (s.prototype.join = function (t, e) {
              return (
                t || (t = o.alloc(this.length)),
                e || (e = 0),
                0 === this.length ||
                  (Array.isArray(this.value)
                    ? this.value.forEach(function (r) {
                        r.join(t, e), (e += r.length)
                      })
                    : ('number' == typeof this.value
                        ? (t[e] = this.value)
                        : 'string' == typeof this.value
                        ? t.write(this.value, e)
                        : o.isBuffer(this.value) && this.value.copy(t, e),
                      (e += this.length))),
                t
              )
            })
        },
        8831: (t, e, r) => {
          'use strict'
          const i = e
          ;(i.Reporter = r(7666).b), (i.DecoderBuffer = r(9410).C), (i.EncoderBuffer = r(9410).R), (i.Node = r(579))
        },
        579: (t, e, r) => {
          'use strict'
          const i = r(7666).b,
            n = r(9410).R,
            o = r(9410).C,
            a = r(1339),
            s = [
              'seq',
              'seqof',
              'set',
              'setof',
              'objid',
              'bool',
              'gentime',
              'utctime',
              'null_',
              'enum',
              'int',
              'objDesc',
              'bitstr',
              'bmpstr',
              'charstr',
              'genstr',
              'graphstr',
              'ia5str',
              'iso646str',
              'numstr',
              'octstr',
              'printstr',
              't61str',
              'unistr',
              'utf8str',
              'videostr',
            ],
            f = ['key', 'obj', 'use', 'optional', 'explicit', 'implicit', 'def', 'choice', 'any', 'contains'].concat(s)
          function h(t, e, r) {
            const i = {}
            ;(this._baseState = i),
              (i.name = r),
              (i.enc = t),
              (i.parent = e || null),
              (i.children = null),
              (i.tag = null),
              (i.args = null),
              (i.reverseArgs = null),
              (i.choice = null),
              (i.optional = !1),
              (i.any = !1),
              (i.obj = !1),
              (i.use = null),
              (i.useDecoder = null),
              (i.key = null),
              (i.default = null),
              (i.explicit = null),
              (i.implicit = null),
              (i.contains = null),
              i.parent || ((i.children = []), this._wrap())
          }
          t.exports = h
          const c = [
            'enc',
            'parent',
            'children',
            'tag',
            'args',
            'reverseArgs',
            'choice',
            'optional',
            'any',
            'obj',
            'use',
            'alteredUse',
            'key',
            'default',
            'explicit',
            'implicit',
            'contains',
          ]
          ;(h.prototype.clone = function () {
            const t = this._baseState,
              e = {}
            c.forEach(function (r) {
              e[r] = t[r]
            })
            const r = new this.constructor(e.parent)
            return (r._baseState = e), r
          }),
            (h.prototype._wrap = function () {
              const t = this._baseState
              f.forEach(function (e) {
                this[e] = function () {
                  const r = new this.constructor(this)
                  return t.children.push(r), r[e].apply(r, arguments)
                }
              }, this)
            }),
            (h.prototype._init = function (t) {
              const e = this._baseState
              a(null === e.parent),
                t.call(this),
                (e.children = e.children.filter(function (t) {
                  return t._baseState.parent === this
                }, this)),
                a.equal(e.children.length, 1, 'Root node can have only one child')
            }),
            (h.prototype._useArgs = function (t) {
              const e = this._baseState,
                r = t.filter(function (t) {
                  return t instanceof this.constructor
                }, this)
              ;(t = t.filter(function (t) {
                return !(t instanceof this.constructor)
              }, this)),
                0 !== r.length &&
                  (a(null === e.children),
                  (e.children = r),
                  r.forEach(function (t) {
                    t._baseState.parent = this
                  }, this)),
                0 !== t.length &&
                  (a(null === e.args),
                  (e.args = t),
                  (e.reverseArgs = t.map(function (t) {
                    if ('object' != typeof t || t.constructor !== Object) return t
                    const e = {}
                    return (
                      Object.keys(t).forEach(function (r) {
                        r == (0 | r) && (r |= 0)
                        const i = t[r]
                        e[i] = r
                      }),
                      e
                    )
                  })))
            }),
            [
              '_peekTag',
              '_decodeTag',
              '_use',
              '_decodeStr',
              '_decodeObjid',
              '_decodeTime',
              '_decodeNull',
              '_decodeInt',
              '_decodeBool',
              '_decodeList',
              '_encodeComposite',
              '_encodeStr',
              '_encodeObjid',
              '_encodeTime',
              '_encodeNull',
              '_encodeInt',
              '_encodeBool',
            ].forEach(function (t) {
              h.prototype[t] = function () {
                const e = this._baseState
                throw new Error(t + ' not implemented for encoding: ' + e.enc)
              }
            }),
            s.forEach(function (t) {
              h.prototype[t] = function () {
                const e = this._baseState,
                  r = Array.prototype.slice.call(arguments)
                return a(null === e.tag), (e.tag = t), this._useArgs(r), this
              }
            }),
            (h.prototype.use = function (t) {
              a(t)
              const e = this._baseState
              return a(null === e.use), (e.use = t), this
            }),
            (h.prototype.optional = function () {
              return (this._baseState.optional = !0), this
            }),
            (h.prototype.def = function (t) {
              const e = this._baseState
              return a(null === e.default), (e.default = t), (e.optional = !0), this
            }),
            (h.prototype.explicit = function (t) {
              const e = this._baseState
              return a(null === e.explicit && null === e.implicit), (e.explicit = t), this
            }),
            (h.prototype.implicit = function (t) {
              const e = this._baseState
              return a(null === e.explicit && null === e.implicit), (e.implicit = t), this
            }),
            (h.prototype.obj = function () {
              const t = this._baseState,
                e = Array.prototype.slice.call(arguments)
              return (t.obj = !0), 0 !== e.length && this._useArgs(e), this
            }),
            (h.prototype.key = function (t) {
              const e = this._baseState
              return a(null === e.key), (e.key = t), this
            }),
            (h.prototype.any = function () {
              return (this._baseState.any = !0), this
            }),
            (h.prototype.choice = function (t) {
              const e = this._baseState
              return (
                a(null === e.choice),
                (e.choice = t),
                this._useArgs(
                  Object.keys(t).map(function (e) {
                    return t[e]
                  }),
                ),
                this
              )
            }),
            (h.prototype.contains = function (t) {
              const e = this._baseState
              return a(null === e.use), (e.contains = t), this
            }),
            (h.prototype._decode = function (t, e) {
              const r = this._baseState
              if (null === r.parent) return t.wrapResult(r.children[0]._decode(t, e))
              let i,
                n = r.default,
                a = !0,
                s = null
              if ((null !== r.key && (s = t.enterKey(r.key)), r.optional)) {
                let i = null
                if (
                  (null !== r.explicit
                    ? (i = r.explicit)
                    : null !== r.implicit
                    ? (i = r.implicit)
                    : null !== r.tag && (i = r.tag),
                  null !== i || r.any)
                ) {
                  if (((a = this._peekTag(t, i, r.any)), t.isError(a))) return a
                } else {
                  const i = t.save()
                  try {
                    null === r.choice ? this._decodeGeneric(r.tag, t, e) : this._decodeChoice(t, e), (a = !0)
                  } catch (t) {
                    a = !1
                  }
                  t.restore(i)
                }
              }
              if ((r.obj && a && (i = t.enterObject()), a)) {
                if (null !== r.explicit) {
                  const e = this._decodeTag(t, r.explicit)
                  if (t.isError(e)) return e
                  t = e
                }
                const i = t.offset
                if (null === r.use && null === r.choice) {
                  let e
                  r.any && (e = t.save())
                  const i = this._decodeTag(t, null !== r.implicit ? r.implicit : r.tag, r.any)
                  if (t.isError(i)) return i
                  r.any ? (n = t.raw(e)) : (t = i)
                }
                if (
                  (e && e.track && null !== r.tag && e.track(t.path(), i, t.length, 'tagged'),
                  e && e.track && null !== r.tag && e.track(t.path(), t.offset, t.length, 'content'),
                  r.any || (n = null === r.choice ? this._decodeGeneric(r.tag, t, e) : this._decodeChoice(t, e)),
                  t.isError(n))
                )
                  return n
                if (
                  (r.any ||
                    null !== r.choice ||
                    null === r.children ||
                    r.children.forEach(function (r) {
                      r._decode(t, e)
                    }),
                  r.contains && ('octstr' === r.tag || 'bitstr' === r.tag))
                ) {
                  const i = new o(n)
                  n = this._getUse(r.contains, t._reporterState.obj)._decode(i, e)
                }
              }
              return (
                r.obj && a && (n = t.leaveObject(i)),
                null === r.key || (null === n && !0 !== a) ? null !== s && t.exitKey(s) : t.leaveKey(s, r.key, n),
                n
              )
            }),
            (h.prototype._decodeGeneric = function (t, e, r) {
              const i = this._baseState
              return 'seq' === t || 'set' === t
                ? null
                : 'seqof' === t || 'setof' === t
                ? this._decodeList(e, t, i.args[0], r)
                : /str$/.test(t)
                ? this._decodeStr(e, t, r)
                : 'objid' === t && i.args
                ? this._decodeObjid(e, i.args[0], i.args[1], r)
                : 'objid' === t
                ? this._decodeObjid(e, null, null, r)
                : 'gentime' === t || 'utctime' === t
                ? this._decodeTime(e, t, r)
                : 'null_' === t
                ? this._decodeNull(e, r)
                : 'bool' === t
                ? this._decodeBool(e, r)
                : 'objDesc' === t
                ? this._decodeStr(e, t, r)
                : 'int' === t || 'enum' === t
                ? this._decodeInt(e, i.args && i.args[0], r)
                : null !== i.use
                ? this._getUse(i.use, e._reporterState.obj)._decode(e, r)
                : e.error('unknown tag: ' + t)
            }),
            (h.prototype._getUse = function (t, e) {
              const r = this._baseState
              return (
                (r.useDecoder = this._use(t, e)),
                a(null === r.useDecoder._baseState.parent),
                (r.useDecoder = r.useDecoder._baseState.children[0]),
                r.implicit !== r.useDecoder._baseState.implicit &&
                  ((r.useDecoder = r.useDecoder.clone()), (r.useDecoder._baseState.implicit = r.implicit)),
                r.useDecoder
              )
            }),
            (h.prototype._decodeChoice = function (t, e) {
              const r = this._baseState
              let i = null,
                n = !1
              return (
                Object.keys(r.choice).some(function (o) {
                  const a = t.save(),
                    s = r.choice[o]
                  try {
                    const r = s._decode(t, e)
                    if (t.isError(r)) return !1
                    ;(i = { type: o, value: r }), (n = !0)
                  } catch (e) {
                    return t.restore(a), !1
                  }
                  return !0
                }, this),
                n ? i : t.error('Choice not matched')
              )
            }),
            (h.prototype._createEncoderBuffer = function (t) {
              return new n(t, this.reporter)
            }),
            (h.prototype._encode = function (t, e, r) {
              const i = this._baseState
              if (null !== i.default && i.default === t) return
              const n = this._encodeValue(t, e, r)
              return void 0 === n || this._skipDefault(n, e, r) ? void 0 : n
            }),
            (h.prototype._encodeValue = function (t, e, r) {
              const n = this._baseState
              if (null === n.parent) return n.children[0]._encode(t, e || new i())
              let o = null
              if (((this.reporter = e), n.optional && void 0 === t)) {
                if (null === n.default) return
                t = n.default
              }
              let a = null,
                s = !1
              if (n.any) o = this._createEncoderBuffer(t)
              else if (n.choice) o = this._encodeChoice(t, e)
              else if (n.contains) (a = this._getUse(n.contains, r)._encode(t, e)), (s = !0)
              else if (n.children)
                (a = n.children
                  .map(function (r) {
                    if ('null_' === r._baseState.tag) return r._encode(null, e, t)
                    if (null === r._baseState.key) return e.error('Child should have a key')
                    const i = e.enterKey(r._baseState.key)
                    if ('object' != typeof t) return e.error('Child expected, but input is not object')
                    const n = r._encode(t[r._baseState.key], e, t)
                    return e.leaveKey(i), n
                  }, this)
                  .filter(function (t) {
                    return t
                  })),
                  (a = this._createEncoderBuffer(a))
              else if ('seqof' === n.tag || 'setof' === n.tag) {
                if (!n.args || 1 !== n.args.length) return e.error('Too many args for : ' + n.tag)
                if (!Array.isArray(t)) return e.error('seqof/setof, but data is not Array')
                const r = this.clone()
                ;(r._baseState.implicit = null),
                  (a = this._createEncoderBuffer(
                    t.map(function (r) {
                      const i = this._baseState
                      return this._getUse(i.args[0], t)._encode(r, e)
                    }, r),
                  ))
              } else
                null !== n.use
                  ? (o = this._getUse(n.use, r)._encode(t, e))
                  : ((a = this._encodePrimitive(n.tag, t)), (s = !0))
              if (!n.any && null === n.choice) {
                const t = null !== n.implicit ? n.implicit : n.tag,
                  r = null === n.implicit ? 'universal' : 'context'
                null === t
                  ? null === n.use && e.error('Tag could be omitted only for .use()')
                  : null === n.use && (o = this._encodeComposite(t, s, r, a))
              }
              return null !== n.explicit && (o = this._encodeComposite(n.explicit, !1, 'context', o)), o
            }),
            (h.prototype._encodeChoice = function (t, e) {
              const r = this._baseState,
                i = r.choice[t.type]
              return (
                i || a(!1, t.type + ' not found in ' + JSON.stringify(Object.keys(r.choice))), i._encode(t.value, e)
              )
            }),
            (h.prototype._encodePrimitive = function (t, e) {
              const r = this._baseState
              if (/str$/.test(t)) return this._encodeStr(e, t)
              if ('objid' === t && r.args) return this._encodeObjid(e, r.reverseArgs[0], r.args[1])
              if ('objid' === t) return this._encodeObjid(e, null, null)
              if ('gentime' === t || 'utctime' === t) return this._encodeTime(e, t)
              if ('null_' === t) return this._encodeNull()
              if ('int' === t || 'enum' === t) return this._encodeInt(e, r.args && r.reverseArgs[0])
              if ('bool' === t) return this._encodeBool(e)
              if ('objDesc' === t) return this._encodeStr(e, t)
              throw new Error('Unsupported tag: ' + t)
            }),
            (h.prototype._isNumstr = function (t) {
              return /^[0-9 ]*$/.test(t)
            }),
            (h.prototype._isPrintstr = function (t) {
              return /^[A-Za-z0-9 '()+,-./:=?]*$/.test(t)
            })
        },
        7666: (t, e, r) => {
          'use strict'
          const i = r(4603)
          function n(t) {
            this._reporterState = { obj: null, path: [], options: t || {}, errors: [] }
          }
          function o(t, e) {
            ;(this.path = t), this.rethrow(e)
          }
          ;(e.b = n),
            (n.prototype.isError = function (t) {
              return t instanceof o
            }),
            (n.prototype.save = function () {
              const t = this._reporterState
              return { obj: t.obj, pathLen: t.path.length }
            }),
            (n.prototype.restore = function (t) {
              const e = this._reporterState
              ;(e.obj = t.obj), (e.path = e.path.slice(0, t.pathLen))
            }),
            (n.prototype.enterKey = function (t) {
              return this._reporterState.path.push(t)
            }),
            (n.prototype.exitKey = function (t) {
              const e = this._reporterState
              e.path = e.path.slice(0, t - 1)
            }),
            (n.prototype.leaveKey = function (t, e, r) {
              const i = this._reporterState
              this.exitKey(t), null !== i.obj && (i.obj[e] = r)
            }),
            (n.prototype.path = function () {
              return this._reporterState.path.join('/')
            }),
            (n.prototype.enterObject = function () {
              const t = this._reporterState,
                e = t.obj
              return (t.obj = {}), e
            }),
            (n.prototype.leaveObject = function (t) {
              const e = this._reporterState,
                r = e.obj
              return (e.obj = t), r
            }),
            (n.prototype.error = function (t) {
              let e
              const r = this._reporterState,
                i = t instanceof o
              if (
                ((e = i
                  ? t
                  : new o(
                      r.path
                        .map(function (t) {
                          return '[' + JSON.stringify(t) + ']'
                        })
                        .join(''),
                      t.message || t,
                      t.stack,
                    )),
                !r.options.partial)
              )
                throw e
              return i || r.errors.push(e), e
            }),
            (n.prototype.wrapResult = function (t) {
              const e = this._reporterState
              return e.options.partial ? { result: this.isError(t) ? null : t, errors: e.errors } : t
            }),
            i(o, Error),
            (o.prototype.rethrow = function (t) {
              if (
                ((this.message = t + ' at: ' + (this.path || '(shallow)')),
                Error.captureStackTrace && Error.captureStackTrace(this, o),
                !this.stack)
              )
                try {
                  throw new Error(this.message)
                } catch (t) {
                  this.stack = t.stack
                }
              return this
            })
        },
        6127: (t, e) => {
          'use strict'
          function r(t) {
            const e = {}
            return (
              Object.keys(t).forEach(function (r) {
                ;(0 | r) == r && (r |= 0)
                const i = t[r]
                e[i] = r
              }),
              e
            )
          }
          ;(e.tagClass = { 0: 'universal', 1: 'application', 2: 'context', 3: 'private' }),
            (e.tagClassByName = r(e.tagClass)),
            (e.tag = {
              0: 'end',
              1: 'bool',
              2: 'int',
              3: 'bitstr',
              4: 'octstr',
              5: 'null_',
              6: 'objid',
              7: 'objDesc',
              8: 'external',
              9: 'real',
              10: 'enum',
              11: 'embed',
              12: 'utf8str',
              13: 'relativeOid',
              16: 'seq',
              17: 'set',
              18: 'numstr',
              19: 'printstr',
              20: 't61str',
              21: 'videostr',
              22: 'ia5str',
              23: 'utctime',
              24: 'gentime',
              25: 'graphstr',
              26: 'iso646str',
              27: 'genstr',
              28: 'unistr',
              29: 'charstr',
              30: 'bmpstr',
            }),
            (e.tagByName = r(e.tag))
        },
        8439: (t, e, r) => {
          'use strict'
          const i = e
          ;(i._reverse = function (t) {
            const e = {}
            return (
              Object.keys(t).forEach(function (r) {
                ;(0 | r) == r && (r |= 0)
                const i = t[r]
                e[i] = r
              }),
              e
            )
          }),
            (i.der = r(6127))
        },
        9885: (t, e, r) => {
          'use strict'
          const i = r(4603),
            n = r(5612),
            o = r(9410).C,
            a = r(579),
            s = r(6127)
          function f(t) {
            ;(this.enc = 'der'), (this.name = t.name), (this.entity = t), (this.tree = new h()), this.tree._init(t.body)
          }
          function h(t) {
            a.call(this, 'der', t)
          }
          function c(t, e) {
            let r = t.readUInt8(e)
            if (t.isError(r)) return r
            const i = s.tagClass[r >> 6],
              n = 0 == (32 & r)
            if (31 == (31 & r)) {
              let i = r
              for (r = 0; 128 == (128 & i); ) {
                if (((i = t.readUInt8(e)), t.isError(i))) return i
                ;(r <<= 7), (r |= 127 & i)
              }
            } else r &= 31
            return { cls: i, primitive: n, tag: r, tagStr: s.tag[r] }
          }
          function u(t, e, r) {
            let i = t.readUInt8(r)
            if (t.isError(i)) return i
            if (!e && 128 === i) return null
            if (0 == (128 & i)) return i
            const n = 127 & i
            if (n > 4) return t.error('length octect is too long')
            i = 0
            for (let e = 0; e < n; e++) {
              i <<= 8
              const e = t.readUInt8(r)
              if (t.isError(e)) return e
              i |= e
            }
            return i
          }
          ;(t.exports = f),
            (f.prototype.decode = function (t, e) {
              return o.isDecoderBuffer(t) || (t = new o(t, e)), this.tree._decode(t, e)
            }),
            i(h, a),
            (h.prototype._peekTag = function (t, e, r) {
              if (t.isEmpty()) return !1
              const i = t.save(),
                n = c(t, 'Failed to peek tag: "' + e + '"')
              return t.isError(n) ? n : (t.restore(i), n.tag === e || n.tagStr === e || n.tagStr + 'of' === e || r)
            }),
            (h.prototype._decodeTag = function (t, e, r) {
              const i = c(t, 'Failed to decode tag of "' + e + '"')
              if (t.isError(i)) return i
              let n = u(t, i.primitive, 'Failed to get length of "' + e + '"')
              if (t.isError(n)) return n
              if (!r && i.tag !== e && i.tagStr !== e && i.tagStr + 'of' !== e)
                return t.error('Failed to match tag: "' + e + '"')
              if (i.primitive || null !== n) return t.skip(n, 'Failed to match body of: "' + e + '"')
              const o = t.save(),
                a = this._skipUntilEnd(t, 'Failed to skip indefinite length body: "' + this.tag + '"')
              return t.isError(a)
                ? a
                : ((n = t.offset - o.offset), t.restore(o), t.skip(n, 'Failed to match body of: "' + e + '"'))
            }),
            (h.prototype._skipUntilEnd = function (t, e) {
              for (;;) {
                const r = c(t, e)
                if (t.isError(r)) return r
                const i = u(t, r.primitive, e)
                if (t.isError(i)) return i
                let n
                if (((n = r.primitive || null !== i ? t.skip(i) : this._skipUntilEnd(t, e)), t.isError(n))) return n
                if ('end' === r.tagStr) break
              }
            }),
            (h.prototype._decodeList = function (t, e, r, i) {
              const n = []
              for (; !t.isEmpty(); ) {
                const e = this._peekTag(t, 'end')
                if (t.isError(e)) return e
                const o = r.decode(t, 'der', i)
                if (t.isError(o) && e) break
                n.push(o)
              }
              return n
            }),
            (h.prototype._decodeStr = function (t, e) {
              if ('bitstr' === e) {
                const e = t.readUInt8()
                return t.isError(e) ? e : { unused: e, data: t.raw() }
              }
              if ('bmpstr' === e) {
                const e = t.raw()
                if (e.length % 2 == 1) return t.error('Decoding of string type: bmpstr length mismatch')
                let r = ''
                for (let t = 0; t < e.length / 2; t++) r += String.fromCharCode(e.readUInt16BE(2 * t))
                return r
              }
              if ('numstr' === e) {
                const e = t.raw().toString('ascii')
                return this._isNumstr(e) ? e : t.error('Decoding of string type: numstr unsupported characters')
              }
              if ('octstr' === e) return t.raw()
              if ('objDesc' === e) return t.raw()
              if ('printstr' === e) {
                const e = t.raw().toString('ascii')
                return this._isPrintstr(e) ? e : t.error('Decoding of string type: printstr unsupported characters')
              }
              return /str$/.test(e) ? t.raw().toString() : t.error('Decoding of string type: ' + e + ' unsupported')
            }),
            (h.prototype._decodeObjid = function (t, e, r) {
              let i
              const n = []
              let o = 0,
                a = 0
              for (; !t.isEmpty(); )
                (a = t.readUInt8()), (o <<= 7), (o |= 127 & a), 0 == (128 & a) && (n.push(o), (o = 0))
              128 & a && n.push(o)
              const s = (n[0] / 40) | 0,
                f = n[0] % 40
              if (((i = r ? n : [s, f].concat(n.slice(1))), e)) {
                let t = e[i.join(' ')]
                void 0 === t && (t = e[i.join('.')]), void 0 !== t && (i = t)
              }
              return i
            }),
            (h.prototype._decodeTime = function (t, e) {
              const r = t.raw().toString()
              let i, n, o, a, s, f
              if ('gentime' === e)
                (i = 0 | r.slice(0, 4)),
                  (n = 0 | r.slice(4, 6)),
                  (o = 0 | r.slice(6, 8)),
                  (a = 0 | r.slice(8, 10)),
                  (s = 0 | r.slice(10, 12)),
                  (f = 0 | r.slice(12, 14))
              else {
                if ('utctime' !== e) return t.error('Decoding ' + e + ' time is not supported yet')
                ;(i = 0 | r.slice(0, 2)),
                  (n = 0 | r.slice(2, 4)),
                  (o = 0 | r.slice(4, 6)),
                  (a = 0 | r.slice(6, 8)),
                  (s = 0 | r.slice(8, 10)),
                  (f = 0 | r.slice(10, 12)),
                  (i = i < 70 ? 2e3 + i : 1900 + i)
              }
              return Date.UTC(i, n - 1, o, a, s, f, 0)
            }),
            (h.prototype._decodeNull = function () {
              return null
            }),
            (h.prototype._decodeBool = function (t) {
              const e = t.readUInt8()
              return t.isError(e) ? e : 0 !== e
            }),
            (h.prototype._decodeInt = function (t, e) {
              const r = t.raw()
              let i = new n(r)
              return e && (i = e[i.toString(10)] || i), i
            }),
            (h.prototype._use = function (t, e) {
              return 'function' == typeof t && (t = t(e)), t._getDecoder('der').tree
            })
        },
        6893: (t, e, r) => {
          'use strict'
          const i = e
          ;(i.der = r(9885)), (i.pem = r(5988))
        },
        5988: (t, e, r) => {
          'use strict'
          const i = r(4603),
            n = r(6209).Buffer,
            o = r(9885)
          function a(t) {
            o.call(this, t), (this.enc = 'pem')
          }
          i(a, o),
            (t.exports = a),
            (a.prototype.decode = function (t, e) {
              const r = t.toString().split(/[\r\n]+/g),
                i = e.label.toUpperCase(),
                a = /^-----(BEGIN|END) ([^-]+)-----$/
              let s = -1,
                f = -1
              for (let t = 0; t < r.length; t++) {
                const e = r[t].match(a)
                if (null !== e && e[2] === i) {
                  if (-1 !== s) {
                    if ('END' !== e[1]) break
                    f = t
                    break
                  }
                  if ('BEGIN' !== e[1]) break
                  s = t
                }
              }
              if (-1 === s || -1 === f) throw new Error('PEM section not found for: ' + i)
              const h = r.slice(s + 1, f).join('')
              h.replace(/[^a-z0-9+/=]+/gi, '')
              const c = n.from(h, 'base64')
              return o.prototype.decode.call(this, c, e)
            })
        },
        8786: (t, e, r) => {
          'use strict'
          const i = r(4603),
            n = r(6209).Buffer,
            o = r(579),
            a = r(6127)
          function s(t) {
            ;(this.enc = 'der'), (this.name = t.name), (this.entity = t), (this.tree = new f()), this.tree._init(t.body)
          }
          function f(t) {
            o.call(this, 'der', t)
          }
          function h(t) {
            return t < 10 ? '0' + t : t
          }
          ;(t.exports = s),
            (s.prototype.encode = function (t, e) {
              return this.tree._encode(t, e).join()
            }),
            i(f, o),
            (f.prototype._encodeComposite = function (t, e, r, i) {
              const o = (function (t, e, r, i) {
                let n
                if (('seqof' === t ? (t = 'seq') : 'setof' === t && (t = 'set'), a.tagByName.hasOwnProperty(t)))
                  n = a.tagByName[t]
                else {
                  if ('number' != typeof t || (0 | t) !== t) return i.error('Unknown tag: ' + t)
                  n = t
                }
                return n >= 31
                  ? i.error('Multi-octet tag encoding unsupported')
                  : (e || (n |= 32), (n |= a.tagClassByName[r || 'universal'] << 6), n)
              })(t, e, r, this.reporter)
              if (i.length < 128) {
                const t = n.alloc(2)
                return (t[0] = o), (t[1] = i.length), this._createEncoderBuffer([t, i])
              }
              let s = 1
              for (let t = i.length; t >= 256; t >>= 8) s++
              const f = n.alloc(2 + s)
              ;(f[0] = o), (f[1] = 128 | s)
              for (let t = 1 + s, e = i.length; e > 0; t--, e >>= 8) f[t] = 255 & e
              return this._createEncoderBuffer([f, i])
            }),
            (f.prototype._encodeStr = function (t, e) {
              if ('bitstr' === e) return this._createEncoderBuffer([0 | t.unused, t.data])
              if ('bmpstr' === e) {
                const e = n.alloc(2 * t.length)
                for (let r = 0; r < t.length; r++) e.writeUInt16BE(t.charCodeAt(r), 2 * r)
                return this._createEncoderBuffer(e)
              }
              return 'numstr' === e
                ? this._isNumstr(t)
                  ? this._createEncoderBuffer(t)
                  : this.reporter.error('Encoding of string type: numstr supports only digits and space')
                : 'printstr' === e
                ? this._isPrintstr(t)
                  ? this._createEncoderBuffer(t)
                  : this.reporter.error(
                      'Encoding of string type: printstr supports only latin upper and lower case letters, digits, space, apostrophe, left and rigth parenthesis, plus sign, comma, hyphen, dot, slash, colon, equal sign, question mark',
                    )
                : /str$/.test(e) || 'objDesc' === e
                ? this._createEncoderBuffer(t)
                : this.reporter.error('Encoding of string type: ' + e + ' unsupported')
            }),
            (f.prototype._encodeObjid = function (t, e, r) {
              if ('string' == typeof t) {
                if (!e) return this.reporter.error('string objid given, but no values map found')
                if (!e.hasOwnProperty(t)) return this.reporter.error('objid not found in values map')
                t = e[t].split(/[\s.]+/g)
                for (let e = 0; e < t.length; e++) t[e] |= 0
              } else if (Array.isArray(t)) {
                t = t.slice()
                for (let e = 0; e < t.length; e++) t[e] |= 0
              }
              if (!Array.isArray(t))
                return this.reporter.error('objid() should be either array or string, got: ' + JSON.stringify(t))
              if (!r) {
                if (t[1] >= 40) return this.reporter.error('Second objid identifier OOB')
                t.splice(0, 2, 40 * t[0] + t[1])
              }
              let i = 0
              for (let e = 0; e < t.length; e++) {
                let r = t[e]
                for (i++; r >= 128; r >>= 7) i++
              }
              const o = n.alloc(i)
              let a = o.length - 1
              for (let e = t.length - 1; e >= 0; e--) {
                let r = t[e]
                for (o[a--] = 127 & r; (r >>= 7) > 0; ) o[a--] = 128 | (127 & r)
              }
              return this._createEncoderBuffer(o)
            }),
            (f.prototype._encodeTime = function (t, e) {
              let r
              const i = new Date(t)
              return (
                'gentime' === e
                  ? (r = [
                      h(i.getUTCFullYear()),
                      h(i.getUTCMonth() + 1),
                      h(i.getUTCDate()),
                      h(i.getUTCHours()),
                      h(i.getUTCMinutes()),
                      h(i.getUTCSeconds()),
                      'Z',
                    ].join(''))
                  : 'utctime' === e
                  ? (r = [
                      h(i.getUTCFullYear() % 100),
                      h(i.getUTCMonth() + 1),
                      h(i.getUTCDate()),
                      h(i.getUTCHours()),
                      h(i.getUTCMinutes()),
                      h(i.getUTCSeconds()),
                      'Z',
                    ].join(''))
                  : this.reporter.error('Encoding ' + e + ' time is not supported yet'),
                this._encodeStr(r, 'octstr')
              )
            }),
            (f.prototype._encodeNull = function () {
              return this._createEncoderBuffer('')
            }),
            (f.prototype._encodeInt = function (t, e) {
              if ('string' == typeof t) {
                if (!e) return this.reporter.error('String int or enum given, but no values map')
                if (!e.hasOwnProperty(t)) return this.reporter.error("Values map doesn't contain: " + JSON.stringify(t))
                t = e[t]
              }
              if ('number' != typeof t && !n.isBuffer(t)) {
                const e = t.toArray()
                !t.sign && 128 & e[0] && e.unshift(0), (t = n.from(e))
              }
              if (n.isBuffer(t)) {
                let e = t.length
                0 === t.length && e++
                const r = n.alloc(e)
                return t.copy(r), 0 === t.length && (r[0] = 0), this._createEncoderBuffer(r)
              }
              if (t < 128) return this._createEncoderBuffer(t)
              if (t < 256) return this._createEncoderBuffer([0, t])
              let r = 1
              for (let e = t; e >= 256; e >>= 8) r++
              const i = new Array(r)
              for (let e = i.length - 1; e >= 0; e--) (i[e] = 255 & t), (t >>= 8)
              return 128 & i[0] && i.unshift(0), this._createEncoderBuffer(n.from(i))
            }),
            (f.prototype._encodeBool = function (t) {
              return this._createEncoderBuffer(t ? 255 : 0)
            }),
            (f.prototype._use = function (t, e) {
              return 'function' == typeof t && (t = t(e)), t._getEncoder('der').tree
            }),
            (f.prototype._skipDefault = function (t, e, r) {
              const i = this._baseState
              let n
              if (null === i.default) return !1
              const o = t.join()
              if (
                (void 0 === i.defaultBuffer && (i.defaultBuffer = this._encodeValue(i.default, e, r).join()),
                o.length !== i.defaultBuffer.length)
              )
                return !1
              for (n = 0; n < o.length; n++) if (o[n] !== i.defaultBuffer[n]) return !1
              return !0
            })
        },
        5891: (t, e, r) => {
          'use strict'
          const i = e
          ;(i.der = r(8786)), (i.pem = r(8662))
        },
        8662: (t, e, r) => {
          'use strict'
          const i = r(4603),
            n = r(8786)
          function o(t) {
            n.call(this, t), (this.enc = 'pem')
          }
          i(o, n),
            (t.exports = o),
            (o.prototype.encode = function (t, e) {
              const r = n.prototype.encode.call(this, t).toString('base64'),
                i = ['-----BEGIN ' + e.label + '-----']
              for (let t = 0; t < r.length; t += 64) i.push(r.slice(t, t + 64))
              return i.push('-----END ' + e.label + '-----'), i.join('\n')
            })
        },
        6251: (t, e) => {
          'use strict'
          ;(e.byteLength = function (t) {
            var e = f(t),
              r = e[0],
              i = e[1]
            return (3 * (r + i)) / 4 - i
          }),
            (e.toByteArray = function (t) {
              var e,
                r,
                o = f(t),
                a = o[0],
                s = o[1],
                h = new n(
                  (function (t, e, r) {
                    return (3 * (e + r)) / 4 - r
                  })(0, a, s),
                ),
                c = 0,
                u = s > 0 ? a - 4 : a
              for (r = 0; r < u; r += 4)
                (e =
                  (i[t.charCodeAt(r)] << 18) |
                  (i[t.charCodeAt(r + 1)] << 12) |
                  (i[t.charCodeAt(r + 2)] << 6) |
                  i[t.charCodeAt(r + 3)]),
                  (h[c++] = (e >> 16) & 255),
                  (h[c++] = (e >> 8) & 255),
                  (h[c++] = 255 & e)
              return (
                2 === s && ((e = (i[t.charCodeAt(r)] << 2) | (i[t.charCodeAt(r + 1)] >> 4)), (h[c++] = 255 & e)),
                1 === s &&
                  ((e = (i[t.charCodeAt(r)] << 10) | (i[t.charCodeAt(r + 1)] << 4) | (i[t.charCodeAt(r + 2)] >> 2)),
                  (h[c++] = (e >> 8) & 255),
                  (h[c++] = 255 & e)),
                h
              )
            }),
            (e.fromByteArray = function (t) {
              for (var e, i = t.length, n = i % 3, o = [], a = 16383, s = 0, f = i - n; s < f; s += a)
                o.push(h(t, s, s + a > f ? f : s + a))
              return (
                1 === n
                  ? ((e = t[i - 1]), o.push(r[e >> 2] + r[(e << 4) & 63] + '=='))
                  : 2 === n &&
                    ((e = (t[i - 2] << 8) + t[i - 1]), o.push(r[e >> 10] + r[(e >> 4) & 63] + r[(e << 2) & 63] + '=')),
                o.join('')
              )
            })
          for (
            var r = [],
              i = [],
              n = 'undefined' != typeof Uint8Array ? Uint8Array : Array,
              o = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
              a = 0,
              s = o.length;
            a < s;
            ++a
          )
            (r[a] = o[a]), (i[o.charCodeAt(a)] = a)
          function f(t) {
            var e = t.length
            if (e % 4 > 0) throw new Error('Invalid string. Length must be a multiple of 4')
            var r = t.indexOf('=')
            return -1 === r && (r = e), [r, r === e ? 0 : 4 - (r % 4)]
          }
          function h(t, e, i) {
            for (var n, o, a = [], s = e; s < i; s += 3)
              (n = ((t[s] << 16) & 16711680) + ((t[s + 1] << 8) & 65280) + (255 & t[s + 2])),
                a.push(r[((o = n) >> 18) & 63] + r[(o >> 12) & 63] + r[(o >> 6) & 63] + r[63 & o])
            return a.join('')
          }
          ;(i['-'.charCodeAt(0)] = 62), (i['_'.charCodeAt(0)] = 63)
        },
        5612: function (t, e, r) {
          !(function (t, e) {
            'use strict'
            function i(t, e) {
              if (!t) throw new Error(e || 'Assertion failed')
            }
            function n(t, e) {
              t.super_ = e
              var r = function () {}
              ;(r.prototype = e.prototype), (t.prototype = new r()), (t.prototype.constructor = t)
            }
            function o(t, e, r) {
              if (o.isBN(t)) return t
              ;(this.negative = 0),
                (this.words = null),
                (this.length = 0),
                (this.red = null),
                null !== t &&
                  (('le' !== e && 'be' !== e) || ((r = e), (e = 10)), this._init(t || 0, e || 10, r || 'be'))
            }
            var a
            'object' == typeof t ? (t.exports = o) : (e.BN = o), (o.BN = o), (o.wordSize = 26)
            try {
              a = r(2574).Buffer
            } catch (t) {}
            function s(t, e, r) {
              for (var i = 0, n = Math.min(t.length, r), o = e; o < n; o++) {
                var a = t.charCodeAt(o) - 48
                ;(i <<= 4), (i |= a >= 49 && a <= 54 ? a - 49 + 10 : a >= 17 && a <= 22 ? a - 17 + 10 : 15 & a)
              }
              return i
            }
            function f(t, e, r, i) {
              for (var n = 0, o = Math.min(t.length, r), a = e; a < o; a++) {
                var s = t.charCodeAt(a) - 48
                ;(n *= i), (n += s >= 49 ? s - 49 + 10 : s >= 17 ? s - 17 + 10 : s)
              }
              return n
            }
            ;(o.isBN = function (t) {
              return (
                t instanceof o ||
                (null !== t && 'object' == typeof t && t.constructor.wordSize === o.wordSize && Array.isArray(t.words))
              )
            }),
              (o.max = function (t, e) {
                return t.cmp(e) > 0 ? t : e
              }),
              (o.min = function (t, e) {
                return t.cmp(e) < 0 ? t : e
              }),
              (o.prototype._init = function (t, e, r) {
                if ('number' == typeof t) return this._initNumber(t, e, r)
                if ('object' == typeof t) return this._initArray(t, e, r)
                'hex' === e && (e = 16), i(e === (0 | e) && e >= 2 && e <= 36)
                var n = 0
                '-' === (t = t.toString().replace(/\s+/g, ''))[0] && n++,
                  16 === e ? this._parseHex(t, n) : this._parseBase(t, e, n),
                  '-' === t[0] && (this.negative = 1),
                  this.strip(),
                  'le' === r && this._initArray(this.toArray(), e, r)
              }),
              (o.prototype._initNumber = function (t, e, r) {
                t < 0 && ((this.negative = 1), (t = -t)),
                  t < 67108864
                    ? ((this.words = [67108863 & t]), (this.length = 1))
                    : t < 4503599627370496
                    ? ((this.words = [67108863 & t, (t / 67108864) & 67108863]), (this.length = 2))
                    : (i(t < 9007199254740992),
                      (this.words = [67108863 & t, (t / 67108864) & 67108863, 1]),
                      (this.length = 3)),
                  'le' === r && this._initArray(this.toArray(), e, r)
              }),
              (o.prototype._initArray = function (t, e, r) {
                if ((i('number' == typeof t.length), t.length <= 0)) return (this.words = [0]), (this.length = 1), this
                ;(this.length = Math.ceil(t.length / 3)), (this.words = new Array(this.length))
                for (var n = 0; n < this.length; n++) this.words[n] = 0
                var o,
                  a,
                  s = 0
                if ('be' === r)
                  for (n = t.length - 1, o = 0; n >= 0; n -= 3)
                    (a = t[n] | (t[n - 1] << 8) | (t[n - 2] << 16)),
                      (this.words[o] |= (a << s) & 67108863),
                      (this.words[o + 1] = (a >>> (26 - s)) & 67108863),
                      (s += 24) >= 26 && ((s -= 26), o++)
                else if ('le' === r)
                  for (n = 0, o = 0; n < t.length; n += 3)
                    (a = t[n] | (t[n + 1] << 8) | (t[n + 2] << 16)),
                      (this.words[o] |= (a << s) & 67108863),
                      (this.words[o + 1] = (a >>> (26 - s)) & 67108863),
                      (s += 24) >= 26 && ((s -= 26), o++)
                return this.strip()
              }),
              (o.prototype._parseHex = function (t, e) {
                ;(this.length = Math.ceil((t.length - e) / 6)), (this.words = new Array(this.length))
                for (var r = 0; r < this.length; r++) this.words[r] = 0
                var i,
                  n,
                  o = 0
                for (r = t.length - 6, i = 0; r >= e; r -= 6)
                  (n = s(t, r, r + 6)),
                    (this.words[i] |= (n << o) & 67108863),
                    (this.words[i + 1] |= (n >>> (26 - o)) & 4194303),
                    (o += 24) >= 26 && ((o -= 26), i++)
                r + 6 !== e &&
                  ((n = s(t, e, r + 6)),
                  (this.words[i] |= (n << o) & 67108863),
                  (this.words[i + 1] |= (n >>> (26 - o)) & 4194303)),
                  this.strip()
              }),
              (o.prototype._parseBase = function (t, e, r) {
                ;(this.words = [0]), (this.length = 1)
                for (var i = 0, n = 1; n <= 67108863; n *= e) i++
                i--, (n = (n / e) | 0)
                for (var o = t.length - r, a = o % i, s = Math.min(o, o - a) + r, h = 0, c = r; c < s; c += i)
                  (h = f(t, c, c + i, e)),
                    this.imuln(n),
                    this.words[0] + h < 67108864 ? (this.words[0] += h) : this._iaddn(h)
                if (0 !== a) {
                  var u = 1
                  for (h = f(t, c, t.length, e), c = 0; c < a; c++) u *= e
                  this.imuln(u), this.words[0] + h < 67108864 ? (this.words[0] += h) : this._iaddn(h)
                }
              }),
              (o.prototype.copy = function (t) {
                t.words = new Array(this.length)
                for (var e = 0; e < this.length; e++) t.words[e] = this.words[e]
                ;(t.length = this.length), (t.negative = this.negative), (t.red = this.red)
              }),
              (o.prototype.clone = function () {
                var t = new o(null)
                return this.copy(t), t
              }),
              (o.prototype._expand = function (t) {
                for (; this.length < t; ) this.words[this.length++] = 0
                return this
              }),
              (o.prototype.strip = function () {
                for (; this.length > 1 && 0 === this.words[this.length - 1]; ) this.length--
                return this._normSign()
              }),
              (o.prototype._normSign = function () {
                return 1 === this.length && 0 === this.words[0] && (this.negative = 0), this
              }),
              (o.prototype.inspect = function () {
                return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>'
              })
            var h = [
                '',
                '0',
                '00',
                '000',
                '0000',
                '00000',
                '000000',
                '0000000',
                '00000000',
                '000000000',
                '0000000000',
                '00000000000',
                '000000000000',
                '0000000000000',
                '00000000000000',
                '000000000000000',
                '0000000000000000',
                '00000000000000000',
                '000000000000000000',
                '0000000000000000000',
                '00000000000000000000',
                '000000000000000000000',
                '0000000000000000000000',
                '00000000000000000000000',
                '000000000000000000000000',
                '0000000000000000000000000',
              ],
              c = [
                0, 0, 25, 16, 12, 11, 10, 9, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
                5, 5, 5, 5,
              ],
              u = [
                0, 0, 33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216, 43046721, 1e7, 19487171,
                35831808, 62748517, 7529536, 11390625, 16777216, 24137569, 34012224, 47045881, 64e6, 4084101, 5153632,
                6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149, 243e5, 28629151, 33554432, 39135393,
                45435424, 52521875, 60466176,
              ]
            function d(t, e, r) {
              r.negative = e.negative ^ t.negative
              var i = (t.length + e.length) | 0
              ;(r.length = i), (i = (i - 1) | 0)
              var n = 0 | t.words[0],
                o = 0 | e.words[0],
                a = n * o,
                s = 67108863 & a,
                f = (a / 67108864) | 0
              r.words[0] = s
              for (var h = 1; h < i; h++) {
                for (
                  var c = f >>> 26, u = 67108863 & f, d = Math.min(h, e.length - 1), l = Math.max(0, h - t.length + 1);
                  l <= d;
                  l++
                ) {
                  var p = (h - l) | 0
                  ;(c += ((a = (n = 0 | t.words[p]) * (o = 0 | e.words[l]) + u) / 67108864) | 0), (u = 67108863 & a)
                }
                ;(r.words[h] = 0 | u), (f = 0 | c)
              }
              return 0 !== f ? (r.words[h] = 0 | f) : r.length--, r.strip()
            }
            ;(o.prototype.toString = function (t, e) {
              var r
              if (((e = 0 | e || 1), 16 === (t = t || 10) || 'hex' === t)) {
                r = ''
                for (var n = 0, o = 0, a = 0; a < this.length; a++) {
                  var s = this.words[a],
                    f = (16777215 & ((s << n) | o)).toString(16)
                  ;(r =
                    0 != (o = (s >>> (24 - n)) & 16777215) || a !== this.length - 1 ? h[6 - f.length] + f + r : f + r),
                    (n += 2) >= 26 && ((n -= 26), a--)
                }
                for (0 !== o && (r = o.toString(16) + r); r.length % e != 0; ) r = '0' + r
                return 0 !== this.negative && (r = '-' + r), r
              }
              if (t === (0 | t) && t >= 2 && t <= 36) {
                var d = c[t],
                  l = u[t]
                r = ''
                var p = this.clone()
                for (p.negative = 0; !p.isZero(); ) {
                  var b = p.modn(l).toString(t)
                  r = (p = p.idivn(l)).isZero() ? b + r : h[d - b.length] + b + r
                }
                for (this.isZero() && (r = '0' + r); r.length % e != 0; ) r = '0' + r
                return 0 !== this.negative && (r = '-' + r), r
              }
              i(!1, 'Base should be between 2 and 36')
            }),
              (o.prototype.toNumber = function () {
                var t = this.words[0]
                return (
                  2 === this.length
                    ? (t += 67108864 * this.words[1])
                    : 3 === this.length && 1 === this.words[2]
                    ? (t += 4503599627370496 + 67108864 * this.words[1])
                    : this.length > 2 && i(!1, 'Number can only safely store up to 53 bits'),
                  0 !== this.negative ? -t : t
                )
              }),
              (o.prototype.toJSON = function () {
                return this.toString(16)
              }),
              (o.prototype.toBuffer = function (t, e) {
                return i(void 0 !== a), this.toArrayLike(a, t, e)
              }),
              (o.prototype.toArray = function (t, e) {
                return this.toArrayLike(Array, t, e)
              }),
              (o.prototype.toArrayLike = function (t, e, r) {
                var n = this.byteLength(),
                  o = r || Math.max(1, n)
                i(n <= o, 'byte array longer than desired length'),
                  i(o > 0, 'Requested array length <= 0'),
                  this.strip()
                var a,
                  s,
                  f = 'le' === e,
                  h = new t(o),
                  c = this.clone()
                if (f) {
                  for (s = 0; !c.isZero(); s++) (a = c.andln(255)), c.iushrn(8), (h[s] = a)
                  for (; s < o; s++) h[s] = 0
                } else {
                  for (s = 0; s < o - n; s++) h[s] = 0
                  for (s = 0; !c.isZero(); s++) (a = c.andln(255)), c.iushrn(8), (h[o - s - 1] = a)
                }
                return h
              }),
              Math.clz32
                ? (o.prototype._countBits = function (t) {
                    return 32 - Math.clz32(t)
                  })
                : (o.prototype._countBits = function (t) {
                    var e = t,
                      r = 0
                    return (
                      e >= 4096 && ((r += 13), (e >>>= 13)),
                      e >= 64 && ((r += 7), (e >>>= 7)),
                      e >= 8 && ((r += 4), (e >>>= 4)),
                      e >= 2 && ((r += 2), (e >>>= 2)),
                      r + e
                    )
                  }),
              (o.prototype._zeroBits = function (t) {
                if (0 === t) return 26
                var e = t,
                  r = 0
                return (
                  0 == (8191 & e) && ((r += 13), (e >>>= 13)),
                  0 == (127 & e) && ((r += 7), (e >>>= 7)),
                  0 == (15 & e) && ((r += 4), (e >>>= 4)),
                  0 == (3 & e) && ((r += 2), (e >>>= 2)),
                  0 == (1 & e) && r++,
                  r
                )
              }),
              (o.prototype.bitLength = function () {
                var t = this.words[this.length - 1],
                  e = this._countBits(t)
                return 26 * (this.length - 1) + e
              }),
              (o.prototype.zeroBits = function () {
                if (this.isZero()) return 0
                for (var t = 0, e = 0; e < this.length; e++) {
                  var r = this._zeroBits(this.words[e])
                  if (((t += r), 26 !== r)) break
                }
                return t
              }),
              (o.prototype.byteLength = function () {
                return Math.ceil(this.bitLength() / 8)
              }),
              (o.prototype.toTwos = function (t) {
                return 0 !== this.negative ? this.abs().inotn(t).iaddn(1) : this.clone()
              }),
              (o.prototype.fromTwos = function (t) {
                return this.testn(t - 1) ? this.notn(t).iaddn(1).ineg() : this.clone()
              }),
              (o.prototype.isNeg = function () {
                return 0 !== this.negative
              }),
              (o.prototype.neg = function () {
                return this.clone().ineg()
              }),
              (o.prototype.ineg = function () {
                return this.isZero() || (this.negative ^= 1), this
              }),
              (o.prototype.iuor = function (t) {
                for (; this.length < t.length; ) this.words[this.length++] = 0
                for (var e = 0; e < t.length; e++) this.words[e] = this.words[e] | t.words[e]
                return this.strip()
              }),
              (o.prototype.ior = function (t) {
                return i(0 == (this.negative | t.negative)), this.iuor(t)
              }),
              (o.prototype.or = function (t) {
                return this.length > t.length ? this.clone().ior(t) : t.clone().ior(this)
              }),
              (o.prototype.uor = function (t) {
                return this.length > t.length ? this.clone().iuor(t) : t.clone().iuor(this)
              }),
              (o.prototype.iuand = function (t) {
                var e
                e = this.length > t.length ? t : this
                for (var r = 0; r < e.length; r++) this.words[r] = this.words[r] & t.words[r]
                return (this.length = e.length), this.strip()
              }),
              (o.prototype.iand = function (t) {
                return i(0 == (this.negative | t.negative)), this.iuand(t)
              }),
              (o.prototype.and = function (t) {
                return this.length > t.length ? this.clone().iand(t) : t.clone().iand(this)
              }),
              (o.prototype.uand = function (t) {
                return this.length > t.length ? this.clone().iuand(t) : t.clone().iuand(this)
              }),
              (o.prototype.iuxor = function (t) {
                var e, r
                this.length > t.length ? ((e = this), (r = t)) : ((e = t), (r = this))
                for (var i = 0; i < r.length; i++) this.words[i] = e.words[i] ^ r.words[i]
                if (this !== e) for (; i < e.length; i++) this.words[i] = e.words[i]
                return (this.length = e.length), this.strip()
              }),
              (o.prototype.ixor = function (t) {
                return i(0 == (this.negative | t.negative)), this.iuxor(t)
              }),
              (o.prototype.xor = function (t) {
                return this.length > t.length ? this.clone().ixor(t) : t.clone().ixor(this)
              }),
              (o.prototype.uxor = function (t) {
                return this.length > t.length ? this.clone().iuxor(t) : t.clone().iuxor(this)
              }),
              (o.prototype.inotn = function (t) {
                i('number' == typeof t && t >= 0)
                var e = 0 | Math.ceil(t / 26),
                  r = t % 26
                this._expand(e), r > 0 && e--
                for (var n = 0; n < e; n++) this.words[n] = 67108863 & ~this.words[n]
                return r > 0 && (this.words[n] = ~this.words[n] & (67108863 >> (26 - r))), this.strip()
              }),
              (o.prototype.notn = function (t) {
                return this.clone().inotn(t)
              }),
              (o.prototype.setn = function (t, e) {
                i('number' == typeof t && t >= 0)
                var r = (t / 26) | 0,
                  n = t % 26
                return (
                  this._expand(r + 1),
                  (this.words[r] = e ? this.words[r] | (1 << n) : this.words[r] & ~(1 << n)),
                  this.strip()
                )
              }),
              (o.prototype.iadd = function (t) {
                var e, r, i
                if (0 !== this.negative && 0 === t.negative)
                  return (this.negative = 0), (e = this.isub(t)), (this.negative ^= 1), this._normSign()
                if (0 === this.negative && 0 !== t.negative)
                  return (t.negative = 0), (e = this.isub(t)), (t.negative = 1), e._normSign()
                this.length > t.length ? ((r = this), (i = t)) : ((r = t), (i = this))
                for (var n = 0, o = 0; o < i.length; o++)
                  (e = (0 | r.words[o]) + (0 | i.words[o]) + n), (this.words[o] = 67108863 & e), (n = e >>> 26)
                for (; 0 !== n && o < r.length; o++)
                  (e = (0 | r.words[o]) + n), (this.words[o] = 67108863 & e), (n = e >>> 26)
                if (((this.length = r.length), 0 !== n)) (this.words[this.length] = n), this.length++
                else if (r !== this) for (; o < r.length; o++) this.words[o] = r.words[o]
                return this
              }),
              (o.prototype.add = function (t) {
                var e
                return 0 !== t.negative && 0 === this.negative
                  ? ((t.negative = 0), (e = this.sub(t)), (t.negative ^= 1), e)
                  : 0 === t.negative && 0 !== this.negative
                  ? ((this.negative = 0), (e = t.sub(this)), (this.negative = 1), e)
                  : this.length > t.length
                  ? this.clone().iadd(t)
                  : t.clone().iadd(this)
              }),
              (o.prototype.isub = function (t) {
                if (0 !== t.negative) {
                  t.negative = 0
                  var e = this.iadd(t)
                  return (t.negative = 1), e._normSign()
                }
                if (0 !== this.negative) return (this.negative = 0), this.iadd(t), (this.negative = 1), this._normSign()
                var r,
                  i,
                  n = this.cmp(t)
                if (0 === n) return (this.negative = 0), (this.length = 1), (this.words[0] = 0), this
                n > 0 ? ((r = this), (i = t)) : ((r = t), (i = this))
                for (var o = 0, a = 0; a < i.length; a++)
                  (o = (e = (0 | r.words[a]) - (0 | i.words[a]) + o) >> 26), (this.words[a] = 67108863 & e)
                for (; 0 !== o && a < r.length; a++)
                  (o = (e = (0 | r.words[a]) + o) >> 26), (this.words[a] = 67108863 & e)
                if (0 === o && a < r.length && r !== this) for (; a < r.length; a++) this.words[a] = r.words[a]
                return (this.length = Math.max(this.length, a)), r !== this && (this.negative = 1), this.strip()
              }),
              (o.prototype.sub = function (t) {
                return this.clone().isub(t)
              })
            var l = function (t, e, r) {
              var i,
                n,
                o,
                a = t.words,
                s = e.words,
                f = r.words,
                h = 0,
                c = 0 | a[0],
                u = 8191 & c,
                d = c >>> 13,
                l = 0 | a[1],
                p = 8191 & l,
                b = l >>> 13,
                m = 0 | a[2],
                y = 8191 & m,
                g = m >>> 13,
                v = 0 | a[3],
                _ = 8191 & v,
                w = v >>> 13,
                M = 0 | a[4],
                S = 8191 & M,
                E = M >>> 13,
                A = 0 | a[5],
                k = 8191 & A,
                I = A >>> 13,
                B = 0 | a[6],
                R = 8191 & B,
                x = B >>> 13,
                T = 0 | a[7],
                L = 8191 & T,
                C = T >>> 13,
                P = 0 | a[8],
                O = 8191 & P,
                N = P >>> 13,
                U = 0 | a[9],
                D = 8191 & U,
                j = U >>> 13,
                q = 0 | s[0],
                z = 8191 & q,
                K = q >>> 13,
                F = 0 | s[1],
                H = 8191 & F,
                V = F >>> 13,
                W = 0 | s[2],
                Y = 8191 & W,
                G = W >>> 13,
                Z = 0 | s[3],
                X = 8191 & Z,
                $ = Z >>> 13,
                J = 0 | s[4],
                Q = 8191 & J,
                tt = J >>> 13,
                et = 0 | s[5],
                rt = 8191 & et,
                it = et >>> 13,
                nt = 0 | s[6],
                ot = 8191 & nt,
                at = nt >>> 13,
                st = 0 | s[7],
                ft = 8191 & st,
                ht = st >>> 13,
                ct = 0 | s[8],
                ut = 8191 & ct,
                dt = ct >>> 13,
                lt = 0 | s[9],
                pt = 8191 & lt,
                bt = lt >>> 13
              ;(r.negative = t.negative ^ e.negative), (r.length = 19)
              var mt =
                (((h + (i = Math.imul(u, z))) | 0) +
                  ((8191 & (n = ((n = Math.imul(u, K)) + Math.imul(d, z)) | 0)) << 13)) |
                0
              ;(h = ((((o = Math.imul(d, K)) + (n >>> 13)) | 0) + (mt >>> 26)) | 0),
                (mt &= 67108863),
                (i = Math.imul(p, z)),
                (n = ((n = Math.imul(p, K)) + Math.imul(b, z)) | 0),
                (o = Math.imul(b, K))
              var yt =
                (((h + (i = (i + Math.imul(u, H)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, V)) | 0) + Math.imul(d, H)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, V)) | 0) + (n >>> 13)) | 0) + (yt >>> 26)) | 0),
                (yt &= 67108863),
                (i = Math.imul(y, z)),
                (n = ((n = Math.imul(y, K)) + Math.imul(g, z)) | 0),
                (o = Math.imul(g, K)),
                (i = (i + Math.imul(p, H)) | 0),
                (n = ((n = (n + Math.imul(p, V)) | 0) + Math.imul(b, H)) | 0),
                (o = (o + Math.imul(b, V)) | 0)
              var gt =
                (((h + (i = (i + Math.imul(u, Y)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, G)) | 0) + Math.imul(d, Y)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, G)) | 0) + (n >>> 13)) | 0) + (gt >>> 26)) | 0),
                (gt &= 67108863),
                (i = Math.imul(_, z)),
                (n = ((n = Math.imul(_, K)) + Math.imul(w, z)) | 0),
                (o = Math.imul(w, K)),
                (i = (i + Math.imul(y, H)) | 0),
                (n = ((n = (n + Math.imul(y, V)) | 0) + Math.imul(g, H)) | 0),
                (o = (o + Math.imul(g, V)) | 0),
                (i = (i + Math.imul(p, Y)) | 0),
                (n = ((n = (n + Math.imul(p, G)) | 0) + Math.imul(b, Y)) | 0),
                (o = (o + Math.imul(b, G)) | 0)
              var vt =
                (((h + (i = (i + Math.imul(u, X)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, $)) | 0) + Math.imul(d, X)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, $)) | 0) + (n >>> 13)) | 0) + (vt >>> 26)) | 0),
                (vt &= 67108863),
                (i = Math.imul(S, z)),
                (n = ((n = Math.imul(S, K)) + Math.imul(E, z)) | 0),
                (o = Math.imul(E, K)),
                (i = (i + Math.imul(_, H)) | 0),
                (n = ((n = (n + Math.imul(_, V)) | 0) + Math.imul(w, H)) | 0),
                (o = (o + Math.imul(w, V)) | 0),
                (i = (i + Math.imul(y, Y)) | 0),
                (n = ((n = (n + Math.imul(y, G)) | 0) + Math.imul(g, Y)) | 0),
                (o = (o + Math.imul(g, G)) | 0),
                (i = (i + Math.imul(p, X)) | 0),
                (n = ((n = (n + Math.imul(p, $)) | 0) + Math.imul(b, X)) | 0),
                (o = (o + Math.imul(b, $)) | 0)
              var _t =
                (((h + (i = (i + Math.imul(u, Q)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, tt)) | 0) + Math.imul(d, Q)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, tt)) | 0) + (n >>> 13)) | 0) + (_t >>> 26)) | 0),
                (_t &= 67108863),
                (i = Math.imul(k, z)),
                (n = ((n = Math.imul(k, K)) + Math.imul(I, z)) | 0),
                (o = Math.imul(I, K)),
                (i = (i + Math.imul(S, H)) | 0),
                (n = ((n = (n + Math.imul(S, V)) | 0) + Math.imul(E, H)) | 0),
                (o = (o + Math.imul(E, V)) | 0),
                (i = (i + Math.imul(_, Y)) | 0),
                (n = ((n = (n + Math.imul(_, G)) | 0) + Math.imul(w, Y)) | 0),
                (o = (o + Math.imul(w, G)) | 0),
                (i = (i + Math.imul(y, X)) | 0),
                (n = ((n = (n + Math.imul(y, $)) | 0) + Math.imul(g, X)) | 0),
                (o = (o + Math.imul(g, $)) | 0),
                (i = (i + Math.imul(p, Q)) | 0),
                (n = ((n = (n + Math.imul(p, tt)) | 0) + Math.imul(b, Q)) | 0),
                (o = (o + Math.imul(b, tt)) | 0)
              var wt =
                (((h + (i = (i + Math.imul(u, rt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, it)) | 0) + Math.imul(d, rt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, it)) | 0) + (n >>> 13)) | 0) + (wt >>> 26)) | 0),
                (wt &= 67108863),
                (i = Math.imul(R, z)),
                (n = ((n = Math.imul(R, K)) + Math.imul(x, z)) | 0),
                (o = Math.imul(x, K)),
                (i = (i + Math.imul(k, H)) | 0),
                (n = ((n = (n + Math.imul(k, V)) | 0) + Math.imul(I, H)) | 0),
                (o = (o + Math.imul(I, V)) | 0),
                (i = (i + Math.imul(S, Y)) | 0),
                (n = ((n = (n + Math.imul(S, G)) | 0) + Math.imul(E, Y)) | 0),
                (o = (o + Math.imul(E, G)) | 0),
                (i = (i + Math.imul(_, X)) | 0),
                (n = ((n = (n + Math.imul(_, $)) | 0) + Math.imul(w, X)) | 0),
                (o = (o + Math.imul(w, $)) | 0),
                (i = (i + Math.imul(y, Q)) | 0),
                (n = ((n = (n + Math.imul(y, tt)) | 0) + Math.imul(g, Q)) | 0),
                (o = (o + Math.imul(g, tt)) | 0),
                (i = (i + Math.imul(p, rt)) | 0),
                (n = ((n = (n + Math.imul(p, it)) | 0) + Math.imul(b, rt)) | 0),
                (o = (o + Math.imul(b, it)) | 0)
              var Mt =
                (((h + (i = (i + Math.imul(u, ot)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, at)) | 0) + Math.imul(d, ot)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, at)) | 0) + (n >>> 13)) | 0) + (Mt >>> 26)) | 0),
                (Mt &= 67108863),
                (i = Math.imul(L, z)),
                (n = ((n = Math.imul(L, K)) + Math.imul(C, z)) | 0),
                (o = Math.imul(C, K)),
                (i = (i + Math.imul(R, H)) | 0),
                (n = ((n = (n + Math.imul(R, V)) | 0) + Math.imul(x, H)) | 0),
                (o = (o + Math.imul(x, V)) | 0),
                (i = (i + Math.imul(k, Y)) | 0),
                (n = ((n = (n + Math.imul(k, G)) | 0) + Math.imul(I, Y)) | 0),
                (o = (o + Math.imul(I, G)) | 0),
                (i = (i + Math.imul(S, X)) | 0),
                (n = ((n = (n + Math.imul(S, $)) | 0) + Math.imul(E, X)) | 0),
                (o = (o + Math.imul(E, $)) | 0),
                (i = (i + Math.imul(_, Q)) | 0),
                (n = ((n = (n + Math.imul(_, tt)) | 0) + Math.imul(w, Q)) | 0),
                (o = (o + Math.imul(w, tt)) | 0),
                (i = (i + Math.imul(y, rt)) | 0),
                (n = ((n = (n + Math.imul(y, it)) | 0) + Math.imul(g, rt)) | 0),
                (o = (o + Math.imul(g, it)) | 0),
                (i = (i + Math.imul(p, ot)) | 0),
                (n = ((n = (n + Math.imul(p, at)) | 0) + Math.imul(b, ot)) | 0),
                (o = (o + Math.imul(b, at)) | 0)
              var St =
                (((h + (i = (i + Math.imul(u, ft)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, ht)) | 0) + Math.imul(d, ft)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, ht)) | 0) + (n >>> 13)) | 0) + (St >>> 26)) | 0),
                (St &= 67108863),
                (i = Math.imul(O, z)),
                (n = ((n = Math.imul(O, K)) + Math.imul(N, z)) | 0),
                (o = Math.imul(N, K)),
                (i = (i + Math.imul(L, H)) | 0),
                (n = ((n = (n + Math.imul(L, V)) | 0) + Math.imul(C, H)) | 0),
                (o = (o + Math.imul(C, V)) | 0),
                (i = (i + Math.imul(R, Y)) | 0),
                (n = ((n = (n + Math.imul(R, G)) | 0) + Math.imul(x, Y)) | 0),
                (o = (o + Math.imul(x, G)) | 0),
                (i = (i + Math.imul(k, X)) | 0),
                (n = ((n = (n + Math.imul(k, $)) | 0) + Math.imul(I, X)) | 0),
                (o = (o + Math.imul(I, $)) | 0),
                (i = (i + Math.imul(S, Q)) | 0),
                (n = ((n = (n + Math.imul(S, tt)) | 0) + Math.imul(E, Q)) | 0),
                (o = (o + Math.imul(E, tt)) | 0),
                (i = (i + Math.imul(_, rt)) | 0),
                (n = ((n = (n + Math.imul(_, it)) | 0) + Math.imul(w, rt)) | 0),
                (o = (o + Math.imul(w, it)) | 0),
                (i = (i + Math.imul(y, ot)) | 0),
                (n = ((n = (n + Math.imul(y, at)) | 0) + Math.imul(g, ot)) | 0),
                (o = (o + Math.imul(g, at)) | 0),
                (i = (i + Math.imul(p, ft)) | 0),
                (n = ((n = (n + Math.imul(p, ht)) | 0) + Math.imul(b, ft)) | 0),
                (o = (o + Math.imul(b, ht)) | 0)
              var Et =
                (((h + (i = (i + Math.imul(u, ut)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, dt)) | 0) + Math.imul(d, ut)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, dt)) | 0) + (n >>> 13)) | 0) + (Et >>> 26)) | 0),
                (Et &= 67108863),
                (i = Math.imul(D, z)),
                (n = ((n = Math.imul(D, K)) + Math.imul(j, z)) | 0),
                (o = Math.imul(j, K)),
                (i = (i + Math.imul(O, H)) | 0),
                (n = ((n = (n + Math.imul(O, V)) | 0) + Math.imul(N, H)) | 0),
                (o = (o + Math.imul(N, V)) | 0),
                (i = (i + Math.imul(L, Y)) | 0),
                (n = ((n = (n + Math.imul(L, G)) | 0) + Math.imul(C, Y)) | 0),
                (o = (o + Math.imul(C, G)) | 0),
                (i = (i + Math.imul(R, X)) | 0),
                (n = ((n = (n + Math.imul(R, $)) | 0) + Math.imul(x, X)) | 0),
                (o = (o + Math.imul(x, $)) | 0),
                (i = (i + Math.imul(k, Q)) | 0),
                (n = ((n = (n + Math.imul(k, tt)) | 0) + Math.imul(I, Q)) | 0),
                (o = (o + Math.imul(I, tt)) | 0),
                (i = (i + Math.imul(S, rt)) | 0),
                (n = ((n = (n + Math.imul(S, it)) | 0) + Math.imul(E, rt)) | 0),
                (o = (o + Math.imul(E, it)) | 0),
                (i = (i + Math.imul(_, ot)) | 0),
                (n = ((n = (n + Math.imul(_, at)) | 0) + Math.imul(w, ot)) | 0),
                (o = (o + Math.imul(w, at)) | 0),
                (i = (i + Math.imul(y, ft)) | 0),
                (n = ((n = (n + Math.imul(y, ht)) | 0) + Math.imul(g, ft)) | 0),
                (o = (o + Math.imul(g, ht)) | 0),
                (i = (i + Math.imul(p, ut)) | 0),
                (n = ((n = (n + Math.imul(p, dt)) | 0) + Math.imul(b, ut)) | 0),
                (o = (o + Math.imul(b, dt)) | 0)
              var At =
                (((h + (i = (i + Math.imul(u, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, bt)) | 0) + Math.imul(d, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, bt)) | 0) + (n >>> 13)) | 0) + (At >>> 26)) | 0),
                (At &= 67108863),
                (i = Math.imul(D, H)),
                (n = ((n = Math.imul(D, V)) + Math.imul(j, H)) | 0),
                (o = Math.imul(j, V)),
                (i = (i + Math.imul(O, Y)) | 0),
                (n = ((n = (n + Math.imul(O, G)) | 0) + Math.imul(N, Y)) | 0),
                (o = (o + Math.imul(N, G)) | 0),
                (i = (i + Math.imul(L, X)) | 0),
                (n = ((n = (n + Math.imul(L, $)) | 0) + Math.imul(C, X)) | 0),
                (o = (o + Math.imul(C, $)) | 0),
                (i = (i + Math.imul(R, Q)) | 0),
                (n = ((n = (n + Math.imul(R, tt)) | 0) + Math.imul(x, Q)) | 0),
                (o = (o + Math.imul(x, tt)) | 0),
                (i = (i + Math.imul(k, rt)) | 0),
                (n = ((n = (n + Math.imul(k, it)) | 0) + Math.imul(I, rt)) | 0),
                (o = (o + Math.imul(I, it)) | 0),
                (i = (i + Math.imul(S, ot)) | 0),
                (n = ((n = (n + Math.imul(S, at)) | 0) + Math.imul(E, ot)) | 0),
                (o = (o + Math.imul(E, at)) | 0),
                (i = (i + Math.imul(_, ft)) | 0),
                (n = ((n = (n + Math.imul(_, ht)) | 0) + Math.imul(w, ft)) | 0),
                (o = (o + Math.imul(w, ht)) | 0),
                (i = (i + Math.imul(y, ut)) | 0),
                (n = ((n = (n + Math.imul(y, dt)) | 0) + Math.imul(g, ut)) | 0),
                (o = (o + Math.imul(g, dt)) | 0)
              var kt =
                (((h + (i = (i + Math.imul(p, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(p, bt)) | 0) + Math.imul(b, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(b, bt)) | 0) + (n >>> 13)) | 0) + (kt >>> 26)) | 0),
                (kt &= 67108863),
                (i = Math.imul(D, Y)),
                (n = ((n = Math.imul(D, G)) + Math.imul(j, Y)) | 0),
                (o = Math.imul(j, G)),
                (i = (i + Math.imul(O, X)) | 0),
                (n = ((n = (n + Math.imul(O, $)) | 0) + Math.imul(N, X)) | 0),
                (o = (o + Math.imul(N, $)) | 0),
                (i = (i + Math.imul(L, Q)) | 0),
                (n = ((n = (n + Math.imul(L, tt)) | 0) + Math.imul(C, Q)) | 0),
                (o = (o + Math.imul(C, tt)) | 0),
                (i = (i + Math.imul(R, rt)) | 0),
                (n = ((n = (n + Math.imul(R, it)) | 0) + Math.imul(x, rt)) | 0),
                (o = (o + Math.imul(x, it)) | 0),
                (i = (i + Math.imul(k, ot)) | 0),
                (n = ((n = (n + Math.imul(k, at)) | 0) + Math.imul(I, ot)) | 0),
                (o = (o + Math.imul(I, at)) | 0),
                (i = (i + Math.imul(S, ft)) | 0),
                (n = ((n = (n + Math.imul(S, ht)) | 0) + Math.imul(E, ft)) | 0),
                (o = (o + Math.imul(E, ht)) | 0),
                (i = (i + Math.imul(_, ut)) | 0),
                (n = ((n = (n + Math.imul(_, dt)) | 0) + Math.imul(w, ut)) | 0),
                (o = (o + Math.imul(w, dt)) | 0)
              var It =
                (((h + (i = (i + Math.imul(y, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(y, bt)) | 0) + Math.imul(g, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(g, bt)) | 0) + (n >>> 13)) | 0) + (It >>> 26)) | 0),
                (It &= 67108863),
                (i = Math.imul(D, X)),
                (n = ((n = Math.imul(D, $)) + Math.imul(j, X)) | 0),
                (o = Math.imul(j, $)),
                (i = (i + Math.imul(O, Q)) | 0),
                (n = ((n = (n + Math.imul(O, tt)) | 0) + Math.imul(N, Q)) | 0),
                (o = (o + Math.imul(N, tt)) | 0),
                (i = (i + Math.imul(L, rt)) | 0),
                (n = ((n = (n + Math.imul(L, it)) | 0) + Math.imul(C, rt)) | 0),
                (o = (o + Math.imul(C, it)) | 0),
                (i = (i + Math.imul(R, ot)) | 0),
                (n = ((n = (n + Math.imul(R, at)) | 0) + Math.imul(x, ot)) | 0),
                (o = (o + Math.imul(x, at)) | 0),
                (i = (i + Math.imul(k, ft)) | 0),
                (n = ((n = (n + Math.imul(k, ht)) | 0) + Math.imul(I, ft)) | 0),
                (o = (o + Math.imul(I, ht)) | 0),
                (i = (i + Math.imul(S, ut)) | 0),
                (n = ((n = (n + Math.imul(S, dt)) | 0) + Math.imul(E, ut)) | 0),
                (o = (o + Math.imul(E, dt)) | 0)
              var Bt =
                (((h + (i = (i + Math.imul(_, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(_, bt)) | 0) + Math.imul(w, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(w, bt)) | 0) + (n >>> 13)) | 0) + (Bt >>> 26)) | 0),
                (Bt &= 67108863),
                (i = Math.imul(D, Q)),
                (n = ((n = Math.imul(D, tt)) + Math.imul(j, Q)) | 0),
                (o = Math.imul(j, tt)),
                (i = (i + Math.imul(O, rt)) | 0),
                (n = ((n = (n + Math.imul(O, it)) | 0) + Math.imul(N, rt)) | 0),
                (o = (o + Math.imul(N, it)) | 0),
                (i = (i + Math.imul(L, ot)) | 0),
                (n = ((n = (n + Math.imul(L, at)) | 0) + Math.imul(C, ot)) | 0),
                (o = (o + Math.imul(C, at)) | 0),
                (i = (i + Math.imul(R, ft)) | 0),
                (n = ((n = (n + Math.imul(R, ht)) | 0) + Math.imul(x, ft)) | 0),
                (o = (o + Math.imul(x, ht)) | 0),
                (i = (i + Math.imul(k, ut)) | 0),
                (n = ((n = (n + Math.imul(k, dt)) | 0) + Math.imul(I, ut)) | 0),
                (o = (o + Math.imul(I, dt)) | 0)
              var Rt =
                (((h + (i = (i + Math.imul(S, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(S, bt)) | 0) + Math.imul(E, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(E, bt)) | 0) + (n >>> 13)) | 0) + (Rt >>> 26)) | 0),
                (Rt &= 67108863),
                (i = Math.imul(D, rt)),
                (n = ((n = Math.imul(D, it)) + Math.imul(j, rt)) | 0),
                (o = Math.imul(j, it)),
                (i = (i + Math.imul(O, ot)) | 0),
                (n = ((n = (n + Math.imul(O, at)) | 0) + Math.imul(N, ot)) | 0),
                (o = (o + Math.imul(N, at)) | 0),
                (i = (i + Math.imul(L, ft)) | 0),
                (n = ((n = (n + Math.imul(L, ht)) | 0) + Math.imul(C, ft)) | 0),
                (o = (o + Math.imul(C, ht)) | 0),
                (i = (i + Math.imul(R, ut)) | 0),
                (n = ((n = (n + Math.imul(R, dt)) | 0) + Math.imul(x, ut)) | 0),
                (o = (o + Math.imul(x, dt)) | 0)
              var xt =
                (((h + (i = (i + Math.imul(k, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(k, bt)) | 0) + Math.imul(I, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(I, bt)) | 0) + (n >>> 13)) | 0) + (xt >>> 26)) | 0),
                (xt &= 67108863),
                (i = Math.imul(D, ot)),
                (n = ((n = Math.imul(D, at)) + Math.imul(j, ot)) | 0),
                (o = Math.imul(j, at)),
                (i = (i + Math.imul(O, ft)) | 0),
                (n = ((n = (n + Math.imul(O, ht)) | 0) + Math.imul(N, ft)) | 0),
                (o = (o + Math.imul(N, ht)) | 0),
                (i = (i + Math.imul(L, ut)) | 0),
                (n = ((n = (n + Math.imul(L, dt)) | 0) + Math.imul(C, ut)) | 0),
                (o = (o + Math.imul(C, dt)) | 0)
              var Tt =
                (((h + (i = (i + Math.imul(R, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(R, bt)) | 0) + Math.imul(x, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(x, bt)) | 0) + (n >>> 13)) | 0) + (Tt >>> 26)) | 0),
                (Tt &= 67108863),
                (i = Math.imul(D, ft)),
                (n = ((n = Math.imul(D, ht)) + Math.imul(j, ft)) | 0),
                (o = Math.imul(j, ht)),
                (i = (i + Math.imul(O, ut)) | 0),
                (n = ((n = (n + Math.imul(O, dt)) | 0) + Math.imul(N, ut)) | 0),
                (o = (o + Math.imul(N, dt)) | 0)
              var Lt =
                (((h + (i = (i + Math.imul(L, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(L, bt)) | 0) + Math.imul(C, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(C, bt)) | 0) + (n >>> 13)) | 0) + (Lt >>> 26)) | 0),
                (Lt &= 67108863),
                (i = Math.imul(D, ut)),
                (n = ((n = Math.imul(D, dt)) + Math.imul(j, ut)) | 0),
                (o = Math.imul(j, dt))
              var Ct =
                (((h + (i = (i + Math.imul(O, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(O, bt)) | 0) + Math.imul(N, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(N, bt)) | 0) + (n >>> 13)) | 0) + (Ct >>> 26)) | 0), (Ct &= 67108863)
              var Pt =
                (((h + (i = Math.imul(D, pt))) | 0) +
                  ((8191 & (n = ((n = Math.imul(D, bt)) + Math.imul(j, pt)) | 0)) << 13)) |
                0
              return (
                (h = ((((o = Math.imul(j, bt)) + (n >>> 13)) | 0) + (Pt >>> 26)) | 0),
                (Pt &= 67108863),
                (f[0] = mt),
                (f[1] = yt),
                (f[2] = gt),
                (f[3] = vt),
                (f[4] = _t),
                (f[5] = wt),
                (f[6] = Mt),
                (f[7] = St),
                (f[8] = Et),
                (f[9] = At),
                (f[10] = kt),
                (f[11] = It),
                (f[12] = Bt),
                (f[13] = Rt),
                (f[14] = xt),
                (f[15] = Tt),
                (f[16] = Lt),
                (f[17] = Ct),
                (f[18] = Pt),
                0 !== h && ((f[19] = h), r.length++),
                r
              )
            }
            function p(t, e, r) {
              return new b().mulp(t, e, r)
            }
            function b(t, e) {
              ;(this.x = t), (this.y = e)
            }
            Math.imul || (l = d),
              (o.prototype.mulTo = function (t, e) {
                var r = this.length + t.length
                return 10 === this.length && 10 === t.length
                  ? l(this, t, e)
                  : r < 63
                  ? d(this, t, e)
                  : r < 1024
                  ? (function (t, e, r) {
                      ;(r.negative = e.negative ^ t.negative), (r.length = t.length + e.length)
                      for (var i = 0, n = 0, o = 0; o < r.length - 1; o++) {
                        var a = n
                        n = 0
                        for (
                          var s = 67108863 & i, f = Math.min(o, e.length - 1), h = Math.max(0, o - t.length + 1);
                          h <= f;
                          h++
                        ) {
                          var c = o - h,
                            u = (0 | t.words[c]) * (0 | e.words[h]),
                            d = 67108863 & u
                          ;(s = 67108863 & (d = (d + s) | 0)),
                            (n += (a = ((a = (a + ((u / 67108864) | 0)) | 0) + (d >>> 26)) | 0) >>> 26),
                            (a &= 67108863)
                        }
                        ;(r.words[o] = s), (i = a), (a = n)
                      }
                      return 0 !== i ? (r.words[o] = i) : r.length--, r.strip()
                    })(this, t, e)
                  : p(this, t, e)
              }),
              (b.prototype.makeRBT = function (t) {
                for (var e = new Array(t), r = o.prototype._countBits(t) - 1, i = 0; i < t; i++)
                  e[i] = this.revBin(i, r, t)
                return e
              }),
              (b.prototype.revBin = function (t, e, r) {
                if (0 === t || t === r - 1) return t
                for (var i = 0, n = 0; n < e; n++) (i |= (1 & t) << (e - n - 1)), (t >>= 1)
                return i
              }),
              (b.prototype.permute = function (t, e, r, i, n, o) {
                for (var a = 0; a < o; a++) (i[a] = e[t[a]]), (n[a] = r[t[a]])
              }),
              (b.prototype.transform = function (t, e, r, i, n, o) {
                this.permute(o, t, e, r, i, n)
                for (var a = 1; a < n; a <<= 1)
                  for (
                    var s = a << 1, f = Math.cos((2 * Math.PI) / s), h = Math.sin((2 * Math.PI) / s), c = 0;
                    c < n;
                    c += s
                  )
                    for (var u = f, d = h, l = 0; l < a; l++) {
                      var p = r[c + l],
                        b = i[c + l],
                        m = r[c + l + a],
                        y = i[c + l + a],
                        g = u * m - d * y
                      ;(y = u * y + d * m),
                        (m = g),
                        (r[c + l] = p + m),
                        (i[c + l] = b + y),
                        (r[c + l + a] = p - m),
                        (i[c + l + a] = b - y),
                        l !== s && ((g = f * u - h * d), (d = f * d + h * u), (u = g))
                    }
              }),
              (b.prototype.guessLen13b = function (t, e) {
                var r = 1 | Math.max(e, t),
                  i = 1 & r,
                  n = 0
                for (r = (r / 2) | 0; r; r >>>= 1) n++
                return 1 << (n + 1 + i)
              }),
              (b.prototype.conjugate = function (t, e, r) {
                if (!(r <= 1))
                  for (var i = 0; i < r / 2; i++) {
                    var n = t[i]
                    ;(t[i] = t[r - i - 1]), (t[r - i - 1] = n), (n = e[i]), (e[i] = -e[r - i - 1]), (e[r - i - 1] = -n)
                  }
              }),
              (b.prototype.normalize13b = function (t, e) {
                for (var r = 0, i = 0; i < e / 2; i++) {
                  var n = 8192 * Math.round(t[2 * i + 1] / e) + Math.round(t[2 * i] / e) + r
                  ;(t[i] = 67108863 & n), (r = n < 67108864 ? 0 : (n / 67108864) | 0)
                }
                return t
              }),
              (b.prototype.convert13b = function (t, e, r, n) {
                for (var o = 0, a = 0; a < e; a++)
                  (o += 0 | t[a]), (r[2 * a] = 8191 & o), (o >>>= 13), (r[2 * a + 1] = 8191 & o), (o >>>= 13)
                for (a = 2 * e; a < n; ++a) r[a] = 0
                i(0 === o), i(0 == (-8192 & o))
              }),
              (b.prototype.stub = function (t) {
                for (var e = new Array(t), r = 0; r < t; r++) e[r] = 0
                return e
              }),
              (b.prototype.mulp = function (t, e, r) {
                var i = 2 * this.guessLen13b(t.length, e.length),
                  n = this.makeRBT(i),
                  o = this.stub(i),
                  a = new Array(i),
                  s = new Array(i),
                  f = new Array(i),
                  h = new Array(i),
                  c = new Array(i),
                  u = new Array(i),
                  d = r.words
                ;(d.length = i),
                  this.convert13b(t.words, t.length, a, i),
                  this.convert13b(e.words, e.length, h, i),
                  this.transform(a, o, s, f, i, n),
                  this.transform(h, o, c, u, i, n)
                for (var l = 0; l < i; l++) {
                  var p = s[l] * c[l] - f[l] * u[l]
                  ;(f[l] = s[l] * u[l] + f[l] * c[l]), (s[l] = p)
                }
                return (
                  this.conjugate(s, f, i),
                  this.transform(s, f, d, o, i, n),
                  this.conjugate(d, o, i),
                  this.normalize13b(d, i),
                  (r.negative = t.negative ^ e.negative),
                  (r.length = t.length + e.length),
                  r.strip()
                )
              }),
              (o.prototype.mul = function (t) {
                var e = new o(null)
                return (e.words = new Array(this.length + t.length)), this.mulTo(t, e)
              }),
              (o.prototype.mulf = function (t) {
                var e = new o(null)
                return (e.words = new Array(this.length + t.length)), p(this, t, e)
              }),
              (o.prototype.imul = function (t) {
                return this.clone().mulTo(t, this)
              }),
              (o.prototype.imuln = function (t) {
                i('number' == typeof t), i(t < 67108864)
                for (var e = 0, r = 0; r < this.length; r++) {
                  var n = (0 | this.words[r]) * t,
                    o = (67108863 & n) + (67108863 & e)
                  ;(e >>= 26), (e += (n / 67108864) | 0), (e += o >>> 26), (this.words[r] = 67108863 & o)
                }
                return 0 !== e && ((this.words[r] = e), this.length++), this
              }),
              (o.prototype.muln = function (t) {
                return this.clone().imuln(t)
              }),
              (o.prototype.sqr = function () {
                return this.mul(this)
              }),
              (o.prototype.isqr = function () {
                return this.imul(this.clone())
              }),
              (o.prototype.pow = function (t) {
                var e = (function (t) {
                  for (var e = new Array(t.bitLength()), r = 0; r < e.length; r++) {
                    var i = (r / 26) | 0,
                      n = r % 26
                    e[r] = (t.words[i] & (1 << n)) >>> n
                  }
                  return e
                })(t)
                if (0 === e.length) return new o(1)
                for (var r = this, i = 0; i < e.length && 0 === e[i]; i++, r = r.sqr());
                if (++i < e.length) for (var n = r.sqr(); i < e.length; i++, n = n.sqr()) 0 !== e[i] && (r = r.mul(n))
                return r
              }),
              (o.prototype.iushln = function (t) {
                i('number' == typeof t && t >= 0)
                var e,
                  r = t % 26,
                  n = (t - r) / 26,
                  o = (67108863 >>> (26 - r)) << (26 - r)
                if (0 !== r) {
                  var a = 0
                  for (e = 0; e < this.length; e++) {
                    var s = this.words[e] & o,
                      f = ((0 | this.words[e]) - s) << r
                    ;(this.words[e] = f | a), (a = s >>> (26 - r))
                  }
                  a && ((this.words[e] = a), this.length++)
                }
                if (0 !== n) {
                  for (e = this.length - 1; e >= 0; e--) this.words[e + n] = this.words[e]
                  for (e = 0; e < n; e++) this.words[e] = 0
                  this.length += n
                }
                return this.strip()
              }),
              (o.prototype.ishln = function (t) {
                return i(0 === this.negative), this.iushln(t)
              }),
              (o.prototype.iushrn = function (t, e, r) {
                var n
                i('number' == typeof t && t >= 0), (n = e ? (e - (e % 26)) / 26 : 0)
                var o = t % 26,
                  a = Math.min((t - o) / 26, this.length),
                  s = 67108863 ^ ((67108863 >>> o) << o),
                  f = r
                if (((n -= a), (n = Math.max(0, n)), f)) {
                  for (var h = 0; h < a; h++) f.words[h] = this.words[h]
                  f.length = a
                }
                if (0 === a);
                else if (this.length > a)
                  for (this.length -= a, h = 0; h < this.length; h++) this.words[h] = this.words[h + a]
                else (this.words[0] = 0), (this.length = 1)
                var c = 0
                for (h = this.length - 1; h >= 0 && (0 !== c || h >= n); h--) {
                  var u = 0 | this.words[h]
                  ;(this.words[h] = (c << (26 - o)) | (u >>> o)), (c = u & s)
                }
                return (
                  f && 0 !== c && (f.words[f.length++] = c),
                  0 === this.length && ((this.words[0] = 0), (this.length = 1)),
                  this.strip()
                )
              }),
              (o.prototype.ishrn = function (t, e, r) {
                return i(0 === this.negative), this.iushrn(t, e, r)
              }),
              (o.prototype.shln = function (t) {
                return this.clone().ishln(t)
              }),
              (o.prototype.ushln = function (t) {
                return this.clone().iushln(t)
              }),
              (o.prototype.shrn = function (t) {
                return this.clone().ishrn(t)
              }),
              (o.prototype.ushrn = function (t) {
                return this.clone().iushrn(t)
              }),
              (o.prototype.testn = function (t) {
                i('number' == typeof t && t >= 0)
                var e = t % 26,
                  r = (t - e) / 26,
                  n = 1 << e
                return !(this.length <= r || !(this.words[r] & n))
              }),
              (o.prototype.imaskn = function (t) {
                i('number' == typeof t && t >= 0)
                var e = t % 26,
                  r = (t - e) / 26
                if ((i(0 === this.negative, 'imaskn works only with positive numbers'), this.length <= r)) return this
                if ((0 !== e && r++, (this.length = Math.min(r, this.length)), 0 !== e)) {
                  var n = 67108863 ^ ((67108863 >>> e) << e)
                  this.words[this.length - 1] &= n
                }
                return this.strip()
              }),
              (o.prototype.maskn = function (t) {
                return this.clone().imaskn(t)
              }),
              (o.prototype.iaddn = function (t) {
                return (
                  i('number' == typeof t),
                  i(t < 67108864),
                  t < 0
                    ? this.isubn(-t)
                    : 0 !== this.negative
                    ? 1 === this.length && (0 | this.words[0]) < t
                      ? ((this.words[0] = t - (0 | this.words[0])), (this.negative = 0), this)
                      : ((this.negative = 0), this.isubn(t), (this.negative = 1), this)
                    : this._iaddn(t)
                )
              }),
              (o.prototype._iaddn = function (t) {
                this.words[0] += t
                for (var e = 0; e < this.length && this.words[e] >= 67108864; e++)
                  (this.words[e] -= 67108864), e === this.length - 1 ? (this.words[e + 1] = 1) : this.words[e + 1]++
                return (this.length = Math.max(this.length, e + 1)), this
              }),
              (o.prototype.isubn = function (t) {
                if ((i('number' == typeof t), i(t < 67108864), t < 0)) return this.iaddn(-t)
                if (0 !== this.negative) return (this.negative = 0), this.iaddn(t), (this.negative = 1), this
                if (((this.words[0] -= t), 1 === this.length && this.words[0] < 0))
                  (this.words[0] = -this.words[0]), (this.negative = 1)
                else
                  for (var e = 0; e < this.length && this.words[e] < 0; e++)
                    (this.words[e] += 67108864), (this.words[e + 1] -= 1)
                return this.strip()
              }),
              (o.prototype.addn = function (t) {
                return this.clone().iaddn(t)
              }),
              (o.prototype.subn = function (t) {
                return this.clone().isubn(t)
              }),
              (o.prototype.iabs = function () {
                return (this.negative = 0), this
              }),
              (o.prototype.abs = function () {
                return this.clone().iabs()
              }),
              (o.prototype._ishlnsubmul = function (t, e, r) {
                var n,
                  o,
                  a = t.length + r
                this._expand(a)
                var s = 0
                for (n = 0; n < t.length; n++) {
                  o = (0 | this.words[n + r]) + s
                  var f = (0 | t.words[n]) * e
                  ;(s = ((o -= 67108863 & f) >> 26) - ((f / 67108864) | 0)), (this.words[n + r] = 67108863 & o)
                }
                for (; n < this.length - r; n++)
                  (s = (o = (0 | this.words[n + r]) + s) >> 26), (this.words[n + r] = 67108863 & o)
                if (0 === s) return this.strip()
                for (i(-1 === s), s = 0, n = 0; n < this.length; n++)
                  (s = (o = -(0 | this.words[n]) + s) >> 26), (this.words[n] = 67108863 & o)
                return (this.negative = 1), this.strip()
              }),
              (o.prototype._wordDiv = function (t, e) {
                var r = (this.length, t.length),
                  i = this.clone(),
                  n = t,
                  a = 0 | n.words[n.length - 1]
                0 != (r = 26 - this._countBits(a)) && ((n = n.ushln(r)), i.iushln(r), (a = 0 | n.words[n.length - 1]))
                var s,
                  f = i.length - n.length
                if ('mod' !== e) {
                  ;((s = new o(null)).length = f + 1), (s.words = new Array(s.length))
                  for (var h = 0; h < s.length; h++) s.words[h] = 0
                }
                var c = i.clone()._ishlnsubmul(n, 1, f)
                0 === c.negative && ((i = c), s && (s.words[f] = 1))
                for (var u = f - 1; u >= 0; u--) {
                  var d = 67108864 * (0 | i.words[n.length + u]) + (0 | i.words[n.length + u - 1])
                  for (d = Math.min((d / a) | 0, 67108863), i._ishlnsubmul(n, d, u); 0 !== i.negative; )
                    d--, (i.negative = 0), i._ishlnsubmul(n, 1, u), i.isZero() || (i.negative ^= 1)
                  s && (s.words[u] = d)
                }
                return s && s.strip(), i.strip(), 'div' !== e && 0 !== r && i.iushrn(r), { div: s || null, mod: i }
              }),
              (o.prototype.divmod = function (t, e, r) {
                return (
                  i(!t.isZero()),
                  this.isZero()
                    ? { div: new o(0), mod: new o(0) }
                    : 0 !== this.negative && 0 === t.negative
                    ? ((s = this.neg().divmod(t, e)),
                      'mod' !== e && (n = s.div.neg()),
                      'div' !== e && ((a = s.mod.neg()), r && 0 !== a.negative && a.iadd(t)),
                      { div: n, mod: a })
                    : 0 === this.negative && 0 !== t.negative
                    ? ((s = this.divmod(t.neg(), e)), 'mod' !== e && (n = s.div.neg()), { div: n, mod: s.mod })
                    : 0 != (this.negative & t.negative)
                    ? ((s = this.neg().divmod(t.neg(), e)),
                      'div' !== e && ((a = s.mod.neg()), r && 0 !== a.negative && a.isub(t)),
                      { div: s.div, mod: a })
                    : t.length > this.length || this.cmp(t) < 0
                    ? { div: new o(0), mod: this }
                    : 1 === t.length
                    ? 'div' === e
                      ? { div: this.divn(t.words[0]), mod: null }
                      : 'mod' === e
                      ? { div: null, mod: new o(this.modn(t.words[0])) }
                      : { div: this.divn(t.words[0]), mod: new o(this.modn(t.words[0])) }
                    : this._wordDiv(t, e)
                )
                var n, a, s
              }),
              (o.prototype.div = function (t) {
                return this.divmod(t, 'div', !1).div
              }),
              (o.prototype.mod = function (t) {
                return this.divmod(t, 'mod', !1).mod
              }),
              (o.prototype.umod = function (t) {
                return this.divmod(t, 'mod', !0).mod
              }),
              (o.prototype.divRound = function (t) {
                var e = this.divmod(t)
                if (e.mod.isZero()) return e.div
                var r = 0 !== e.div.negative ? e.mod.isub(t) : e.mod,
                  i = t.ushrn(1),
                  n = t.andln(1),
                  o = r.cmp(i)
                return o < 0 || (1 === n && 0 === o) ? e.div : 0 !== e.div.negative ? e.div.isubn(1) : e.div.iaddn(1)
              }),
              (o.prototype.modn = function (t) {
                i(t <= 67108863)
                for (var e = (1 << 26) % t, r = 0, n = this.length - 1; n >= 0; n--)
                  r = (e * r + (0 | this.words[n])) % t
                return r
              }),
              (o.prototype.idivn = function (t) {
                i(t <= 67108863)
                for (var e = 0, r = this.length - 1; r >= 0; r--) {
                  var n = (0 | this.words[r]) + 67108864 * e
                  ;(this.words[r] = (n / t) | 0), (e = n % t)
                }
                return this.strip()
              }),
              (o.prototype.divn = function (t) {
                return this.clone().idivn(t)
              }),
              (o.prototype.egcd = function (t) {
                i(0 === t.negative), i(!t.isZero())
                var e = this,
                  r = t.clone()
                e = 0 !== e.negative ? e.umod(t) : e.clone()
                for (var n = new o(1), a = new o(0), s = new o(0), f = new o(1), h = 0; e.isEven() && r.isEven(); )
                  e.iushrn(1), r.iushrn(1), ++h
                for (var c = r.clone(), u = e.clone(); !e.isZero(); ) {
                  for (var d = 0, l = 1; 0 == (e.words[0] & l) && d < 26; ++d, l <<= 1);
                  if (d > 0)
                    for (e.iushrn(d); d-- > 0; )
                      (n.isOdd() || a.isOdd()) && (n.iadd(c), a.isub(u)), n.iushrn(1), a.iushrn(1)
                  for (var p = 0, b = 1; 0 == (r.words[0] & b) && p < 26; ++p, b <<= 1);
                  if (p > 0)
                    for (r.iushrn(p); p-- > 0; )
                      (s.isOdd() || f.isOdd()) && (s.iadd(c), f.isub(u)), s.iushrn(1), f.iushrn(1)
                  e.cmp(r) >= 0 ? (e.isub(r), n.isub(s), a.isub(f)) : (r.isub(e), s.isub(n), f.isub(a))
                }
                return { a: s, b: f, gcd: r.iushln(h) }
              }),
              (o.prototype._invmp = function (t) {
                i(0 === t.negative), i(!t.isZero())
                var e = this,
                  r = t.clone()
                e = 0 !== e.negative ? e.umod(t) : e.clone()
                for (var n, a = new o(1), s = new o(0), f = r.clone(); e.cmpn(1) > 0 && r.cmpn(1) > 0; ) {
                  for (var h = 0, c = 1; 0 == (e.words[0] & c) && h < 26; ++h, c <<= 1);
                  if (h > 0) for (e.iushrn(h); h-- > 0; ) a.isOdd() && a.iadd(f), a.iushrn(1)
                  for (var u = 0, d = 1; 0 == (r.words[0] & d) && u < 26; ++u, d <<= 1);
                  if (u > 0) for (r.iushrn(u); u-- > 0; ) s.isOdd() && s.iadd(f), s.iushrn(1)
                  e.cmp(r) >= 0 ? (e.isub(r), a.isub(s)) : (r.isub(e), s.isub(a))
                }
                return (n = 0 === e.cmpn(1) ? a : s).cmpn(0) < 0 && n.iadd(t), n
              }),
              (o.prototype.gcd = function (t) {
                if (this.isZero()) return t.abs()
                if (t.isZero()) return this.abs()
                var e = this.clone(),
                  r = t.clone()
                ;(e.negative = 0), (r.negative = 0)
                for (var i = 0; e.isEven() && r.isEven(); i++) e.iushrn(1), r.iushrn(1)
                for (;;) {
                  for (; e.isEven(); ) e.iushrn(1)
                  for (; r.isEven(); ) r.iushrn(1)
                  var n = e.cmp(r)
                  if (n < 0) {
                    var o = e
                    ;(e = r), (r = o)
                  } else if (0 === n || 0 === r.cmpn(1)) break
                  e.isub(r)
                }
                return r.iushln(i)
              }),
              (o.prototype.invm = function (t) {
                return this.egcd(t).a.umod(t)
              }),
              (o.prototype.isEven = function () {
                return 0 == (1 & this.words[0])
              }),
              (o.prototype.isOdd = function () {
                return 1 == (1 & this.words[0])
              }),
              (o.prototype.andln = function (t) {
                return this.words[0] & t
              }),
              (o.prototype.bincn = function (t) {
                i('number' == typeof t)
                var e = t % 26,
                  r = (t - e) / 26,
                  n = 1 << e
                if (this.length <= r) return this._expand(r + 1), (this.words[r] |= n), this
                for (var o = n, a = r; 0 !== o && a < this.length; a++) {
                  var s = 0 | this.words[a]
                  ;(o = (s += o) >>> 26), (s &= 67108863), (this.words[a] = s)
                }
                return 0 !== o && ((this.words[a] = o), this.length++), this
              }),
              (o.prototype.isZero = function () {
                return 1 === this.length && 0 === this.words[0]
              }),
              (o.prototype.cmpn = function (t) {
                var e,
                  r = t < 0
                if (0 !== this.negative && !r) return -1
                if (0 === this.negative && r) return 1
                if ((this.strip(), this.length > 1)) e = 1
                else {
                  r && (t = -t), i(t <= 67108863, 'Number is too big')
                  var n = 0 | this.words[0]
                  e = n === t ? 0 : n < t ? -1 : 1
                }
                return 0 !== this.negative ? 0 | -e : e
              }),
              (o.prototype.cmp = function (t) {
                if (0 !== this.negative && 0 === t.negative) return -1
                if (0 === this.negative && 0 !== t.negative) return 1
                var e = this.ucmp(t)
                return 0 !== this.negative ? 0 | -e : e
              }),
              (o.prototype.ucmp = function (t) {
                if (this.length > t.length) return 1
                if (this.length < t.length) return -1
                for (var e = 0, r = this.length - 1; r >= 0; r--) {
                  var i = 0 | this.words[r],
                    n = 0 | t.words[r]
                  if (i !== n) {
                    i < n ? (e = -1) : i > n && (e = 1)
                    break
                  }
                }
                return e
              }),
              (o.prototype.gtn = function (t) {
                return 1 === this.cmpn(t)
              }),
              (o.prototype.gt = function (t) {
                return 1 === this.cmp(t)
              }),
              (o.prototype.gten = function (t) {
                return this.cmpn(t) >= 0
              }),
              (o.prototype.gte = function (t) {
                return this.cmp(t) >= 0
              }),
              (o.prototype.ltn = function (t) {
                return -1 === this.cmpn(t)
              }),
              (o.prototype.lt = function (t) {
                return -1 === this.cmp(t)
              }),
              (o.prototype.lten = function (t) {
                return this.cmpn(t) <= 0
              }),
              (o.prototype.lte = function (t) {
                return this.cmp(t) <= 0
              }),
              (o.prototype.eqn = function (t) {
                return 0 === this.cmpn(t)
              }),
              (o.prototype.eq = function (t) {
                return 0 === this.cmp(t)
              }),
              (o.red = function (t) {
                return new M(t)
              }),
              (o.prototype.toRed = function (t) {
                return (
                  i(!this.red, 'Already a number in reduction context'),
                  i(0 === this.negative, 'red works only with positives'),
                  t.convertTo(this)._forceRed(t)
                )
              }),
              (o.prototype.fromRed = function () {
                return i(this.red, 'fromRed works only with numbers in reduction context'), this.red.convertFrom(this)
              }),
              (o.prototype._forceRed = function (t) {
                return (this.red = t), this
              }),
              (o.prototype.forceRed = function (t) {
                return i(!this.red, 'Already a number in reduction context'), this._forceRed(t)
              }),
              (o.prototype.redAdd = function (t) {
                return i(this.red, 'redAdd works only with red numbers'), this.red.add(this, t)
              }),
              (o.prototype.redIAdd = function (t) {
                return i(this.red, 'redIAdd works only with red numbers'), this.red.iadd(this, t)
              }),
              (o.prototype.redSub = function (t) {
                return i(this.red, 'redSub works only with red numbers'), this.red.sub(this, t)
              }),
              (o.prototype.redISub = function (t) {
                return i(this.red, 'redISub works only with red numbers'), this.red.isub(this, t)
              }),
              (o.prototype.redShl = function (t) {
                return i(this.red, 'redShl works only with red numbers'), this.red.shl(this, t)
              }),
              (o.prototype.redMul = function (t) {
                return (
                  i(this.red, 'redMul works only with red numbers'), this.red._verify2(this, t), this.red.mul(this, t)
                )
              }),
              (o.prototype.redIMul = function (t) {
                return (
                  i(this.red, 'redMul works only with red numbers'), this.red._verify2(this, t), this.red.imul(this, t)
                )
              }),
              (o.prototype.redSqr = function () {
                return i(this.red, 'redSqr works only with red numbers'), this.red._verify1(this), this.red.sqr(this)
              }),
              (o.prototype.redISqr = function () {
                return i(this.red, 'redISqr works only with red numbers'), this.red._verify1(this), this.red.isqr(this)
              }),
              (o.prototype.redSqrt = function () {
                return i(this.red, 'redSqrt works only with red numbers'), this.red._verify1(this), this.red.sqrt(this)
              }),
              (o.prototype.redInvm = function () {
                return i(this.red, 'redInvm works only with red numbers'), this.red._verify1(this), this.red.invm(this)
              }),
              (o.prototype.redNeg = function () {
                return i(this.red, 'redNeg works only with red numbers'), this.red._verify1(this), this.red.neg(this)
              }),
              (o.prototype.redPow = function (t) {
                return i(this.red && !t.red, 'redPow(normalNum)'), this.red._verify1(this), this.red.pow(this, t)
              })
            var m = { k256: null, p224: null, p192: null, p25519: null }
            function y(t, e) {
              ;(this.name = t),
                (this.p = new o(e, 16)),
                (this.n = this.p.bitLength()),
                (this.k = new o(1).iushln(this.n).isub(this.p)),
                (this.tmp = this._tmp())
            }
            function g() {
              y.call(this, 'k256', 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f')
            }
            function v() {
              y.call(this, 'p224', 'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001')
            }
            function _() {
              y.call(this, 'p192', 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff')
            }
            function w() {
              y.call(this, '25519', '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed')
            }
            function M(t) {
              if ('string' == typeof t) {
                var e = o._prime(t)
                ;(this.m = e.p), (this.prime = e)
              } else i(t.gtn(1), 'modulus must be greater than 1'), (this.m = t), (this.prime = null)
            }
            function S(t) {
              M.call(this, t),
                (this.shift = this.m.bitLength()),
                this.shift % 26 != 0 && (this.shift += 26 - (this.shift % 26)),
                (this.r = new o(1).iushln(this.shift)),
                (this.r2 = this.imod(this.r.sqr())),
                (this.rinv = this.r._invmp(this.m)),
                (this.minv = this.rinv.mul(this.r).isubn(1).div(this.m)),
                (this.minv = this.minv.umod(this.r)),
                (this.minv = this.r.sub(this.minv))
            }
            ;(y.prototype._tmp = function () {
              var t = new o(null)
              return (t.words = new Array(Math.ceil(this.n / 13))), t
            }),
              (y.prototype.ireduce = function (t) {
                var e,
                  r = t
                do {
                  this.split(r, this.tmp), (e = (r = (r = this.imulK(r)).iadd(this.tmp)).bitLength())
                } while (e > this.n)
                var i = e < this.n ? -1 : r.ucmp(this.p)
                return (
                  0 === i
                    ? ((r.words[0] = 0), (r.length = 1))
                    : i > 0
                    ? r.isub(this.p)
                    : void 0 !== r.strip
                    ? r.strip()
                    : r._strip(),
                  r
                )
              }),
              (y.prototype.split = function (t, e) {
                t.iushrn(this.n, 0, e)
              }),
              (y.prototype.imulK = function (t) {
                return t.imul(this.k)
              }),
              n(g, y),
              (g.prototype.split = function (t, e) {
                for (var r = 4194303, i = Math.min(t.length, 9), n = 0; n < i; n++) e.words[n] = t.words[n]
                if (((e.length = i), t.length <= 9)) return (t.words[0] = 0), void (t.length = 1)
                var o = t.words[9]
                for (e.words[e.length++] = o & r, n = 10; n < t.length; n++) {
                  var a = 0 | t.words[n]
                  ;(t.words[n - 10] = ((a & r) << 4) | (o >>> 22)), (o = a)
                }
                ;(o >>>= 22), (t.words[n - 10] = o), 0 === o && t.length > 10 ? (t.length -= 10) : (t.length -= 9)
              }),
              (g.prototype.imulK = function (t) {
                ;(t.words[t.length] = 0), (t.words[t.length + 1] = 0), (t.length += 2)
                for (var e = 0, r = 0; r < t.length; r++) {
                  var i = 0 | t.words[r]
                  ;(e += 977 * i), (t.words[r] = 67108863 & e), (e = 64 * i + ((e / 67108864) | 0))
                }
                return 0 === t.words[t.length - 1] && (t.length--, 0 === t.words[t.length - 1] && t.length--), t
              }),
              n(v, y),
              n(_, y),
              n(w, y),
              (w.prototype.imulK = function (t) {
                for (var e = 0, r = 0; r < t.length; r++) {
                  var i = 19 * (0 | t.words[r]) + e,
                    n = 67108863 & i
                  ;(i >>>= 26), (t.words[r] = n), (e = i)
                }
                return 0 !== e && (t.words[t.length++] = e), t
              }),
              (o._prime = function (t) {
                if (m[t]) return m[t]
                var e
                if ('k256' === t) e = new g()
                else if ('p224' === t) e = new v()
                else if ('p192' === t) e = new _()
                else {
                  if ('p25519' !== t) throw new Error('Unknown prime ' + t)
                  e = new w()
                }
                return (m[t] = e), e
              }),
              (M.prototype._verify1 = function (t) {
                i(0 === t.negative, 'red works only with positives'), i(t.red, 'red works only with red numbers')
              }),
              (M.prototype._verify2 = function (t, e) {
                i(0 == (t.negative | e.negative), 'red works only with positives'),
                  i(t.red && t.red === e.red, 'red works only with red numbers')
              }),
              (M.prototype.imod = function (t) {
                return this.prime ? this.prime.ireduce(t)._forceRed(this) : t.umod(this.m)._forceRed(this)
              }),
              (M.prototype.neg = function (t) {
                return t.isZero() ? t.clone() : this.m.sub(t)._forceRed(this)
              }),
              (M.prototype.add = function (t, e) {
                this._verify2(t, e)
                var r = t.add(e)
                return r.cmp(this.m) >= 0 && r.isub(this.m), r._forceRed(this)
              }),
              (M.prototype.iadd = function (t, e) {
                this._verify2(t, e)
                var r = t.iadd(e)
                return r.cmp(this.m) >= 0 && r.isub(this.m), r
              }),
              (M.prototype.sub = function (t, e) {
                this._verify2(t, e)
                var r = t.sub(e)
                return r.cmpn(0) < 0 && r.iadd(this.m), r._forceRed(this)
              }),
              (M.prototype.isub = function (t, e) {
                this._verify2(t, e)
                var r = t.isub(e)
                return r.cmpn(0) < 0 && r.iadd(this.m), r
              }),
              (M.prototype.shl = function (t, e) {
                return this._verify1(t), this.imod(t.ushln(e))
              }),
              (M.prototype.imul = function (t, e) {
                return this._verify2(t, e), this.imod(t.imul(e))
              }),
              (M.prototype.mul = function (t, e) {
                return this._verify2(t, e), this.imod(t.mul(e))
              }),
              (M.prototype.isqr = function (t) {
                return this.imul(t, t.clone())
              }),
              (M.prototype.sqr = function (t) {
                return this.mul(t, t)
              }),
              (M.prototype.sqrt = function (t) {
                if (t.isZero()) return t.clone()
                var e = this.m.andln(3)
                if ((i(e % 2 == 1), 3 === e)) {
                  var r = this.m.add(new o(1)).iushrn(2)
                  return this.pow(t, r)
                }
                for (var n = this.m.subn(1), a = 0; !n.isZero() && 0 === n.andln(1); ) a++, n.iushrn(1)
                i(!n.isZero())
                var s = new o(1).toRed(this),
                  f = s.redNeg(),
                  h = this.m.subn(1).iushrn(1),
                  c = this.m.bitLength()
                for (c = new o(2 * c * c).toRed(this); 0 !== this.pow(c, h).cmp(f); ) c.redIAdd(f)
                for (
                  var u = this.pow(c, n), d = this.pow(t, n.addn(1).iushrn(1)), l = this.pow(t, n), p = a;
                  0 !== l.cmp(s);

                ) {
                  for (var b = l, m = 0; 0 !== b.cmp(s); m++) b = b.redSqr()
                  i(m < p)
                  var y = this.pow(u, new o(1).iushln(p - m - 1))
                  ;(d = d.redMul(y)), (u = y.redSqr()), (l = l.redMul(u)), (p = m)
                }
                return d
              }),
              (M.prototype.invm = function (t) {
                var e = t._invmp(this.m)
                return 0 !== e.negative ? ((e.negative = 0), this.imod(e).redNeg()) : this.imod(e)
              }),
              (M.prototype.pow = function (t, e) {
                if (e.isZero()) return new o(1).toRed(this)
                if (0 === e.cmpn(1)) return t.clone()
                var r = new Array(16)
                ;(r[0] = new o(1).toRed(this)), (r[1] = t)
                for (var i = 2; i < r.length; i++) r[i] = this.mul(r[i - 1], t)
                var n = r[0],
                  a = 0,
                  s = 0,
                  f = e.bitLength() % 26
                for (0 === f && (f = 26), i = e.length - 1; i >= 0; i--) {
                  for (var h = e.words[i], c = f - 1; c >= 0; c--) {
                    var u = (h >> c) & 1
                    n !== r[0] && (n = this.sqr(n)),
                      0 !== u || 0 !== a
                        ? ((a <<= 1),
                          (a |= u),
                          (4 == ++s || (0 === i && 0 === c)) && ((n = this.mul(n, r[a])), (s = 0), (a = 0)))
                        : (s = 0)
                  }
                  f = 26
                }
                return n
              }),
              (M.prototype.convertTo = function (t) {
                var e = t.umod(this.m)
                return e === t ? e.clone() : e
              }),
              (M.prototype.convertFrom = function (t) {
                var e = t.clone()
                return (e.red = null), e
              }),
              (o.mont = function (t) {
                return new S(t)
              }),
              n(S, M),
              (S.prototype.convertTo = function (t) {
                return this.imod(t.ushln(this.shift))
              }),
              (S.prototype.convertFrom = function (t) {
                var e = this.imod(t.mul(this.rinv))
                return (e.red = null), e
              }),
              (S.prototype.imul = function (t, e) {
                if (t.isZero() || e.isZero()) return (t.words[0] = 0), (t.length = 1), t
                var r = t.imul(e),
                  i = r.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m),
                  n = r.isub(i).iushrn(this.shift),
                  o = n
                return (
                  n.cmp(this.m) >= 0 ? (o = n.isub(this.m)) : n.cmpn(0) < 0 && (o = n.iadd(this.m)), o._forceRed(this)
                )
              }),
              (S.prototype.mul = function (t, e) {
                if (t.isZero() || e.isZero()) return new o(0)._forceRed(this)
                var r = t.mul(e),
                  i = r.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m),
                  n = r.isub(i).iushrn(this.shift),
                  a = n
                return (
                  n.cmp(this.m) >= 0 ? (a = n.isub(this.m)) : n.cmpn(0) < 0 && (a = n.iadd(this.m)), a._forceRed(this)
                )
              }),
              (S.prototype.invm = function (t) {
                return this.imod(t._invmp(this.m).mul(this.r2))._forceRed(this)
              })
          })((t = r.nmd(t)), this)
        },
        7898: function (t, e, r) {
          !(function (t, e) {
            'use strict'
            function i(t, e) {
              if (!t) throw new Error(e || 'Assertion failed')
            }
            function n(t, e) {
              t.super_ = e
              var r = function () {}
              ;(r.prototype = e.prototype), (t.prototype = new r()), (t.prototype.constructor = t)
            }
            function o(t, e, r) {
              if (o.isBN(t)) return t
              ;(this.negative = 0),
                (this.words = null),
                (this.length = 0),
                (this.red = null),
                null !== t &&
                  (('le' !== e && 'be' !== e) || ((r = e), (e = 10)), this._init(t || 0, e || 10, r || 'be'))
            }
            var a
            'object' == typeof t ? (t.exports = o) : (e.BN = o), (o.BN = o), (o.wordSize = 26)
            try {
              a = r(2574).Buffer
            } catch (t) {}
            function s(t, e, r) {
              for (var n = 0, o = Math.min(t.length, r), a = 0, s = e; s < o; s++) {
                var f,
                  h = t.charCodeAt(s) - 48
                ;(n <<= 4), (n |= f = h >= 49 && h <= 54 ? h - 49 + 10 : h >= 17 && h <= 22 ? h - 17 + 10 : h), (a |= f)
              }
              return i(!(240 & a), 'Invalid character in ' + t), n
            }
            function f(t, e, r, n) {
              for (var o = 0, a = 0, s = Math.min(t.length, r), f = e; f < s; f++) {
                var h = t.charCodeAt(f) - 48
                ;(o *= n),
                  (a = h >= 49 ? h - 49 + 10 : h >= 17 ? h - 17 + 10 : h),
                  i(h >= 0 && a < n, 'Invalid character'),
                  (o += a)
              }
              return o
            }
            function h(t, e) {
              ;(t.words = e.words), (t.length = e.length), (t.negative = e.negative), (t.red = e.red)
            }
            if (
              ((o.isBN = function (t) {
                return (
                  t instanceof o ||
                  (null !== t &&
                    'object' == typeof t &&
                    t.constructor.wordSize === o.wordSize &&
                    Array.isArray(t.words))
                )
              }),
              (o.max = function (t, e) {
                return t.cmp(e) > 0 ? t : e
              }),
              (o.min = function (t, e) {
                return t.cmp(e) < 0 ? t : e
              }),
              (o.prototype._init = function (t, e, r) {
                if ('number' == typeof t) return this._initNumber(t, e, r)
                if ('object' == typeof t) return this._initArray(t, e, r)
                'hex' === e && (e = 16), i(e === (0 | e) && e >= 2 && e <= 36)
                var n = 0
                '-' === (t = t.toString().replace(/\s+/g, ''))[0] && n++,
                  16 === e ? this._parseHex(t, n) : this._parseBase(t, e, n),
                  '-' === t[0] && (this.negative = 1),
                  this._strip(),
                  'le' === r && this._initArray(this.toArray(), e, r)
              }),
              (o.prototype._initNumber = function (t, e, r) {
                t < 0 && ((this.negative = 1), (t = -t)),
                  t < 67108864
                    ? ((this.words = [67108863 & t]), (this.length = 1))
                    : t < 4503599627370496
                    ? ((this.words = [67108863 & t, (t / 67108864) & 67108863]), (this.length = 2))
                    : (i(t < 9007199254740992),
                      (this.words = [67108863 & t, (t / 67108864) & 67108863, 1]),
                      (this.length = 3)),
                  'le' === r && this._initArray(this.toArray(), e, r)
              }),
              (o.prototype._initArray = function (t, e, r) {
                if ((i('number' == typeof t.length), t.length <= 0)) return (this.words = [0]), (this.length = 1), this
                ;(this.length = Math.ceil(t.length / 3)), (this.words = new Array(this.length))
                for (var n = 0; n < this.length; n++) this.words[n] = 0
                var o,
                  a,
                  s = 0
                if ('be' === r)
                  for (n = t.length - 1, o = 0; n >= 0; n -= 3)
                    (a = t[n] | (t[n - 1] << 8) | (t[n - 2] << 16)),
                      (this.words[o] |= (a << s) & 67108863),
                      (this.words[o + 1] = (a >>> (26 - s)) & 67108863),
                      (s += 24) >= 26 && ((s -= 26), o++)
                else if ('le' === r)
                  for (n = 0, o = 0; n < t.length; n += 3)
                    (a = t[n] | (t[n + 1] << 8) | (t[n + 2] << 16)),
                      (this.words[o] |= (a << s) & 67108863),
                      (this.words[o + 1] = (a >>> (26 - s)) & 67108863),
                      (s += 24) >= 26 && ((s -= 26), o++)
                return this._strip()
              }),
              (o.prototype._parseHex = function (t, e) {
                ;(this.length = Math.ceil((t.length - e) / 6)), (this.words = new Array(this.length))
                for (var r = 0; r < this.length; r++) this.words[r] = 0
                var i,
                  n,
                  o = 0
                for (r = t.length - 6, i = 0; r >= e; r -= 6)
                  (n = s(t, r, r + 6)),
                    (this.words[i] |= (n << o) & 67108863),
                    (this.words[i + 1] |= (n >>> (26 - o)) & 4194303),
                    (o += 24) >= 26 && ((o -= 26), i++)
                r + 6 !== e &&
                  ((n = s(t, e, r + 6)),
                  (this.words[i] |= (n << o) & 67108863),
                  (this.words[i + 1] |= (n >>> (26 - o)) & 4194303)),
                  this._strip()
              }),
              (o.prototype._parseBase = function (t, e, r) {
                ;(this.words = [0]), (this.length = 1)
                for (var i = 0, n = 1; n <= 67108863; n *= e) i++
                i--, (n = (n / e) | 0)
                for (var o = t.length - r, a = o % i, s = Math.min(o, o - a) + r, h = 0, c = r; c < s; c += i)
                  (h = f(t, c, c + i, e)),
                    this.imuln(n),
                    this.words[0] + h < 67108864 ? (this.words[0] += h) : this._iaddn(h)
                if (0 !== a) {
                  var u = 1
                  for (h = f(t, c, t.length, e), c = 0; c < a; c++) u *= e
                  this.imuln(u), this.words[0] + h < 67108864 ? (this.words[0] += h) : this._iaddn(h)
                }
              }),
              (o.prototype.copy = function (t) {
                t.words = new Array(this.length)
                for (var e = 0; e < this.length; e++) t.words[e] = this.words[e]
                ;(t.length = this.length), (t.negative = this.negative), (t.red = this.red)
              }),
              (o.prototype._move = function (t) {
                h(t, this)
              }),
              (o.prototype.clone = function () {
                var t = new o(null)
                return this.copy(t), t
              }),
              (o.prototype._expand = function (t) {
                for (; this.length < t; ) this.words[this.length++] = 0
                return this
              }),
              (o.prototype._strip = function () {
                for (; this.length > 1 && 0 === this.words[this.length - 1]; ) this.length--
                return this._normSign()
              }),
              (o.prototype._normSign = function () {
                return 1 === this.length && 0 === this.words[0] && (this.negative = 0), this
              }),
              'undefined' != typeof Symbol && 'function' == typeof Symbol.for)
            )
              try {
                o.prototype[Symbol.for('nodejs.util.inspect.custom')] = c
              } catch (t) {
                o.prototype.inspect = c
              }
            else o.prototype.inspect = c
            function c() {
              return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>'
            }
            var u = [
                '',
                '0',
                '00',
                '000',
                '0000',
                '00000',
                '000000',
                '0000000',
                '00000000',
                '000000000',
                '0000000000',
                '00000000000',
                '000000000000',
                '0000000000000',
                '00000000000000',
                '000000000000000',
                '0000000000000000',
                '00000000000000000',
                '000000000000000000',
                '0000000000000000000',
                '00000000000000000000',
                '000000000000000000000',
                '0000000000000000000000',
                '00000000000000000000000',
                '000000000000000000000000',
                '0000000000000000000000000',
              ],
              d = [
                0, 0, 25, 16, 12, 11, 10, 9, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
                5, 5, 5, 5,
              ],
              l = [
                0, 0, 33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216, 43046721, 1e7, 19487171,
                35831808, 62748517, 7529536, 11390625, 16777216, 24137569, 34012224, 47045881, 64e6, 4084101, 5153632,
                6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149, 243e5, 28629151, 33554432, 39135393,
                45435424, 52521875, 60466176,
              ]
            function p(t, e, r) {
              r.negative = e.negative ^ t.negative
              var i = (t.length + e.length) | 0
              ;(r.length = i), (i = (i - 1) | 0)
              var n = 0 | t.words[0],
                o = 0 | e.words[0],
                a = n * o,
                s = 67108863 & a,
                f = (a / 67108864) | 0
              r.words[0] = s
              for (var h = 1; h < i; h++) {
                for (
                  var c = f >>> 26, u = 67108863 & f, d = Math.min(h, e.length - 1), l = Math.max(0, h - t.length + 1);
                  l <= d;
                  l++
                ) {
                  var p = (h - l) | 0
                  ;(c += ((a = (n = 0 | t.words[p]) * (o = 0 | e.words[l]) + u) / 67108864) | 0), (u = 67108863 & a)
                }
                ;(r.words[h] = 0 | u), (f = 0 | c)
              }
              return 0 !== f ? (r.words[h] = 0 | f) : r.length--, r._strip()
            }
            ;(o.prototype.toString = function (t, e) {
              var r
              if (((e = 0 | e || 1), 16 === (t = t || 10) || 'hex' === t)) {
                r = ''
                for (var n = 0, o = 0, a = 0; a < this.length; a++) {
                  var s = this.words[a],
                    f = (16777215 & ((s << n) | o)).toString(16)
                  ;(r =
                    0 != (o = (s >>> (24 - n)) & 16777215) || a !== this.length - 1 ? u[6 - f.length] + f + r : f + r),
                    (n += 2) >= 26 && ((n -= 26), a--)
                }
                for (0 !== o && (r = o.toString(16) + r); r.length % e != 0; ) r = '0' + r
                return 0 !== this.negative && (r = '-' + r), r
              }
              if (t === (0 | t) && t >= 2 && t <= 36) {
                var h = d[t],
                  c = l[t]
                r = ''
                var p = this.clone()
                for (p.negative = 0; !p.isZero(); ) {
                  var b = p.modrn(c).toString(t)
                  r = (p = p.idivn(c)).isZero() ? b + r : u[h - b.length] + b + r
                }
                for (this.isZero() && (r = '0' + r); r.length % e != 0; ) r = '0' + r
                return 0 !== this.negative && (r = '-' + r), r
              }
              i(!1, 'Base should be between 2 and 36')
            }),
              (o.prototype.toNumber = function () {
                var t = this.words[0]
                return (
                  2 === this.length
                    ? (t += 67108864 * this.words[1])
                    : 3 === this.length && 1 === this.words[2]
                    ? (t += 4503599627370496 + 67108864 * this.words[1])
                    : this.length > 2 && i(!1, 'Number can only safely store up to 53 bits'),
                  0 !== this.negative ? -t : t
                )
              }),
              (o.prototype.toJSON = function () {
                return this.toString(16, 2)
              }),
              a &&
                (o.prototype.toBuffer = function (t, e) {
                  return this.toArrayLike(a, t, e)
                }),
              (o.prototype.toArray = function (t, e) {
                return this.toArrayLike(Array, t, e)
              }),
              (o.prototype.toArrayLike = function (t, e, r) {
                this._strip()
                var n = this.byteLength(),
                  o = r || Math.max(1, n)
                i(n <= o, 'byte array longer than desired length'), i(o > 0, 'Requested array length <= 0')
                var a = (function (t, e) {
                  return t.allocUnsafe ? t.allocUnsafe(e) : new t(e)
                })(t, o)
                return this['_toArrayLike' + ('le' === e ? 'LE' : 'BE')](a, n), a
              }),
              (o.prototype._toArrayLikeLE = function (t, e) {
                for (var r = 0, i = 0, n = 0, o = 0; n < this.length; n++) {
                  var a = (this.words[n] << o) | i
                  ;(t[r++] = 255 & a),
                    r < t.length && (t[r++] = (a >> 8) & 255),
                    r < t.length && (t[r++] = (a >> 16) & 255),
                    6 === o
                      ? (r < t.length && (t[r++] = (a >> 24) & 255), (i = 0), (o = 0))
                      : ((i = a >>> 24), (o += 2))
                }
                if (r < t.length) for (t[r++] = i; r < t.length; ) t[r++] = 0
              }),
              (o.prototype._toArrayLikeBE = function (t, e) {
                for (var r = t.length - 1, i = 0, n = 0, o = 0; n < this.length; n++) {
                  var a = (this.words[n] << o) | i
                  ;(t[r--] = 255 & a),
                    r >= 0 && (t[r--] = (a >> 8) & 255),
                    r >= 0 && (t[r--] = (a >> 16) & 255),
                    6 === o ? (r >= 0 && (t[r--] = (a >> 24) & 255), (i = 0), (o = 0)) : ((i = a >>> 24), (o += 2))
                }
                if (r >= 0) for (t[r--] = i; r >= 0; ) t[r--] = 0
              }),
              Math.clz32
                ? (o.prototype._countBits = function (t) {
                    return 32 - Math.clz32(t)
                  })
                : (o.prototype._countBits = function (t) {
                    var e = t,
                      r = 0
                    return (
                      e >= 4096 && ((r += 13), (e >>>= 13)),
                      e >= 64 && ((r += 7), (e >>>= 7)),
                      e >= 8 && ((r += 4), (e >>>= 4)),
                      e >= 2 && ((r += 2), (e >>>= 2)),
                      r + e
                    )
                  }),
              (o.prototype._zeroBits = function (t) {
                if (0 === t) return 26
                var e = t,
                  r = 0
                return (
                  0 == (8191 & e) && ((r += 13), (e >>>= 13)),
                  0 == (127 & e) && ((r += 7), (e >>>= 7)),
                  0 == (15 & e) && ((r += 4), (e >>>= 4)),
                  0 == (3 & e) && ((r += 2), (e >>>= 2)),
                  0 == (1 & e) && r++,
                  r
                )
              }),
              (o.prototype.bitLength = function () {
                var t = this.words[this.length - 1],
                  e = this._countBits(t)
                return 26 * (this.length - 1) + e
              }),
              (o.prototype.zeroBits = function () {
                if (this.isZero()) return 0
                for (var t = 0, e = 0; e < this.length; e++) {
                  var r = this._zeroBits(this.words[e])
                  if (((t += r), 26 !== r)) break
                }
                return t
              }),
              (o.prototype.byteLength = function () {
                return Math.ceil(this.bitLength() / 8)
              }),
              (o.prototype.toTwos = function (t) {
                return 0 !== this.negative ? this.abs().inotn(t).iaddn(1) : this.clone()
              }),
              (o.prototype.fromTwos = function (t) {
                return this.testn(t - 1) ? this.notn(t).iaddn(1).ineg() : this.clone()
              }),
              (o.prototype.isNeg = function () {
                return 0 !== this.negative
              }),
              (o.prototype.neg = function () {
                return this.clone().ineg()
              }),
              (o.prototype.ineg = function () {
                return this.isZero() || (this.negative ^= 1), this
              }),
              (o.prototype.iuor = function (t) {
                for (; this.length < t.length; ) this.words[this.length++] = 0
                for (var e = 0; e < t.length; e++) this.words[e] = this.words[e] | t.words[e]
                return this._strip()
              }),
              (o.prototype.ior = function (t) {
                return i(0 == (this.negative | t.negative)), this.iuor(t)
              }),
              (o.prototype.or = function (t) {
                return this.length > t.length ? this.clone().ior(t) : t.clone().ior(this)
              }),
              (o.prototype.uor = function (t) {
                return this.length > t.length ? this.clone().iuor(t) : t.clone().iuor(this)
              }),
              (o.prototype.iuand = function (t) {
                var e
                e = this.length > t.length ? t : this
                for (var r = 0; r < e.length; r++) this.words[r] = this.words[r] & t.words[r]
                return (this.length = e.length), this._strip()
              }),
              (o.prototype.iand = function (t) {
                return i(0 == (this.negative | t.negative)), this.iuand(t)
              }),
              (o.prototype.and = function (t) {
                return this.length > t.length ? this.clone().iand(t) : t.clone().iand(this)
              }),
              (o.prototype.uand = function (t) {
                return this.length > t.length ? this.clone().iuand(t) : t.clone().iuand(this)
              }),
              (o.prototype.iuxor = function (t) {
                var e, r
                this.length > t.length ? ((e = this), (r = t)) : ((e = t), (r = this))
                for (var i = 0; i < r.length; i++) this.words[i] = e.words[i] ^ r.words[i]
                if (this !== e) for (; i < e.length; i++) this.words[i] = e.words[i]
                return (this.length = e.length), this._strip()
              }),
              (o.prototype.ixor = function (t) {
                return i(0 == (this.negative | t.negative)), this.iuxor(t)
              }),
              (o.prototype.xor = function (t) {
                return this.length > t.length ? this.clone().ixor(t) : t.clone().ixor(this)
              }),
              (o.prototype.uxor = function (t) {
                return this.length > t.length ? this.clone().iuxor(t) : t.clone().iuxor(this)
              }),
              (o.prototype.inotn = function (t) {
                i('number' == typeof t && t >= 0)
                var e = 0 | Math.ceil(t / 26),
                  r = t % 26
                this._expand(e), r > 0 && e--
                for (var n = 0; n < e; n++) this.words[n] = 67108863 & ~this.words[n]
                return r > 0 && (this.words[n] = ~this.words[n] & (67108863 >> (26 - r))), this._strip()
              }),
              (o.prototype.notn = function (t) {
                return this.clone().inotn(t)
              }),
              (o.prototype.setn = function (t, e) {
                i('number' == typeof t && t >= 0)
                var r = (t / 26) | 0,
                  n = t % 26
                return (
                  this._expand(r + 1),
                  (this.words[r] = e ? this.words[r] | (1 << n) : this.words[r] & ~(1 << n)),
                  this._strip()
                )
              }),
              (o.prototype.iadd = function (t) {
                var e, r, i
                if (0 !== this.negative && 0 === t.negative)
                  return (this.negative = 0), (e = this.isub(t)), (this.negative ^= 1), this._normSign()
                if (0 === this.negative && 0 !== t.negative)
                  return (t.negative = 0), (e = this.isub(t)), (t.negative = 1), e._normSign()
                this.length > t.length ? ((r = this), (i = t)) : ((r = t), (i = this))
                for (var n = 0, o = 0; o < i.length; o++)
                  (e = (0 | r.words[o]) + (0 | i.words[o]) + n), (this.words[o] = 67108863 & e), (n = e >>> 26)
                for (; 0 !== n && o < r.length; o++)
                  (e = (0 | r.words[o]) + n), (this.words[o] = 67108863 & e), (n = e >>> 26)
                if (((this.length = r.length), 0 !== n)) (this.words[this.length] = n), this.length++
                else if (r !== this) for (; o < r.length; o++) this.words[o] = r.words[o]
                return this
              }),
              (o.prototype.add = function (t) {
                var e
                return 0 !== t.negative && 0 === this.negative
                  ? ((t.negative = 0), (e = this.sub(t)), (t.negative ^= 1), e)
                  : 0 === t.negative && 0 !== this.negative
                  ? ((this.negative = 0), (e = t.sub(this)), (this.negative = 1), e)
                  : this.length > t.length
                  ? this.clone().iadd(t)
                  : t.clone().iadd(this)
              }),
              (o.prototype.isub = function (t) {
                if (0 !== t.negative) {
                  t.negative = 0
                  var e = this.iadd(t)
                  return (t.negative = 1), e._normSign()
                }
                if (0 !== this.negative) return (this.negative = 0), this.iadd(t), (this.negative = 1), this._normSign()
                var r,
                  i,
                  n = this.cmp(t)
                if (0 === n) return (this.negative = 0), (this.length = 1), (this.words[0] = 0), this
                n > 0 ? ((r = this), (i = t)) : ((r = t), (i = this))
                for (var o = 0, a = 0; a < i.length; a++)
                  (o = (e = (0 | r.words[a]) - (0 | i.words[a]) + o) >> 26), (this.words[a] = 67108863 & e)
                for (; 0 !== o && a < r.length; a++)
                  (o = (e = (0 | r.words[a]) + o) >> 26), (this.words[a] = 67108863 & e)
                if (0 === o && a < r.length && r !== this) for (; a < r.length; a++) this.words[a] = r.words[a]
                return (this.length = Math.max(this.length, a)), r !== this && (this.negative = 1), this._strip()
              }),
              (o.prototype.sub = function (t) {
                return this.clone().isub(t)
              })
            var b = function (t, e, r) {
              var i,
                n,
                o,
                a = t.words,
                s = e.words,
                f = r.words,
                h = 0,
                c = 0 | a[0],
                u = 8191 & c,
                d = c >>> 13,
                l = 0 | a[1],
                p = 8191 & l,
                b = l >>> 13,
                m = 0 | a[2],
                y = 8191 & m,
                g = m >>> 13,
                v = 0 | a[3],
                _ = 8191 & v,
                w = v >>> 13,
                M = 0 | a[4],
                S = 8191 & M,
                E = M >>> 13,
                A = 0 | a[5],
                k = 8191 & A,
                I = A >>> 13,
                B = 0 | a[6],
                R = 8191 & B,
                x = B >>> 13,
                T = 0 | a[7],
                L = 8191 & T,
                C = T >>> 13,
                P = 0 | a[8],
                O = 8191 & P,
                N = P >>> 13,
                U = 0 | a[9],
                D = 8191 & U,
                j = U >>> 13,
                q = 0 | s[0],
                z = 8191 & q,
                K = q >>> 13,
                F = 0 | s[1],
                H = 8191 & F,
                V = F >>> 13,
                W = 0 | s[2],
                Y = 8191 & W,
                G = W >>> 13,
                Z = 0 | s[3],
                X = 8191 & Z,
                $ = Z >>> 13,
                J = 0 | s[4],
                Q = 8191 & J,
                tt = J >>> 13,
                et = 0 | s[5],
                rt = 8191 & et,
                it = et >>> 13,
                nt = 0 | s[6],
                ot = 8191 & nt,
                at = nt >>> 13,
                st = 0 | s[7],
                ft = 8191 & st,
                ht = st >>> 13,
                ct = 0 | s[8],
                ut = 8191 & ct,
                dt = ct >>> 13,
                lt = 0 | s[9],
                pt = 8191 & lt,
                bt = lt >>> 13
              ;(r.negative = t.negative ^ e.negative), (r.length = 19)
              var mt =
                (((h + (i = Math.imul(u, z))) | 0) +
                  ((8191 & (n = ((n = Math.imul(u, K)) + Math.imul(d, z)) | 0)) << 13)) |
                0
              ;(h = ((((o = Math.imul(d, K)) + (n >>> 13)) | 0) + (mt >>> 26)) | 0),
                (mt &= 67108863),
                (i = Math.imul(p, z)),
                (n = ((n = Math.imul(p, K)) + Math.imul(b, z)) | 0),
                (o = Math.imul(b, K))
              var yt =
                (((h + (i = (i + Math.imul(u, H)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, V)) | 0) + Math.imul(d, H)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, V)) | 0) + (n >>> 13)) | 0) + (yt >>> 26)) | 0),
                (yt &= 67108863),
                (i = Math.imul(y, z)),
                (n = ((n = Math.imul(y, K)) + Math.imul(g, z)) | 0),
                (o = Math.imul(g, K)),
                (i = (i + Math.imul(p, H)) | 0),
                (n = ((n = (n + Math.imul(p, V)) | 0) + Math.imul(b, H)) | 0),
                (o = (o + Math.imul(b, V)) | 0)
              var gt =
                (((h + (i = (i + Math.imul(u, Y)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, G)) | 0) + Math.imul(d, Y)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, G)) | 0) + (n >>> 13)) | 0) + (gt >>> 26)) | 0),
                (gt &= 67108863),
                (i = Math.imul(_, z)),
                (n = ((n = Math.imul(_, K)) + Math.imul(w, z)) | 0),
                (o = Math.imul(w, K)),
                (i = (i + Math.imul(y, H)) | 0),
                (n = ((n = (n + Math.imul(y, V)) | 0) + Math.imul(g, H)) | 0),
                (o = (o + Math.imul(g, V)) | 0),
                (i = (i + Math.imul(p, Y)) | 0),
                (n = ((n = (n + Math.imul(p, G)) | 0) + Math.imul(b, Y)) | 0),
                (o = (o + Math.imul(b, G)) | 0)
              var vt =
                (((h + (i = (i + Math.imul(u, X)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, $)) | 0) + Math.imul(d, X)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, $)) | 0) + (n >>> 13)) | 0) + (vt >>> 26)) | 0),
                (vt &= 67108863),
                (i = Math.imul(S, z)),
                (n = ((n = Math.imul(S, K)) + Math.imul(E, z)) | 0),
                (o = Math.imul(E, K)),
                (i = (i + Math.imul(_, H)) | 0),
                (n = ((n = (n + Math.imul(_, V)) | 0) + Math.imul(w, H)) | 0),
                (o = (o + Math.imul(w, V)) | 0),
                (i = (i + Math.imul(y, Y)) | 0),
                (n = ((n = (n + Math.imul(y, G)) | 0) + Math.imul(g, Y)) | 0),
                (o = (o + Math.imul(g, G)) | 0),
                (i = (i + Math.imul(p, X)) | 0),
                (n = ((n = (n + Math.imul(p, $)) | 0) + Math.imul(b, X)) | 0),
                (o = (o + Math.imul(b, $)) | 0)
              var _t =
                (((h + (i = (i + Math.imul(u, Q)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, tt)) | 0) + Math.imul(d, Q)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, tt)) | 0) + (n >>> 13)) | 0) + (_t >>> 26)) | 0),
                (_t &= 67108863),
                (i = Math.imul(k, z)),
                (n = ((n = Math.imul(k, K)) + Math.imul(I, z)) | 0),
                (o = Math.imul(I, K)),
                (i = (i + Math.imul(S, H)) | 0),
                (n = ((n = (n + Math.imul(S, V)) | 0) + Math.imul(E, H)) | 0),
                (o = (o + Math.imul(E, V)) | 0),
                (i = (i + Math.imul(_, Y)) | 0),
                (n = ((n = (n + Math.imul(_, G)) | 0) + Math.imul(w, Y)) | 0),
                (o = (o + Math.imul(w, G)) | 0),
                (i = (i + Math.imul(y, X)) | 0),
                (n = ((n = (n + Math.imul(y, $)) | 0) + Math.imul(g, X)) | 0),
                (o = (o + Math.imul(g, $)) | 0),
                (i = (i + Math.imul(p, Q)) | 0),
                (n = ((n = (n + Math.imul(p, tt)) | 0) + Math.imul(b, Q)) | 0),
                (o = (o + Math.imul(b, tt)) | 0)
              var wt =
                (((h + (i = (i + Math.imul(u, rt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, it)) | 0) + Math.imul(d, rt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, it)) | 0) + (n >>> 13)) | 0) + (wt >>> 26)) | 0),
                (wt &= 67108863),
                (i = Math.imul(R, z)),
                (n = ((n = Math.imul(R, K)) + Math.imul(x, z)) | 0),
                (o = Math.imul(x, K)),
                (i = (i + Math.imul(k, H)) | 0),
                (n = ((n = (n + Math.imul(k, V)) | 0) + Math.imul(I, H)) | 0),
                (o = (o + Math.imul(I, V)) | 0),
                (i = (i + Math.imul(S, Y)) | 0),
                (n = ((n = (n + Math.imul(S, G)) | 0) + Math.imul(E, Y)) | 0),
                (o = (o + Math.imul(E, G)) | 0),
                (i = (i + Math.imul(_, X)) | 0),
                (n = ((n = (n + Math.imul(_, $)) | 0) + Math.imul(w, X)) | 0),
                (o = (o + Math.imul(w, $)) | 0),
                (i = (i + Math.imul(y, Q)) | 0),
                (n = ((n = (n + Math.imul(y, tt)) | 0) + Math.imul(g, Q)) | 0),
                (o = (o + Math.imul(g, tt)) | 0),
                (i = (i + Math.imul(p, rt)) | 0),
                (n = ((n = (n + Math.imul(p, it)) | 0) + Math.imul(b, rt)) | 0),
                (o = (o + Math.imul(b, it)) | 0)
              var Mt =
                (((h + (i = (i + Math.imul(u, ot)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, at)) | 0) + Math.imul(d, ot)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, at)) | 0) + (n >>> 13)) | 0) + (Mt >>> 26)) | 0),
                (Mt &= 67108863),
                (i = Math.imul(L, z)),
                (n = ((n = Math.imul(L, K)) + Math.imul(C, z)) | 0),
                (o = Math.imul(C, K)),
                (i = (i + Math.imul(R, H)) | 0),
                (n = ((n = (n + Math.imul(R, V)) | 0) + Math.imul(x, H)) | 0),
                (o = (o + Math.imul(x, V)) | 0),
                (i = (i + Math.imul(k, Y)) | 0),
                (n = ((n = (n + Math.imul(k, G)) | 0) + Math.imul(I, Y)) | 0),
                (o = (o + Math.imul(I, G)) | 0),
                (i = (i + Math.imul(S, X)) | 0),
                (n = ((n = (n + Math.imul(S, $)) | 0) + Math.imul(E, X)) | 0),
                (o = (o + Math.imul(E, $)) | 0),
                (i = (i + Math.imul(_, Q)) | 0),
                (n = ((n = (n + Math.imul(_, tt)) | 0) + Math.imul(w, Q)) | 0),
                (o = (o + Math.imul(w, tt)) | 0),
                (i = (i + Math.imul(y, rt)) | 0),
                (n = ((n = (n + Math.imul(y, it)) | 0) + Math.imul(g, rt)) | 0),
                (o = (o + Math.imul(g, it)) | 0),
                (i = (i + Math.imul(p, ot)) | 0),
                (n = ((n = (n + Math.imul(p, at)) | 0) + Math.imul(b, ot)) | 0),
                (o = (o + Math.imul(b, at)) | 0)
              var St =
                (((h + (i = (i + Math.imul(u, ft)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, ht)) | 0) + Math.imul(d, ft)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, ht)) | 0) + (n >>> 13)) | 0) + (St >>> 26)) | 0),
                (St &= 67108863),
                (i = Math.imul(O, z)),
                (n = ((n = Math.imul(O, K)) + Math.imul(N, z)) | 0),
                (o = Math.imul(N, K)),
                (i = (i + Math.imul(L, H)) | 0),
                (n = ((n = (n + Math.imul(L, V)) | 0) + Math.imul(C, H)) | 0),
                (o = (o + Math.imul(C, V)) | 0),
                (i = (i + Math.imul(R, Y)) | 0),
                (n = ((n = (n + Math.imul(R, G)) | 0) + Math.imul(x, Y)) | 0),
                (o = (o + Math.imul(x, G)) | 0),
                (i = (i + Math.imul(k, X)) | 0),
                (n = ((n = (n + Math.imul(k, $)) | 0) + Math.imul(I, X)) | 0),
                (o = (o + Math.imul(I, $)) | 0),
                (i = (i + Math.imul(S, Q)) | 0),
                (n = ((n = (n + Math.imul(S, tt)) | 0) + Math.imul(E, Q)) | 0),
                (o = (o + Math.imul(E, tt)) | 0),
                (i = (i + Math.imul(_, rt)) | 0),
                (n = ((n = (n + Math.imul(_, it)) | 0) + Math.imul(w, rt)) | 0),
                (o = (o + Math.imul(w, it)) | 0),
                (i = (i + Math.imul(y, ot)) | 0),
                (n = ((n = (n + Math.imul(y, at)) | 0) + Math.imul(g, ot)) | 0),
                (o = (o + Math.imul(g, at)) | 0),
                (i = (i + Math.imul(p, ft)) | 0),
                (n = ((n = (n + Math.imul(p, ht)) | 0) + Math.imul(b, ft)) | 0),
                (o = (o + Math.imul(b, ht)) | 0)
              var Et =
                (((h + (i = (i + Math.imul(u, ut)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, dt)) | 0) + Math.imul(d, ut)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, dt)) | 0) + (n >>> 13)) | 0) + (Et >>> 26)) | 0),
                (Et &= 67108863),
                (i = Math.imul(D, z)),
                (n = ((n = Math.imul(D, K)) + Math.imul(j, z)) | 0),
                (o = Math.imul(j, K)),
                (i = (i + Math.imul(O, H)) | 0),
                (n = ((n = (n + Math.imul(O, V)) | 0) + Math.imul(N, H)) | 0),
                (o = (o + Math.imul(N, V)) | 0),
                (i = (i + Math.imul(L, Y)) | 0),
                (n = ((n = (n + Math.imul(L, G)) | 0) + Math.imul(C, Y)) | 0),
                (o = (o + Math.imul(C, G)) | 0),
                (i = (i + Math.imul(R, X)) | 0),
                (n = ((n = (n + Math.imul(R, $)) | 0) + Math.imul(x, X)) | 0),
                (o = (o + Math.imul(x, $)) | 0),
                (i = (i + Math.imul(k, Q)) | 0),
                (n = ((n = (n + Math.imul(k, tt)) | 0) + Math.imul(I, Q)) | 0),
                (o = (o + Math.imul(I, tt)) | 0),
                (i = (i + Math.imul(S, rt)) | 0),
                (n = ((n = (n + Math.imul(S, it)) | 0) + Math.imul(E, rt)) | 0),
                (o = (o + Math.imul(E, it)) | 0),
                (i = (i + Math.imul(_, ot)) | 0),
                (n = ((n = (n + Math.imul(_, at)) | 0) + Math.imul(w, ot)) | 0),
                (o = (o + Math.imul(w, at)) | 0),
                (i = (i + Math.imul(y, ft)) | 0),
                (n = ((n = (n + Math.imul(y, ht)) | 0) + Math.imul(g, ft)) | 0),
                (o = (o + Math.imul(g, ht)) | 0),
                (i = (i + Math.imul(p, ut)) | 0),
                (n = ((n = (n + Math.imul(p, dt)) | 0) + Math.imul(b, ut)) | 0),
                (o = (o + Math.imul(b, dt)) | 0)
              var At =
                (((h + (i = (i + Math.imul(u, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(u, bt)) | 0) + Math.imul(d, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(d, bt)) | 0) + (n >>> 13)) | 0) + (At >>> 26)) | 0),
                (At &= 67108863),
                (i = Math.imul(D, H)),
                (n = ((n = Math.imul(D, V)) + Math.imul(j, H)) | 0),
                (o = Math.imul(j, V)),
                (i = (i + Math.imul(O, Y)) | 0),
                (n = ((n = (n + Math.imul(O, G)) | 0) + Math.imul(N, Y)) | 0),
                (o = (o + Math.imul(N, G)) | 0),
                (i = (i + Math.imul(L, X)) | 0),
                (n = ((n = (n + Math.imul(L, $)) | 0) + Math.imul(C, X)) | 0),
                (o = (o + Math.imul(C, $)) | 0),
                (i = (i + Math.imul(R, Q)) | 0),
                (n = ((n = (n + Math.imul(R, tt)) | 0) + Math.imul(x, Q)) | 0),
                (o = (o + Math.imul(x, tt)) | 0),
                (i = (i + Math.imul(k, rt)) | 0),
                (n = ((n = (n + Math.imul(k, it)) | 0) + Math.imul(I, rt)) | 0),
                (o = (o + Math.imul(I, it)) | 0),
                (i = (i + Math.imul(S, ot)) | 0),
                (n = ((n = (n + Math.imul(S, at)) | 0) + Math.imul(E, ot)) | 0),
                (o = (o + Math.imul(E, at)) | 0),
                (i = (i + Math.imul(_, ft)) | 0),
                (n = ((n = (n + Math.imul(_, ht)) | 0) + Math.imul(w, ft)) | 0),
                (o = (o + Math.imul(w, ht)) | 0),
                (i = (i + Math.imul(y, ut)) | 0),
                (n = ((n = (n + Math.imul(y, dt)) | 0) + Math.imul(g, ut)) | 0),
                (o = (o + Math.imul(g, dt)) | 0)
              var kt =
                (((h + (i = (i + Math.imul(p, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(p, bt)) | 0) + Math.imul(b, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(b, bt)) | 0) + (n >>> 13)) | 0) + (kt >>> 26)) | 0),
                (kt &= 67108863),
                (i = Math.imul(D, Y)),
                (n = ((n = Math.imul(D, G)) + Math.imul(j, Y)) | 0),
                (o = Math.imul(j, G)),
                (i = (i + Math.imul(O, X)) | 0),
                (n = ((n = (n + Math.imul(O, $)) | 0) + Math.imul(N, X)) | 0),
                (o = (o + Math.imul(N, $)) | 0),
                (i = (i + Math.imul(L, Q)) | 0),
                (n = ((n = (n + Math.imul(L, tt)) | 0) + Math.imul(C, Q)) | 0),
                (o = (o + Math.imul(C, tt)) | 0),
                (i = (i + Math.imul(R, rt)) | 0),
                (n = ((n = (n + Math.imul(R, it)) | 0) + Math.imul(x, rt)) | 0),
                (o = (o + Math.imul(x, it)) | 0),
                (i = (i + Math.imul(k, ot)) | 0),
                (n = ((n = (n + Math.imul(k, at)) | 0) + Math.imul(I, ot)) | 0),
                (o = (o + Math.imul(I, at)) | 0),
                (i = (i + Math.imul(S, ft)) | 0),
                (n = ((n = (n + Math.imul(S, ht)) | 0) + Math.imul(E, ft)) | 0),
                (o = (o + Math.imul(E, ht)) | 0),
                (i = (i + Math.imul(_, ut)) | 0),
                (n = ((n = (n + Math.imul(_, dt)) | 0) + Math.imul(w, ut)) | 0),
                (o = (o + Math.imul(w, dt)) | 0)
              var It =
                (((h + (i = (i + Math.imul(y, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(y, bt)) | 0) + Math.imul(g, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(g, bt)) | 0) + (n >>> 13)) | 0) + (It >>> 26)) | 0),
                (It &= 67108863),
                (i = Math.imul(D, X)),
                (n = ((n = Math.imul(D, $)) + Math.imul(j, X)) | 0),
                (o = Math.imul(j, $)),
                (i = (i + Math.imul(O, Q)) | 0),
                (n = ((n = (n + Math.imul(O, tt)) | 0) + Math.imul(N, Q)) | 0),
                (o = (o + Math.imul(N, tt)) | 0),
                (i = (i + Math.imul(L, rt)) | 0),
                (n = ((n = (n + Math.imul(L, it)) | 0) + Math.imul(C, rt)) | 0),
                (o = (o + Math.imul(C, it)) | 0),
                (i = (i + Math.imul(R, ot)) | 0),
                (n = ((n = (n + Math.imul(R, at)) | 0) + Math.imul(x, ot)) | 0),
                (o = (o + Math.imul(x, at)) | 0),
                (i = (i + Math.imul(k, ft)) | 0),
                (n = ((n = (n + Math.imul(k, ht)) | 0) + Math.imul(I, ft)) | 0),
                (o = (o + Math.imul(I, ht)) | 0),
                (i = (i + Math.imul(S, ut)) | 0),
                (n = ((n = (n + Math.imul(S, dt)) | 0) + Math.imul(E, ut)) | 0),
                (o = (o + Math.imul(E, dt)) | 0)
              var Bt =
                (((h + (i = (i + Math.imul(_, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(_, bt)) | 0) + Math.imul(w, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(w, bt)) | 0) + (n >>> 13)) | 0) + (Bt >>> 26)) | 0),
                (Bt &= 67108863),
                (i = Math.imul(D, Q)),
                (n = ((n = Math.imul(D, tt)) + Math.imul(j, Q)) | 0),
                (o = Math.imul(j, tt)),
                (i = (i + Math.imul(O, rt)) | 0),
                (n = ((n = (n + Math.imul(O, it)) | 0) + Math.imul(N, rt)) | 0),
                (o = (o + Math.imul(N, it)) | 0),
                (i = (i + Math.imul(L, ot)) | 0),
                (n = ((n = (n + Math.imul(L, at)) | 0) + Math.imul(C, ot)) | 0),
                (o = (o + Math.imul(C, at)) | 0),
                (i = (i + Math.imul(R, ft)) | 0),
                (n = ((n = (n + Math.imul(R, ht)) | 0) + Math.imul(x, ft)) | 0),
                (o = (o + Math.imul(x, ht)) | 0),
                (i = (i + Math.imul(k, ut)) | 0),
                (n = ((n = (n + Math.imul(k, dt)) | 0) + Math.imul(I, ut)) | 0),
                (o = (o + Math.imul(I, dt)) | 0)
              var Rt =
                (((h + (i = (i + Math.imul(S, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(S, bt)) | 0) + Math.imul(E, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(E, bt)) | 0) + (n >>> 13)) | 0) + (Rt >>> 26)) | 0),
                (Rt &= 67108863),
                (i = Math.imul(D, rt)),
                (n = ((n = Math.imul(D, it)) + Math.imul(j, rt)) | 0),
                (o = Math.imul(j, it)),
                (i = (i + Math.imul(O, ot)) | 0),
                (n = ((n = (n + Math.imul(O, at)) | 0) + Math.imul(N, ot)) | 0),
                (o = (o + Math.imul(N, at)) | 0),
                (i = (i + Math.imul(L, ft)) | 0),
                (n = ((n = (n + Math.imul(L, ht)) | 0) + Math.imul(C, ft)) | 0),
                (o = (o + Math.imul(C, ht)) | 0),
                (i = (i + Math.imul(R, ut)) | 0),
                (n = ((n = (n + Math.imul(R, dt)) | 0) + Math.imul(x, ut)) | 0),
                (o = (o + Math.imul(x, dt)) | 0)
              var xt =
                (((h + (i = (i + Math.imul(k, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(k, bt)) | 0) + Math.imul(I, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(I, bt)) | 0) + (n >>> 13)) | 0) + (xt >>> 26)) | 0),
                (xt &= 67108863),
                (i = Math.imul(D, ot)),
                (n = ((n = Math.imul(D, at)) + Math.imul(j, ot)) | 0),
                (o = Math.imul(j, at)),
                (i = (i + Math.imul(O, ft)) | 0),
                (n = ((n = (n + Math.imul(O, ht)) | 0) + Math.imul(N, ft)) | 0),
                (o = (o + Math.imul(N, ht)) | 0),
                (i = (i + Math.imul(L, ut)) | 0),
                (n = ((n = (n + Math.imul(L, dt)) | 0) + Math.imul(C, ut)) | 0),
                (o = (o + Math.imul(C, dt)) | 0)
              var Tt =
                (((h + (i = (i + Math.imul(R, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(R, bt)) | 0) + Math.imul(x, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(x, bt)) | 0) + (n >>> 13)) | 0) + (Tt >>> 26)) | 0),
                (Tt &= 67108863),
                (i = Math.imul(D, ft)),
                (n = ((n = Math.imul(D, ht)) + Math.imul(j, ft)) | 0),
                (o = Math.imul(j, ht)),
                (i = (i + Math.imul(O, ut)) | 0),
                (n = ((n = (n + Math.imul(O, dt)) | 0) + Math.imul(N, ut)) | 0),
                (o = (o + Math.imul(N, dt)) | 0)
              var Lt =
                (((h + (i = (i + Math.imul(L, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(L, bt)) | 0) + Math.imul(C, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(C, bt)) | 0) + (n >>> 13)) | 0) + (Lt >>> 26)) | 0),
                (Lt &= 67108863),
                (i = Math.imul(D, ut)),
                (n = ((n = Math.imul(D, dt)) + Math.imul(j, ut)) | 0),
                (o = Math.imul(j, dt))
              var Ct =
                (((h + (i = (i + Math.imul(O, pt)) | 0)) | 0) +
                  ((8191 & (n = ((n = (n + Math.imul(O, bt)) | 0) + Math.imul(N, pt)) | 0)) << 13)) |
                0
              ;(h = ((((o = (o + Math.imul(N, bt)) | 0) + (n >>> 13)) | 0) + (Ct >>> 26)) | 0), (Ct &= 67108863)
              var Pt =
                (((h + (i = Math.imul(D, pt))) | 0) +
                  ((8191 & (n = ((n = Math.imul(D, bt)) + Math.imul(j, pt)) | 0)) << 13)) |
                0
              return (
                (h = ((((o = Math.imul(j, bt)) + (n >>> 13)) | 0) + (Pt >>> 26)) | 0),
                (Pt &= 67108863),
                (f[0] = mt),
                (f[1] = yt),
                (f[2] = gt),
                (f[3] = vt),
                (f[4] = _t),
                (f[5] = wt),
                (f[6] = Mt),
                (f[7] = St),
                (f[8] = Et),
                (f[9] = At),
                (f[10] = kt),
                (f[11] = It),
                (f[12] = Bt),
                (f[13] = Rt),
                (f[14] = xt),
                (f[15] = Tt),
                (f[16] = Lt),
                (f[17] = Ct),
                (f[18] = Pt),
                0 !== h && ((f[19] = h), r.length++),
                r
              )
            }
            function m(t, e, r) {
              ;(r.negative = e.negative ^ t.negative), (r.length = t.length + e.length)
              for (var i = 0, n = 0, o = 0; o < r.length - 1; o++) {
                var a = n
                n = 0
                for (
                  var s = 67108863 & i, f = Math.min(o, e.length - 1), h = Math.max(0, o - t.length + 1);
                  h <= f;
                  h++
                ) {
                  var c = o - h,
                    u = (0 | t.words[c]) * (0 | e.words[h]),
                    d = 67108863 & u
                  ;(s = 67108863 & (d = (d + s) | 0)),
                    (n += (a = ((a = (a + ((u / 67108864) | 0)) | 0) + (d >>> 26)) | 0) >>> 26),
                    (a &= 67108863)
                }
                ;(r.words[o] = s), (i = a), (a = n)
              }
              return 0 !== i ? (r.words[o] = i) : r.length--, r._strip()
            }
            function y(t, e, r) {
              return m(t, e, r)
            }
            function g(t, e) {
              ;(this.x = t), (this.y = e)
            }
            Math.imul || (b = p),
              (o.prototype.mulTo = function (t, e) {
                var r = this.length + t.length
                return 10 === this.length && 10 === t.length
                  ? b(this, t, e)
                  : r < 63
                  ? p(this, t, e)
                  : r < 1024
                  ? m(this, t, e)
                  : y(this, t, e)
              }),
              (g.prototype.makeRBT = function (t) {
                for (var e = new Array(t), r = o.prototype._countBits(t) - 1, i = 0; i < t; i++)
                  e[i] = this.revBin(i, r, t)
                return e
              }),
              (g.prototype.revBin = function (t, e, r) {
                if (0 === t || t === r - 1) return t
                for (var i = 0, n = 0; n < e; n++) (i |= (1 & t) << (e - n - 1)), (t >>= 1)
                return i
              }),
              (g.prototype.permute = function (t, e, r, i, n, o) {
                for (var a = 0; a < o; a++) (i[a] = e[t[a]]), (n[a] = r[t[a]])
              }),
              (g.prototype.transform = function (t, e, r, i, n, o) {
                this.permute(o, t, e, r, i, n)
                for (var a = 1; a < n; a <<= 1)
                  for (
                    var s = a << 1, f = Math.cos((2 * Math.PI) / s), h = Math.sin((2 * Math.PI) / s), c = 0;
                    c < n;
                    c += s
                  )
                    for (var u = f, d = h, l = 0; l < a; l++) {
                      var p = r[c + l],
                        b = i[c + l],
                        m = r[c + l + a],
                        y = i[c + l + a],
                        g = u * m - d * y
                      ;(y = u * y + d * m),
                        (m = g),
                        (r[c + l] = p + m),
                        (i[c + l] = b + y),
                        (r[c + l + a] = p - m),
                        (i[c + l + a] = b - y),
                        l !== s && ((g = f * u - h * d), (d = f * d + h * u), (u = g))
                    }
              }),
              (g.prototype.guessLen13b = function (t, e) {
                var r = 1 | Math.max(e, t),
                  i = 1 & r,
                  n = 0
                for (r = (r / 2) | 0; r; r >>>= 1) n++
                return 1 << (n + 1 + i)
              }),
              (g.prototype.conjugate = function (t, e, r) {
                if (!(r <= 1))
                  for (var i = 0; i < r / 2; i++) {
                    var n = t[i]
                    ;(t[i] = t[r - i - 1]), (t[r - i - 1] = n), (n = e[i]), (e[i] = -e[r - i - 1]), (e[r - i - 1] = -n)
                  }
              }),
              (g.prototype.normalize13b = function (t, e) {
                for (var r = 0, i = 0; i < e / 2; i++) {
                  var n = 8192 * Math.round(t[2 * i + 1] / e) + Math.round(t[2 * i] / e) + r
                  ;(t[i] = 67108863 & n), (r = n < 67108864 ? 0 : (n / 67108864) | 0)
                }
                return t
              }),
              (g.prototype.convert13b = function (t, e, r, n) {
                for (var o = 0, a = 0; a < e; a++)
                  (o += 0 | t[a]), (r[2 * a] = 8191 & o), (o >>>= 13), (r[2 * a + 1] = 8191 & o), (o >>>= 13)
                for (a = 2 * e; a < n; ++a) r[a] = 0
                i(0 === o), i(0 == (-8192 & o))
              }),
              (g.prototype.stub = function (t) {
                for (var e = new Array(t), r = 0; r < t; r++) e[r] = 0
                return e
              }),
              (g.prototype.mulp = function (t, e, r) {
                var i = 2 * this.guessLen13b(t.length, e.length),
                  n = this.makeRBT(i),
                  o = this.stub(i),
                  a = new Array(i),
                  s = new Array(i),
                  f = new Array(i),
                  h = new Array(i),
                  c = new Array(i),
                  u = new Array(i),
                  d = r.words
                ;(d.length = i),
                  this.convert13b(t.words, t.length, a, i),
                  this.convert13b(e.words, e.length, h, i),
                  this.transform(a, o, s, f, i, n),
                  this.transform(h, o, c, u, i, n)
                for (var l = 0; l < i; l++) {
                  var p = s[l] * c[l] - f[l] * u[l]
                  ;(f[l] = s[l] * u[l] + f[l] * c[l]), (s[l] = p)
                }
                return (
                  this.conjugate(s, f, i),
                  this.transform(s, f, d, o, i, n),
                  this.conjugate(d, o, i),
                  this.normalize13b(d, i),
                  (r.negative = t.negative ^ e.negative),
                  (r.length = t.length + e.length),
                  r._strip()
                )
              }),
              (o.prototype.mul = function (t) {
                var e = new o(null)
                return (e.words = new Array(this.length + t.length)), this.mulTo(t, e)
              }),
              (o.prototype.mulf = function (t) {
                var e = new o(null)
                return (e.words = new Array(this.length + t.length)), y(this, t, e)
              }),
              (o.prototype.imul = function (t) {
                return this.clone().mulTo(t, this)
              }),
              (o.prototype.imuln = function (t) {
                var e = t < 0
                e && (t = -t), i('number' == typeof t), i(t < 67108864)
                for (var r = 0, n = 0; n < this.length; n++) {
                  var o = (0 | this.words[n]) * t,
                    a = (67108863 & o) + (67108863 & r)
                  ;(r >>= 26), (r += (o / 67108864) | 0), (r += a >>> 26), (this.words[n] = 67108863 & a)
                }
                return 0 !== r && ((this.words[n] = r), this.length++), e ? this.ineg() : this
              }),
              (o.prototype.muln = function (t) {
                return this.clone().imuln(t)
              }),
              (o.prototype.sqr = function () {
                return this.mul(this)
              }),
              (o.prototype.isqr = function () {
                return this.imul(this.clone())
              }),
              (o.prototype.pow = function (t) {
                var e = (function (t) {
                  for (var e = new Array(t.bitLength()), r = 0; r < e.length; r++) {
                    var i = (r / 26) | 0,
                      n = r % 26
                    e[r] = (t.words[i] >>> n) & 1
                  }
                  return e
                })(t)
                if (0 === e.length) return new o(1)
                for (var r = this, i = 0; i < e.length && 0 === e[i]; i++, r = r.sqr());
                if (++i < e.length) for (var n = r.sqr(); i < e.length; i++, n = n.sqr()) 0 !== e[i] && (r = r.mul(n))
                return r
              }),
              (o.prototype.iushln = function (t) {
                i('number' == typeof t && t >= 0)
                var e,
                  r = t % 26,
                  n = (t - r) / 26,
                  o = (67108863 >>> (26 - r)) << (26 - r)
                if (0 !== r) {
                  var a = 0
                  for (e = 0; e < this.length; e++) {
                    var s = this.words[e] & o,
                      f = ((0 | this.words[e]) - s) << r
                    ;(this.words[e] = f | a), (a = s >>> (26 - r))
                  }
                  a && ((this.words[e] = a), this.length++)
                }
                if (0 !== n) {
                  for (e = this.length - 1; e >= 0; e--) this.words[e + n] = this.words[e]
                  for (e = 0; e < n; e++) this.words[e] = 0
                  this.length += n
                }
                return this._strip()
              }),
              (o.prototype.ishln = function (t) {
                return i(0 === this.negative), this.iushln(t)
              }),
              (o.prototype.iushrn = function (t, e, r) {
                var n
                i('number' == typeof t && t >= 0), (n = e ? (e - (e % 26)) / 26 : 0)
                var o = t % 26,
                  a = Math.min((t - o) / 26, this.length),
                  s = 67108863 ^ ((67108863 >>> o) << o),
                  f = r
                if (((n -= a), (n = Math.max(0, n)), f)) {
                  for (var h = 0; h < a; h++) f.words[h] = this.words[h]
                  f.length = a
                }
                if (0 === a);
                else if (this.length > a)
                  for (this.length -= a, h = 0; h < this.length; h++) this.words[h] = this.words[h + a]
                else (this.words[0] = 0), (this.length = 1)
                var c = 0
                for (h = this.length - 1; h >= 0 && (0 !== c || h >= n); h--) {
                  var u = 0 | this.words[h]
                  ;(this.words[h] = (c << (26 - o)) | (u >>> o)), (c = u & s)
                }
                return (
                  f && 0 !== c && (f.words[f.length++] = c),
                  0 === this.length && ((this.words[0] = 0), (this.length = 1)),
                  this._strip()
                )
              }),
              (o.prototype.ishrn = function (t, e, r) {
                return i(0 === this.negative), this.iushrn(t, e, r)
              }),
              (o.prototype.shln = function (t) {
                return this.clone().ishln(t)
              }),
              (o.prototype.ushln = function (t) {
                return this.clone().iushln(t)
              }),
              (o.prototype.shrn = function (t) {
                return this.clone().ishrn(t)
              }),
              (o.prototype.ushrn = function (t) {
                return this.clone().iushrn(t)
              }),
              (o.prototype.testn = function (t) {
                i('number' == typeof t && t >= 0)
                var e = t % 26,
                  r = (t - e) / 26,
                  n = 1 << e
                return !(this.length <= r || !(this.words[r] & n))
              }),
              (o.prototype.imaskn = function (t) {
                i('number' == typeof t && t >= 0)
                var e = t % 26,
                  r = (t - e) / 26
                if ((i(0 === this.negative, 'imaskn works only with positive numbers'), this.length <= r)) return this
                if ((0 !== e && r++, (this.length = Math.min(r, this.length)), 0 !== e)) {
                  var n = 67108863 ^ ((67108863 >>> e) << e)
                  this.words[this.length - 1] &= n
                }
                return this._strip()
              }),
              (o.prototype.maskn = function (t) {
                return this.clone().imaskn(t)
              }),
              (o.prototype.iaddn = function (t) {
                return (
                  i('number' == typeof t),
                  i(t < 67108864),
                  t < 0
                    ? this.isubn(-t)
                    : 0 !== this.negative
                    ? 1 === this.length && (0 | this.words[0]) <= t
                      ? ((this.words[0] = t - (0 | this.words[0])), (this.negative = 0), this)
                      : ((this.negative = 0), this.isubn(t), (this.negative = 1), this)
                    : this._iaddn(t)
                )
              }),
              (o.prototype._iaddn = function (t) {
                this.words[0] += t
                for (var e = 0; e < this.length && this.words[e] >= 67108864; e++)
                  (this.words[e] -= 67108864), e === this.length - 1 ? (this.words[e + 1] = 1) : this.words[e + 1]++
                return (this.length = Math.max(this.length, e + 1)), this
              }),
              (o.prototype.isubn = function (t) {
                if ((i('number' == typeof t), i(t < 67108864), t < 0)) return this.iaddn(-t)
                if (0 !== this.negative) return (this.negative = 0), this.iaddn(t), (this.negative = 1), this
                if (((this.words[0] -= t), 1 === this.length && this.words[0] < 0))
                  (this.words[0] = -this.words[0]), (this.negative = 1)
                else
                  for (var e = 0; e < this.length && this.words[e] < 0; e++)
                    (this.words[e] += 67108864), (this.words[e + 1] -= 1)
                return this._strip()
              }),
              (o.prototype.addn = function (t) {
                return this.clone().iaddn(t)
              }),
              (o.prototype.subn = function (t) {
                return this.clone().isubn(t)
              }),
              (o.prototype.iabs = function () {
                return (this.negative = 0), this
              }),
              (o.prototype.abs = function () {
                return this.clone().iabs()
              }),
              (o.prototype._ishlnsubmul = function (t, e, r) {
                var n,
                  o,
                  a = t.length + r
                this._expand(a)
                var s = 0
                for (n = 0; n < t.length; n++) {
                  o = (0 | this.words[n + r]) + s
                  var f = (0 | t.words[n]) * e
                  ;(s = ((o -= 67108863 & f) >> 26) - ((f / 67108864) | 0)), (this.words[n + r] = 67108863 & o)
                }
                for (; n < this.length - r; n++)
                  (s = (o = (0 | this.words[n + r]) + s) >> 26), (this.words[n + r] = 67108863 & o)
                if (0 === s) return this._strip()
                for (i(-1 === s), s = 0, n = 0; n < this.length; n++)
                  (s = (o = -(0 | this.words[n]) + s) >> 26), (this.words[n] = 67108863 & o)
                return (this.negative = 1), this._strip()
              }),
              (o.prototype._wordDiv = function (t, e) {
                var r = (this.length, t.length),
                  i = this.clone(),
                  n = t,
                  a = 0 | n.words[n.length - 1]
                0 != (r = 26 - this._countBits(a)) && ((n = n.ushln(r)), i.iushln(r), (a = 0 | n.words[n.length - 1]))
                var s,
                  f = i.length - n.length
                if ('mod' !== e) {
                  ;((s = new o(null)).length = f + 1), (s.words = new Array(s.length))
                  for (var h = 0; h < s.length; h++) s.words[h] = 0
                }
                var c = i.clone()._ishlnsubmul(n, 1, f)
                0 === c.negative && ((i = c), s && (s.words[f] = 1))
                for (var u = f - 1; u >= 0; u--) {
                  var d = 67108864 * (0 | i.words[n.length + u]) + (0 | i.words[n.length + u - 1])
                  for (d = Math.min((d / a) | 0, 67108863), i._ishlnsubmul(n, d, u); 0 !== i.negative; )
                    d--, (i.negative = 0), i._ishlnsubmul(n, 1, u), i.isZero() || (i.negative ^= 1)
                  s && (s.words[u] = d)
                }
                return s && s._strip(), i._strip(), 'div' !== e && 0 !== r && i.iushrn(r), { div: s || null, mod: i }
              }),
              (o.prototype.divmod = function (t, e, r) {
                return (
                  i(!t.isZero()),
                  this.isZero()
                    ? { div: new o(0), mod: new o(0) }
                    : 0 !== this.negative && 0 === t.negative
                    ? ((s = this.neg().divmod(t, e)),
                      'mod' !== e && (n = s.div.neg()),
                      'div' !== e && ((a = s.mod.neg()), r && 0 !== a.negative && a.iadd(t)),
                      { div: n, mod: a })
                    : 0 === this.negative && 0 !== t.negative
                    ? ((s = this.divmod(t.neg(), e)), 'mod' !== e && (n = s.div.neg()), { div: n, mod: s.mod })
                    : 0 != (this.negative & t.negative)
                    ? ((s = this.neg().divmod(t.neg(), e)),
                      'div' !== e && ((a = s.mod.neg()), r && 0 !== a.negative && a.isub(t)),
                      { div: s.div, mod: a })
                    : t.length > this.length || this.cmp(t) < 0
                    ? { div: new o(0), mod: this }
                    : 1 === t.length
                    ? 'div' === e
                      ? { div: this.divn(t.words[0]), mod: null }
                      : 'mod' === e
                      ? { div: null, mod: new o(this.modrn(t.words[0])) }
                      : { div: this.divn(t.words[0]), mod: new o(this.modrn(t.words[0])) }
                    : this._wordDiv(t, e)
                )
                var n, a, s
              }),
              (o.prototype.div = function (t) {
                return this.divmod(t, 'div', !1).div
              }),
              (o.prototype.mod = function (t) {
                return this.divmod(t, 'mod', !1).mod
              }),
              (o.prototype.umod = function (t) {
                return this.divmod(t, 'mod', !0).mod
              }),
              (o.prototype.divRound = function (t) {
                var e = this.divmod(t)
                if (e.mod.isZero()) return e.div
                var r = 0 !== e.div.negative ? e.mod.isub(t) : e.mod,
                  i = t.ushrn(1),
                  n = t.andln(1),
                  o = r.cmp(i)
                return o < 0 || (1 === n && 0 === o) ? e.div : 0 !== e.div.negative ? e.div.isubn(1) : e.div.iaddn(1)
              }),
              (o.prototype.modrn = function (t) {
                var e = t < 0
                e && (t = -t), i(t <= 67108863)
                for (var r = (1 << 26) % t, n = 0, o = this.length - 1; o >= 0; o--)
                  n = (r * n + (0 | this.words[o])) % t
                return e ? -n : n
              }),
              (o.prototype.modn = function (t) {
                return this.modrn(t)
              }),
              (o.prototype.idivn = function (t) {
                var e = t < 0
                e && (t = -t), i(t <= 67108863)
                for (var r = 0, n = this.length - 1; n >= 0; n--) {
                  var o = (0 | this.words[n]) + 67108864 * r
                  ;(this.words[n] = (o / t) | 0), (r = o % t)
                }
                return this._strip(), e ? this.ineg() : this
              }),
              (o.prototype.divn = function (t) {
                return this.clone().idivn(t)
              }),
              (o.prototype.egcd = function (t) {
                i(0 === t.negative), i(!t.isZero())
                var e = this,
                  r = t.clone()
                e = 0 !== e.negative ? e.umod(t) : e.clone()
                for (var n = new o(1), a = new o(0), s = new o(0), f = new o(1), h = 0; e.isEven() && r.isEven(); )
                  e.iushrn(1), r.iushrn(1), ++h
                for (var c = r.clone(), u = e.clone(); !e.isZero(); ) {
                  for (var d = 0, l = 1; 0 == (e.words[0] & l) && d < 26; ++d, l <<= 1);
                  if (d > 0)
                    for (e.iushrn(d); d-- > 0; )
                      (n.isOdd() || a.isOdd()) && (n.iadd(c), a.isub(u)), n.iushrn(1), a.iushrn(1)
                  for (var p = 0, b = 1; 0 == (r.words[0] & b) && p < 26; ++p, b <<= 1);
                  if (p > 0)
                    for (r.iushrn(p); p-- > 0; )
                      (s.isOdd() || f.isOdd()) && (s.iadd(c), f.isub(u)), s.iushrn(1), f.iushrn(1)
                  e.cmp(r) >= 0 ? (e.isub(r), n.isub(s), a.isub(f)) : (r.isub(e), s.isub(n), f.isub(a))
                }
                return { a: s, b: f, gcd: r.iushln(h) }
              }),
              (o.prototype._invmp = function (t) {
                i(0 === t.negative), i(!t.isZero())
                var e = this,
                  r = t.clone()
                e = 0 !== e.negative ? e.umod(t) : e.clone()
                for (var n, a = new o(1), s = new o(0), f = r.clone(); e.cmpn(1) > 0 && r.cmpn(1) > 0; ) {
                  for (var h = 0, c = 1; 0 == (e.words[0] & c) && h < 26; ++h, c <<= 1);
                  if (h > 0) for (e.iushrn(h); h-- > 0; ) a.isOdd() && a.iadd(f), a.iushrn(1)
                  for (var u = 0, d = 1; 0 == (r.words[0] & d) && u < 26; ++u, d <<= 1);
                  if (u > 0) for (r.iushrn(u); u-- > 0; ) s.isOdd() && s.iadd(f), s.iushrn(1)
                  e.cmp(r) >= 0 ? (e.isub(r), a.isub(s)) : (r.isub(e), s.isub(a))
                }
                return (n = 0 === e.cmpn(1) ? a : s).cmpn(0) < 0 && n.iadd(t), n
              }),
              (o.prototype.gcd = function (t) {
                if (this.isZero()) return t.abs()
                if (t.isZero()) return this.abs()
                var e = this.clone(),
                  r = t.clone()
                ;(e.negative = 0), (r.negative = 0)
                for (var i = 0; e.isEven() && r.isEven(); i++) e.iushrn(1), r.iushrn(1)
                for (;;) {
                  for (; e.isEven(); ) e.iushrn(1)
                  for (; r.isEven(); ) r.iushrn(1)
                  var n = e.cmp(r)
                  if (n < 0) {
                    var o = e
                    ;(e = r), (r = o)
                  } else if (0 === n || 0 === r.cmpn(1)) break
                  e.isub(r)
                }
                return r.iushln(i)
              }),
              (o.prototype.invm = function (t) {
                return this.egcd(t).a.umod(t)
              }),
              (o.prototype.isEven = function () {
                return 0 == (1 & this.words[0])
              }),
              (o.prototype.isOdd = function () {
                return 1 == (1 & this.words[0])
              }),
              (o.prototype.andln = function (t) {
                return this.words[0] & t
              }),
              (o.prototype.bincn = function (t) {
                i('number' == typeof t)
                var e = t % 26,
                  r = (t - e) / 26,
                  n = 1 << e
                if (this.length <= r) return this._expand(r + 1), (this.words[r] |= n), this
                for (var o = n, a = r; 0 !== o && a < this.length; a++) {
                  var s = 0 | this.words[a]
                  ;(o = (s += o) >>> 26), (s &= 67108863), (this.words[a] = s)
                }
                return 0 !== o && ((this.words[a] = o), this.length++), this
              }),
              (o.prototype.isZero = function () {
                return 1 === this.length && 0 === this.words[0]
              }),
              (o.prototype.cmpn = function (t) {
                var e,
                  r = t < 0
                if (0 !== this.negative && !r) return -1
                if (0 === this.negative && r) return 1
                if ((this._strip(), this.length > 1)) e = 1
                else {
                  r && (t = -t), i(t <= 67108863, 'Number is too big')
                  var n = 0 | this.words[0]
                  e = n === t ? 0 : n < t ? -1 : 1
                }
                return 0 !== this.negative ? 0 | -e : e
              }),
              (o.prototype.cmp = function (t) {
                if (0 !== this.negative && 0 === t.negative) return -1
                if (0 === this.negative && 0 !== t.negative) return 1
                var e = this.ucmp(t)
                return 0 !== this.negative ? 0 | -e : e
              }),
              (o.prototype.ucmp = function (t) {
                if (this.length > t.length) return 1
                if (this.length < t.length) return -1
                for (var e = 0, r = this.length - 1; r >= 0; r--) {
                  var i = 0 | this.words[r],
                    n = 0 | t.words[r]
                  if (i !== n) {
                    i < n ? (e = -1) : i > n && (e = 1)
                    break
                  }
                }
                return e
              }),
              (o.prototype.gtn = function (t) {
                return 1 === this.cmpn(t)
              }),
              (o.prototype.gt = function (t) {
                return 1 === this.cmp(t)
              }),
              (o.prototype.gten = function (t) {
                return this.cmpn(t) >= 0
              }),
              (o.prototype.gte = function (t) {
                return this.cmp(t) >= 0
              }),
              (o.prototype.ltn = function (t) {
                return -1 === this.cmpn(t)
              }),
              (o.prototype.lt = function (t) {
                return -1 === this.cmp(t)
              }),
              (o.prototype.lten = function (t) {
                return this.cmpn(t) <= 0
              }),
              (o.prototype.lte = function (t) {
                return this.cmp(t) <= 0
              }),
              (o.prototype.eqn = function (t) {
                return 0 === this.cmpn(t)
              }),
              (o.prototype.eq = function (t) {
                return 0 === this.cmp(t)
              }),
              (o.red = function (t) {
                return new A(t)
              }),
              (o.prototype.toRed = function (t) {
                return (
                  i(!this.red, 'Already a number in reduction context'),
                  i(0 === this.negative, 'red works only with positives'),
                  t.convertTo(this)._forceRed(t)
                )
              }),
              (o.prototype.fromRed = function () {
                return i(this.red, 'fromRed works only with numbers in reduction context'), this.red.convertFrom(this)
              }),
              (o.prototype._forceRed = function (t) {
                return (this.red = t), this
              }),
              (o.prototype.forceRed = function (t) {
                return i(!this.red, 'Already a number in reduction context'), this._forceRed(t)
              }),
              (o.prototype.redAdd = function (t) {
                return i(this.red, 'redAdd works only with red numbers'), this.red.add(this, t)
              }),
              (o.prototype.redIAdd = function (t) {
                return i(this.red, 'redIAdd works only with red numbers'), this.red.iadd(this, t)
              }),
              (o.prototype.redSub = function (t) {
                return i(this.red, 'redSub works only with red numbers'), this.red.sub(this, t)
              }),
              (o.prototype.redISub = function (t) {
                return i(this.red, 'redISub works only with red numbers'), this.red.isub(this, t)
              }),
              (o.prototype.redShl = function (t) {
                return i(this.red, 'redShl works only with red numbers'), this.red.shl(this, t)
              }),
              (o.prototype.redMul = function (t) {
                return (
                  i(this.red, 'redMul works only with red numbers'), this.red._verify2(this, t), this.red.mul(this, t)
                )
              }),
              (o.prototype.redIMul = function (t) {
                return (
                  i(this.red, 'redMul works only with red numbers'), this.red._verify2(this, t), this.red.imul(this, t)
                )
              }),
              (o.prototype.redSqr = function () {
                return i(this.red, 'redSqr works only with red numbers'), this.red._verify1(this), this.red.sqr(this)
              }),
              (o.prototype.redISqr = function () {
                return i(this.red, 'redISqr works only with red numbers'), this.red._verify1(this), this.red.isqr(this)
              }),
              (o.prototype.redSqrt = function () {
                return i(this.red, 'redSqrt works only with red numbers'), this.red._verify1(this), this.red.sqrt(this)
              }),
              (o.prototype.redInvm = function () {
                return i(this.red, 'redInvm works only with red numbers'), this.red._verify1(this), this.red.invm(this)
              }),
              (o.prototype.redNeg = function () {
                return i(this.red, 'redNeg works only with red numbers'), this.red._verify1(this), this.red.neg(this)
              }),
              (o.prototype.redPow = function (t) {
                return i(this.red && !t.red, 'redPow(normalNum)'), this.red._verify1(this), this.red.pow(this, t)
              })
            var v = { k256: null, p224: null, p192: null, p25519: null }
            function _(t, e) {
              ;(this.name = t),
                (this.p = new o(e, 16)),
                (this.n = this.p.bitLength()),
                (this.k = new o(1).iushln(this.n).isub(this.p)),
                (this.tmp = this._tmp())
            }
            function w() {
              _.call(this, 'k256', 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f')
            }
            function M() {
              _.call(this, 'p224', 'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001')
            }
            function S() {
              _.call(this, 'p192', 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff')
            }
            function E() {
              _.call(this, '25519', '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed')
            }
            function A(t) {
              if ('string' == typeof t) {
                var e = o._prime(t)
                ;(this.m = e.p), (this.prime = e)
              } else i(t.gtn(1), 'modulus must be greater than 1'), (this.m = t), (this.prime = null)
            }
            function k(t) {
              A.call(this, t),
                (this.shift = this.m.bitLength()),
                this.shift % 26 != 0 && (this.shift += 26 - (this.shift % 26)),
                (this.r = new o(1).iushln(this.shift)),
                (this.r2 = this.imod(this.r.sqr())),
                (this.rinv = this.r._invmp(this.m)),
                (this.minv = this.rinv.mul(this.r).isubn(1).div(this.m)),
                (this.minv = this.minv.umod(this.r)),
                (this.minv = this.r.sub(this.minv))
            }
            ;(_.prototype._tmp = function () {
              var t = new o(null)
              return (t.words = new Array(Math.ceil(this.n / 13))), t
            }),
              (_.prototype.ireduce = function (t) {
                var e,
                  r = t
                do {
                  this.split(r, this.tmp), (e = (r = (r = this.imulK(r)).iadd(this.tmp)).bitLength())
                } while (e > this.n)
                var i = e < this.n ? -1 : r.ucmp(this.p)
                return (
                  0 === i
                    ? ((r.words[0] = 0), (r.length = 1))
                    : i > 0
                    ? r.isub(this.p)
                    : void 0 !== r.strip
                    ? r.strip()
                    : r._strip(),
                  r
                )
              }),
              (_.prototype.split = function (t, e) {
                t.iushrn(this.n, 0, e)
              }),
              (_.prototype.imulK = function (t) {
                return t.imul(this.k)
              }),
              n(w, _),
              (w.prototype.split = function (t, e) {
                for (var r = 4194303, i = Math.min(t.length, 9), n = 0; n < i; n++) e.words[n] = t.words[n]
                if (((e.length = i), t.length <= 9)) return (t.words[0] = 0), void (t.length = 1)
                var o = t.words[9]
                for (e.words[e.length++] = o & r, n = 10; n < t.length; n++) {
                  var a = 0 | t.words[n]
                  ;(t.words[n - 10] = ((a & r) << 4) | (o >>> 22)), (o = a)
                }
                ;(o >>>= 22), (t.words[n - 10] = o), 0 === o && t.length > 10 ? (t.length -= 10) : (t.length -= 9)
              }),
              (w.prototype.imulK = function (t) {
                ;(t.words[t.length] = 0), (t.words[t.length + 1] = 0), (t.length += 2)
                for (var e = 0, r = 0; r < t.length; r++) {
                  var i = 0 | t.words[r]
                  ;(e += 977 * i), (t.words[r] = 67108863 & e), (e = 64 * i + ((e / 67108864) | 0))
                }
                return 0 === t.words[t.length - 1] && (t.length--, 0 === t.words[t.length - 1] && t.length--), t
              }),
              n(M, _),
              n(S, _),
              n(E, _),
              (E.prototype.imulK = function (t) {
                for (var e = 0, r = 0; r < t.length; r++) {
                  var i = 19 * (0 | t.words[r]) + e,
                    n = 67108863 & i
                  ;(i >>>= 26), (t.words[r] = n), (e = i)
                }
                return 0 !== e && (t.words[t.length++] = e), t
              }),
              (o._prime = function (t) {
                if (v[t]) return v[t]
                var e
                if ('k256' === t) e = new w()
                else if ('p224' === t) e = new M()
                else if ('p192' === t) e = new S()
                else {
                  if ('p25519' !== t) throw new Error('Unknown prime ' + t)
                  e = new E()
                }
                return (v[t] = e), e
              }),
              (A.prototype._verify1 = function (t) {
                i(0 === t.negative, 'red works only with positives'), i(t.red, 'red works only with red numbers')
              }),
              (A.prototype._verify2 = function (t, e) {
                i(0 == (t.negative | e.negative), 'red works only with positives'),
                  i(t.red && t.red === e.red, 'red works only with red numbers')
              }),
              (A.prototype.imod = function (t) {
                return this.prime ? this.prime.ireduce(t)._forceRed(this) : (h(t, t.umod(this.m)._forceRed(this)), t)
              }),
              (A.prototype.neg = function (t) {
                return t.isZero() ? t.clone() : this.m.sub(t)._forceRed(this)
              }),
              (A.prototype.add = function (t, e) {
                this._verify2(t, e)
                var r = t.add(e)
                return r.cmp(this.m) >= 0 && r.isub(this.m), r._forceRed(this)
              }),
              (A.prototype.iadd = function (t, e) {
                this._verify2(t, e)
                var r = t.iadd(e)
                return r.cmp(this.m) >= 0 && r.isub(this.m), r
              }),
              (A.prototype.sub = function (t, e) {
                this._verify2(t, e)
                var r = t.sub(e)
                return r.cmpn(0) < 0 && r.iadd(this.m), r._forceRed(this)
              }),
              (A.prototype.isub = function (t, e) {
                this._verify2(t, e)
                var r = t.isub(e)
                return r.cmpn(0) < 0 && r.iadd(this.m), r
              }),
              (A.prototype.shl = function (t, e) {
                return this._verify1(t), this.imod(t.ushln(e))
              }),
              (A.prototype.imul = function (t, e) {
                return this._verify2(t, e), this.imod(t.imul(e))
              }),
              (A.prototype.mul = function (t, e) {
                return this._verify2(t, e), this.imod(t.mul(e))
              }),
              (A.prototype.isqr = function (t) {
                return this.imul(t, t.clone())
              }),
              (A.prototype.sqr = function (t) {
                return this.mul(t, t)
              }),
              (A.prototype.sqrt = function (t) {
                if (t.isZero()) return t.clone()
                var e = this.m.andln(3)
                if ((i(e % 2 == 1), 3 === e)) {
                  var r = this.m.add(new o(1)).iushrn(2)
                  return this.pow(t, r)
                }
                for (var n = this.m.subn(1), a = 0; !n.isZero() && 0 === n.andln(1); ) a++, n.iushrn(1)
                i(!n.isZero())
                var s = new o(1).toRed(this),
                  f = s.redNeg(),
                  h = this.m.subn(1).iushrn(1),
                  c = this.m.bitLength()
                for (c = new o(2 * c * c).toRed(this); 0 !== this.pow(c, h).cmp(f); ) c.redIAdd(f)
                for (
                  var u = this.pow(c, n), d = this.pow(t, n.addn(1).iushrn(1)), l = this.pow(t, n), p = a;
                  0 !== l.cmp(s);

                ) {
                  for (var b = l, m = 0; 0 !== b.cmp(s); m++) b = b.redSqr()
                  i(m < p)
                  var y = this.pow(u, new o(1).iushln(p - m - 1))
                  ;(d = d.redMul(y)), (u = y.redSqr()), (l = l.redMul(u)), (p = m)
                }
                return d
              }),
              (A.prototype.invm = function (t) {
                var e = t._invmp(this.m)
                return 0 !== e.negative ? ((e.negative = 0), this.imod(e).redNeg()) : this.imod(e)
              }),
              (A.prototype.pow = function (t, e) {
                if (e.isZero()) return new o(1).toRed(this)
                if (0 === e.cmpn(1)) return t.clone()
                var r = new Array(16)
                ;(r[0] = new o(1).toRed(this)), (r[1] = t)
                for (var i = 2; i < r.length; i++) r[i] = this.mul(r[i - 1], t)
                var n = r[0],
                  a = 0,
                  s = 0,
                  f = e.bitLength() % 26
                for (0 === f && (f = 26), i = e.length - 1; i >= 0; i--) {
                  for (var h = e.words[i], c = f - 1; c >= 0; c--) {
                    var u = (h >> c) & 1
                    n !== r[0] && (n = this.sqr(n)),
                      0 !== u || 0 !== a
                        ? ((a <<= 1),
                          (a |= u),
                          (4 == ++s || (0 === i && 0 === c)) && ((n = this.mul(n, r[a])), (s = 0), (a = 0)))
                        : (s = 0)
                  }
                  f = 26
                }
                return n
              }),
              (A.prototype.convertTo = function (t) {
                var e = t.umod(this.m)
                return e === t ? e.clone() : e
              }),
              (A.prototype.convertFrom = function (t) {
                var e = t.clone()
                return (e.red = null), e
              }),
              (o.mont = function (t) {
                return new k(t)
              }),
              n(k, A),
              (k.prototype.convertTo = function (t) {
                return this.imod(t.ushln(this.shift))
              }),
              (k.prototype.convertFrom = function (t) {
                var e = this.imod(t.mul(this.rinv))
                return (e.red = null), e
              }),
              (k.prototype.imul = function (t, e) {
                if (t.isZero() || e.isZero()) return (t.words[0] = 0), (t.length = 1), t
                var r = t.imul(e),
                  i = r.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m),
                  n = r.isub(i).iushrn(this.shift),
                  o = n
                return (
                  n.cmp(this.m) >= 0 ? (o = n.isub(this.m)) : n.cmpn(0) < 0 && (o = n.iadd(this.m)), o._forceRed(this)
                )
              }),
              (k.prototype.mul = function (t, e) {
                if (t.isZero() || e.isZero()) return new o(0)._forceRed(this)
                var r = t.mul(e),
                  i = r.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m),
                  n = r.isub(i).iushrn(this.shift),
                  a = n
                return (
                  n.cmp(this.m) >= 0 ? (a = n.isub(this.m)) : n.cmpn(0) < 0 && (a = n.iadd(this.m)), a._forceRed(this)
                )
              }),
              (k.prototype.invm = function (t) {
                return this.imod(t._invmp(this.m).mul(this.r2))._forceRed(this)
              })
          })((t = r.nmd(t)), this)
        },
        5229: (t, e, r) => {
          var i
          function n(t) {
            this.rand = t
          }
          if (
            ((t.exports = function (t) {
              return i || (i = new n(null)), i.generate(t)
            }),
            (t.exports.Rand = n),
            (n.prototype.generate = function (t) {
              return this._rand(t)
            }),
            (n.prototype._rand = function (t) {
              if (this.rand.getBytes) return this.rand.getBytes(t)
              for (var e = new Uint8Array(t), r = 0; r < e.length; r++) e[r] = this.rand.getByte()
              return e
            }),
            'object' == typeof self)
          )
            self.crypto && self.crypto.getRandomValues
              ? (n.prototype._rand = function (t) {
                  var e = new Uint8Array(t)
                  return self.crypto.getRandomValues(e), e
                })
              : self.msCrypto && self.msCrypto.getRandomValues
              ? (n.prototype._rand = function (t) {
                  var e = new Uint8Array(t)
                  return self.msCrypto.getRandomValues(e), e
                })
              : 'object' == typeof window &&
                (n.prototype._rand = function () {
                  throw new Error('Not implemented yet')
                })
          else
            try {
              var o = r(3906)
              if ('function' != typeof o.randomBytes) throw new Error('Not supported')
              n.prototype._rand = function (t) {
                return o.randomBytes(t)
              }
            } catch (t) {}
        },
        9089: (t, e, r) => {
          var i = r(8467).Buffer
          function n(t) {
            i.isBuffer(t) || (t = i.from(t))
            for (var e = (t.length / 4) | 0, r = new Array(e), n = 0; n < e; n++) r[n] = t.readUInt32BE(4 * n)
            return r
          }
          function o(t) {
            for (; 0 < t.length; t++) t[0] = 0
          }
          function a(t, e, r, i, n) {
            for (
              var o,
                a,
                s,
                f,
                h = r[0],
                c = r[1],
                u = r[2],
                d = r[3],
                l = t[0] ^ e[0],
                p = t[1] ^ e[1],
                b = t[2] ^ e[2],
                m = t[3] ^ e[3],
                y = 4,
                g = 1;
              g < n;
              g++
            )
              (o = h[l >>> 24] ^ c[(p >>> 16) & 255] ^ u[(b >>> 8) & 255] ^ d[255 & m] ^ e[y++]),
                (a = h[p >>> 24] ^ c[(b >>> 16) & 255] ^ u[(m >>> 8) & 255] ^ d[255 & l] ^ e[y++]),
                (s = h[b >>> 24] ^ c[(m >>> 16) & 255] ^ u[(l >>> 8) & 255] ^ d[255 & p] ^ e[y++]),
                (f = h[m >>> 24] ^ c[(l >>> 16) & 255] ^ u[(p >>> 8) & 255] ^ d[255 & b] ^ e[y++]),
                (l = o),
                (p = a),
                (b = s),
                (m = f)
            return (
              (o =
                ((i[l >>> 24] << 24) | (i[(p >>> 16) & 255] << 16) | (i[(b >>> 8) & 255] << 8) | i[255 & m]) ^ e[y++]),
              (a =
                ((i[p >>> 24] << 24) | (i[(b >>> 16) & 255] << 16) | (i[(m >>> 8) & 255] << 8) | i[255 & l]) ^ e[y++]),
              (s =
                ((i[b >>> 24] << 24) | (i[(m >>> 16) & 255] << 16) | (i[(l >>> 8) & 255] << 8) | i[255 & p]) ^ e[y++]),
              (f =
                ((i[m >>> 24] << 24) | (i[(l >>> 16) & 255] << 16) | (i[(p >>> 8) & 255] << 8) | i[255 & b]) ^ e[y++]),
              [(o >>>= 0), (a >>>= 0), (s >>>= 0), (f >>>= 0)]
            )
          }
          var s = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54],
            f = (function () {
              for (var t = new Array(256), e = 0; e < 256; e++) t[e] = e < 128 ? e << 1 : (e << 1) ^ 283
              for (var r = [], i = [], n = [[], [], [], []], o = [[], [], [], []], a = 0, s = 0, f = 0; f < 256; ++f) {
                var h = s ^ (s << 1) ^ (s << 2) ^ (s << 3) ^ (s << 4)
                ;(h = (h >>> 8) ^ (255 & h) ^ 99), (r[a] = h), (i[h] = a)
                var c = t[a],
                  u = t[c],
                  d = t[u],
                  l = (257 * t[h]) ^ (16843008 * h)
                ;(n[0][a] = (l << 24) | (l >>> 8)),
                  (n[1][a] = (l << 16) | (l >>> 16)),
                  (n[2][a] = (l << 8) | (l >>> 24)),
                  (n[3][a] = l),
                  (l = (16843009 * d) ^ (65537 * u) ^ (257 * c) ^ (16843008 * a)),
                  (o[0][h] = (l << 24) | (l >>> 8)),
                  (o[1][h] = (l << 16) | (l >>> 16)),
                  (o[2][h] = (l << 8) | (l >>> 24)),
                  (o[3][h] = l),
                  0 === a ? (a = s = 1) : ((a = c ^ t[t[t[d ^ c]]]), (s ^= t[t[s]]))
              }
              return { SBOX: r, INV_SBOX: i, SUB_MIX: n, INV_SUB_MIX: o }
            })()
          function h(t) {
            ;(this._key = n(t)), this._reset()
          }
          ;(h.blockSize = 16),
            (h.keySize = 32),
            (h.prototype.blockSize = h.blockSize),
            (h.prototype.keySize = h.keySize),
            (h.prototype._reset = function () {
              for (var t = this._key, e = t.length, r = e + 6, i = 4 * (r + 1), n = [], o = 0; o < e; o++) n[o] = t[o]
              for (o = e; o < i; o++) {
                var a = n[o - 1]
                o % e == 0
                  ? ((a = (a << 8) | (a >>> 24)),
                    (a =
                      (f.SBOX[a >>> 24] << 24) |
                      (f.SBOX[(a >>> 16) & 255] << 16) |
                      (f.SBOX[(a >>> 8) & 255] << 8) |
                      f.SBOX[255 & a]),
                    (a ^= s[(o / e) | 0] << 24))
                  : e > 6 &&
                    o % e == 4 &&
                    (a =
                      (f.SBOX[a >>> 24] << 24) |
                      (f.SBOX[(a >>> 16) & 255] << 16) |
                      (f.SBOX[(a >>> 8) & 255] << 8) |
                      f.SBOX[255 & a]),
                  (n[o] = n[o - e] ^ a)
              }
              for (var h = [], c = 0; c < i; c++) {
                var u = i - c,
                  d = n[u - (c % 4 ? 0 : 4)]
                h[c] =
                  c < 4 || u <= 4
                    ? d
                    : f.INV_SUB_MIX[0][f.SBOX[d >>> 24]] ^
                      f.INV_SUB_MIX[1][f.SBOX[(d >>> 16) & 255]] ^
                      f.INV_SUB_MIX[2][f.SBOX[(d >>> 8) & 255]] ^
                      f.INV_SUB_MIX[3][f.SBOX[255 & d]]
              }
              ;(this._nRounds = r), (this._keySchedule = n), (this._invKeySchedule = h)
            }),
            (h.prototype.encryptBlockRaw = function (t) {
              return a((t = n(t)), this._keySchedule, f.SUB_MIX, f.SBOX, this._nRounds)
            }),
            (h.prototype.encryptBlock = function (t) {
              var e = this.encryptBlockRaw(t),
                r = i.allocUnsafe(16)
              return (
                r.writeUInt32BE(e[0], 0),
                r.writeUInt32BE(e[1], 4),
                r.writeUInt32BE(e[2], 8),
                r.writeUInt32BE(e[3], 12),
                r
              )
            }),
            (h.prototype.decryptBlock = function (t) {
              var e = (t = n(t))[1]
              ;(t[1] = t[3]), (t[3] = e)
              var r = a(t, this._invKeySchedule, f.INV_SUB_MIX, f.INV_SBOX, this._nRounds),
                o = i.allocUnsafe(16)
              return (
                o.writeUInt32BE(r[0], 0),
                o.writeUInt32BE(r[3], 4),
                o.writeUInt32BE(r[2], 8),
                o.writeUInt32BE(r[1], 12),
                o
              )
            }),
            (h.prototype.scrub = function () {
              o(this._keySchedule), o(this._invKeySchedule), o(this._key)
            }),
            (t.exports.AES = h)
        },
        8860: (t, e, r) => {
          var i = r(9229),
            n = r(3816),
            o = r(7292)
          ;(e.createCipher = e.Cipher = i.createCipher),
            (e.createCipheriv = e.Cipheriv = i.createCipheriv),
            (e.createDecipher = e.Decipher = n.createDecipher),
            (e.createDecipheriv = e.Decipheriv = n.createDecipheriv),
            (e.listCiphers = e.getCiphers =
              function () {
                return Object.keys(o)
              })
        },
        2488: (t, e, r) => {
          var i = r(9089),
            n = r(8467).Buffer,
            o = r(6207),
            a = r(4603),
            s = r(3234),
            f = r(8843)
          function h(t, e, r, i) {
            i > 6 && ((r += i - 6), (i = 6)), t.writeUIntBE(e, r, i)
          }
          function c(t, e, r) {
            var i = 16 - (e.length % 16)
            16 !== i && (e = n.concat([e, n.alloc(i)]))
            for (var o = 0; o < e.length; ) s(t, e.slice(o, o + 16)), (o += 16), (t = r._cipher.encryptBlock(t))
            return t
          }
          function u(t, e, r, a, s) {
            if (
              (o.call(this),
              (s && s.authTagLength) || ((s = []).authTagLength = 8),
              s.authTagLength < 4 || s.authTagLength > 16 || s.authTagLength % 2 == 1)
            )
              throw new Error('authTagLength must be one of 4, 6, 8, 10, 12, 14 or 16')
            if (r.length < 7 || r.length > 13) throw new Error('iv must be between 7 and 13 bytes')
            ;(this._n = r.length),
              (this._l = 15 - this._n),
              (this._cipher = new i.AES(e)),
              (this.authTagLength = s.authTagLength),
              (this._mode = t),
              (this._add = null),
              (this._decrypt = a),
              (this._authTag = null),
              (this._called = !1),
              (this._plainLength = null),
              (this._prev = null),
              (this._iv = r),
              (this._cache = n.allocUnsafe(0)),
              (this._failed = !1),
              (this._firstBlock = null)
          }
          function d(t, e) {
            return !((13 === t && e >= 65536) || (12 === t && e >= 16777216))
          }
          function l(t, e) {
            var r = t._firstBlock
            return (
              r ||
                (((r = n.alloc(16))[0] = ((t.authTagLength - 2) / 2) * 8 + t._l - 1),
                t._iv.copy(r, 1),
                h(r, e.length, t._n + 1, t._l),
                (r = t._cipher.encryptBlock(r))),
              c(r, e, t)
            )
          }
          a(u, o),
            (u.prototype._update = function (t) {
              if (this._called) throw new Error('Trying to add data in unsupported state')
              if (!d(this._iv.length, t.length)) throw new Error('Message exceeds maximum size')
              if (null !== this._plainLength && this._plainLength !== t.length)
                throw new Error('Trying to add data in unsupported state')
              var e
              ;(this._called = !0),
                (this._prev = n.alloc(16)),
                (this._prev[0] = this._l - 1),
                this._iv.copy(this._prev, 1),
                this._decrypt
                  ? (e = this._mode.encrypt(this, n.alloc(16)).slice(0, this.authTagLength))
                  : (this._authTag = this._mode.encrypt(this, l(this, t)).slice(0, this.authTagLength))
              var r = this._mode.encrypt(this, t)
              if (this._decrypt) {
                var i = l(this, r).slice(0, this.authTagLength)
                s(i, e), (this._failed = !f(i, this._authTag))
              }
              return this._cipher.scrub(), r
            }),
            (u.prototype._final = function () {
              if (this._decrypt && !this._authTag) throw new Error('Unsupported state or unable to authenticate data')
              if (this._failed) throw new Error('Unsupported state or unable to authenticate data')
            }),
            (u.prototype.getAuthTag = function () {
              if (this._decrypt || !n.isBuffer(this._authTag))
                throw new Error('Attempting to get auth tag in unsupported state')
              return this._authTag
            }),
            (u.prototype.setAuthTag = function (t) {
              if (!this._decrypt) throw new Error('Attempting to set auth tag in unsupported state')
              this._authTag = t
            }),
            (u.prototype.setAAD = function (t, e) {
              if (this._called) throw new Error('Attempting to set AAD in unsupported state')
              if (!e || !e.plaintextLength) throw new Error('options plaintextLength is required')
              if (!d(this._iv.length, e.plaintextLength)) throw new Error('Message exceeds maximum size')
              if (((this._plainLength = e.plaintextLength), t.length)) {
                var r = n.alloc(16)
                ;(r[0] = 64 + ((this.authTagLength - 2) / 2) * 8 + this._l - 1),
                  this._iv.copy(r, 1),
                  h(r, e.plaintextLength, this._n + 1, this._l),
                  (r = this._cipher.encryptBlock(r))
                var i,
                  o = t.length
                o < 65280
                  ? (i = n.allocUnsafe(2)).writeUInt16BE(o, 0)
                  : o < 4294967296
                  ? (((i = n.allocUnsafe(6))[0] = 255), (i[1] = 254), i.writeUInt32BE(o, 2))
                  : (((i = n.alloc(10))[0] = 255), (i[1] = 255), i.writeUIntBE(o, 4, 6))
                var a = n.concat([i, t])
                this._firstBlock = c(r, a, this)
              }
            }),
            (t.exports = u)
        },
        3816: (t, e, r) => {
          var i = r(4211),
            n = r(2488),
            o = r(8467).Buffer,
            a = r(3966),
            s = r(4096),
            f = r(6207),
            h = r(9089),
            c = r(3014)
          function u(t, e, r) {
            f.call(this),
              (this._cache = new d()),
              (this._last = void 0),
              (this._cipher = new h.AES(e)),
              (this._prev = o.from(r)),
              (this._mode = t),
              (this._autopadding = !0)
          }
          function d() {
            this.cache = o.allocUnsafe(0)
          }
          function l(t, e, r, f) {
            var h = a[t.toLowerCase()]
            if (!h) throw new TypeError('invalid suite type')
            if (('string' == typeof r && (r = o.from(r)), 'auth' !== h.type && r.length !== h.iv))
              throw new TypeError('invalid iv length ' + r.length)
            if (('string' == typeof e && (e = o.from(e)), e.length !== h.key / 8))
              throw new TypeError('invalid key length ' + e.length)
            return 'stream' === h.type
              ? new s(h.module, e, r, !0)
              : 'GCM' === h.mode
              ? new i(h.module, e, r, !0)
              : 'CCM' === h.mode
              ? new n(h.module, e, r, !0, f)
              : new u(h.module, e, r)
          }
          r(4603)(u, f),
            (u.prototype._update = function (t) {
              var e, r
              this._cache.add(t)
              for (var i = []; (e = this._cache.get(this._autopadding)); ) (r = this._mode.decrypt(this, e)), i.push(r)
              return o.concat(i)
            }),
            (u.prototype._final = function () {
              var t = this._cache.flush()
              if (this._autopadding)
                return (function (t) {
                  var e = t[15]
                  if (e < 1 || e > 16) throw new Error('unable to decrypt data')
                  for (var r = -1; ++r < e; ) if (t[r + (16 - e)] !== e) throw new Error('unable to decrypt data')
                  if (16 !== e) return t.slice(0, 16 - e)
                })(this._mode.decrypt(this, t))
              if (t) throw new Error('data not multiple of block length')
            }),
            (u.prototype.setAutoPadding = function (t) {
              return (this._autopadding = !!t), this
            }),
            (d.prototype.add = function (t) {
              this.cache = o.concat([this.cache, t])
            }),
            (d.prototype.get = function (t) {
              var e
              if (t) {
                if (this.cache.length > 16) return (e = this.cache.slice(0, 16)), (this.cache = this.cache.slice(16)), e
              } else if (this.cache.length >= 16)
                return (e = this.cache.slice(0, 16)), (this.cache = this.cache.slice(16)), e
              return null
            }),
            (d.prototype.flush = function () {
              if (this.cache.length) return this.cache
            }),
            (e.createDecipher = function (t, e, r) {
              var i = a[t.toLowerCase()]
              if (!i) throw new TypeError('invalid suite type')
              var n = c(e, !1, i.key, i.iv)
              return l(t, n.key, n.iv, r)
            }),
            (e.createDecipheriv = l)
        },
        9229: (t, e, r) => {
          var i = r(3966),
            n = r(4211),
            o = r(2488),
            a = r(8467).Buffer,
            s = r(4096),
            f = r(6207),
            h = r(9089),
            c = r(3014)
          function u(t, e, r) {
            f.call(this),
              (this._cache = new l()),
              (this._cipher = new h.AES(e)),
              (this._prev = a.from(r)),
              (this._mode = t),
              (this._autopadding = !0)
          }
          r(4603)(u, f),
            (u.prototype._update = function (t) {
              var e, r
              this._cache.add(t)
              for (var i = []; (e = this._cache.get()); ) (r = this._mode.encrypt(this, e)), i.push(r)
              return a.concat(i)
            })
          var d = a.alloc(16, 16)
          function l() {
            this.cache = a.allocUnsafe(0)
          }
          function p(t, e, r, f) {
            var h = i[t.toLowerCase()]
            if (!h) throw new TypeError('invalid suite type')
            if (('string' == typeof e && (e = a.from(e)), e.length !== h.key / 8))
              throw new TypeError('invalid key length ' + e.length)
            if (('string' == typeof r && (r = a.from(r)), 'auth' !== h.type && r.length !== h.iv))
              throw new TypeError('invalid iv length ' + r.length)
            return 'stream' === h.type
              ? new s(h.module, e, r)
              : 'GCM' === h.mode
              ? new n(h.module, e, r)
              : 'CCM' === h.mode
              ? new o(h.module, e, r, !1, f)
              : new u(h.module, e, r)
          }
          ;(u.prototype._final = function () {
            var t = this._cache.flush()
            if (this._autopadding) return (t = this._mode.encrypt(this, t)), this._cipher.scrub(), t
            if (!t.equals(d)) throw (this._cipher.scrub(), new Error('data not multiple of block length'))
          }),
            (u.prototype.setAutoPadding = function (t) {
              return (this._autopadding = !!t), this
            }),
            (l.prototype.add = function (t) {
              this.cache = a.concat([this.cache, t])
            }),
            (l.prototype.get = function () {
              if (this.cache.length > 15) {
                var t = this.cache.slice(0, 16)
                return (this.cache = this.cache.slice(16)), t
              }
              return null
            }),
            (l.prototype.flush = function () {
              for (var t = 16 - this.cache.length, e = a.allocUnsafe(t), r = -1; ++r < t; ) e.writeUInt8(t, r)
              return a.concat([this.cache, e])
            }),
            (e.createCipheriv = p),
            (e.createCipher = function (t, e, r) {
              var n = i[t.toLowerCase()]
              if (!n) throw new TypeError('invalid suite type')
              var o = c(e, !1, n.key, n.iv)
              return p(t, o.key, o.iv, r)
            })
        },
        4211: (t, e, r) => {
          var i = r(9089),
            n = r(8467).Buffer,
            o = r(6207),
            a = r(4603),
            s = r(8007),
            f = r(8277),
            h = r(1123),
            c = r(8843)
          function u(t, e, r, a) {
            o.call(this)
            var f = n.alloc(4, 0)
            this._cipher = new i.AES(e)
            var c = this._cipher.encryptBlock(f)
            ;(this._ghash = new s(c)),
              (r = (function (t, e, r) {
                if (12 === e.length)
                  return (t._finID = n.concat([e, n.from([0, 0, 0, 1])])), n.concat([e, n.from([0, 0, 0, 2])])
                var i = new s(r),
                  o = e.length,
                  a = o % 16
                i.update(e), a && ((a = 16 - a), i.update(n.alloc(a, 0))), i.update(n.alloc(8, 0))
                var f = 8 * o,
                  c = n.alloc(8)
                c.writeUIntBE(f, 2, 6), i.update(c), (t._finID = i.state)
                var u = n.from(t._finID)
                return h(u), u
              })(this, r, c)),
              (this._prev = n.from(r)),
              (this._cache = n.allocUnsafe(0)),
              (this._secCache = n.allocUnsafe(0)),
              (this._decrypt = a),
              (this._alen = 0),
              (this._len = 0),
              (this._mode = t),
              (this._authTag = null),
              (this._called = !1)
          }
          a(u, o),
            (u.prototype._update = function (t) {
              if (!this._called && this._alen) {
                var e = 16 - (this._alen % 16)
                e < 16 && ((e = n.alloc(e, 0)), this._ghash.update(e))
              }
              this._called = !0
              var r = this._mode.encrypt(this, t)
              return this._decrypt ? this._ghash.update(t) : this._ghash.update(r), (this._len += t.length), r
            }),
            (u.prototype._final = function () {
              if (this._decrypt && !this._authTag) throw new Error('Unsupported state or unable to authenticate data')
              var t = f(this._ghash.final(8 * this._alen, 8 * this._len), this._cipher.encryptBlock(this._finID))
              if (this._decrypt && !c(t, this._authTag))
                throw new Error('Unsupported state or unable to authenticate data')
              ;(this._authTag = t), this._cipher.scrub()
            }),
            (u.prototype.getAuthTag = function () {
              if (this._decrypt || !n.isBuffer(this._authTag))
                throw new Error('Attempting to get auth tag in unsupported state')
              return this._authTag
            }),
            (u.prototype.setAuthTag = function (t) {
              if (!this._decrypt) throw new Error('Attempting to set auth tag in unsupported state')
              this._authTag = t
            }),
            (u.prototype.setAAD = function (t) {
              if (this._called) throw new Error('Attempting to set AAD in unsupported state')
              this._ghash.update(t), (this._alen += t.length)
            }),
            (t.exports = u)
        },
        8007: (t, e, r) => {
          var i = r(8467).Buffer,
            n = i.alloc(16, 0)
          function o(t) {
            var e = i.allocUnsafe(16)
            return (
              e.writeUInt32BE(t[0] >>> 0, 0),
              e.writeUInt32BE(t[1] >>> 0, 4),
              e.writeUInt32BE(t[2] >>> 0, 8),
              e.writeUInt32BE(t[3] >>> 0, 12),
              e
            )
          }
          function a(t) {
            ;(this.h = t), (this.state = i.alloc(16, 0)), (this.cache = i.allocUnsafe(0))
          }
          ;(a.prototype.ghash = function (t) {
            for (var e = -1; ++e < t.length; ) this.state[e] ^= t[e]
            this._multiply()
          }),
            (a.prototype._multiply = function () {
              for (
                var t,
                  e,
                  r,
                  i = [(t = this.h).readUInt32BE(0), t.readUInt32BE(4), t.readUInt32BE(8), t.readUInt32BE(12)],
                  n = [0, 0, 0, 0],
                  a = -1;
                ++a < 128;

              ) {
                for (
                  0 != (this.state[~~(a / 8)] & (1 << (7 - (a % 8)))) &&
                    ((n[0] ^= i[0]), (n[1] ^= i[1]), (n[2] ^= i[2]), (n[3] ^= i[3])),
                    r = 0 != (1 & i[3]),
                    e = 3;
                  e > 0;
                  e--
                )
                  i[e] = (i[e] >>> 1) | ((1 & i[e - 1]) << 31)
                ;(i[0] = i[0] >>> 1), r && (i[0] = i[0] ^ (225 << 24))
              }
              this.state = o(n)
            }),
            (a.prototype.update = function (t) {
              var e
              for (this.cache = i.concat([this.cache, t]); this.cache.length >= 16; )
                (e = this.cache.slice(0, 16)), (this.cache = this.cache.slice(16)), this.ghash(e)
            }),
            (a.prototype.final = function (t, e) {
              return (
                this.cache.length && this.ghash(i.concat([this.cache, n], 16)), this.ghash(o([0, t, 0, e])), this.state
              )
            }),
            (t.exports = a)
        },
        1123: (t) => {
          t.exports = function (t) {
            for (var e, r = t.length; r--; ) {
              if (255 !== (e = t.readUInt8(r))) {
                e++, t.writeUInt8(e, r)
                break
              }
              t.writeUInt8(0, r)
            }
          }
        },
        6996: (t, e, r) => {
          var i = r(8277)
          ;(e.encrypt = function (t, e) {
            var r = i(e, t._prev)
            return (t._prev = t._cipher.encryptBlock(r)), t._prev
          }),
            (e.decrypt = function (t, e) {
              var r = t._prev
              t._prev = e
              var n = t._cipher.decryptBlock(e)
              return i(n, r)
            })
        },
        4742: (t, e, r) => {
          var i = r(8467).Buffer,
            n = r(8277)
          function o(t, e, r) {
            var o = e.length,
              a = n(e, t._cache)
            return (t._cache = t._cache.slice(o)), (t._prev = i.concat([t._prev, r ? e : a])), a
          }
          e.encrypt = function (t, e, r) {
            for (var n, a = i.allocUnsafe(0); e.length; ) {
              if (
                (0 === t._cache.length && ((t._cache = t._cipher.encryptBlock(t._prev)), (t._prev = i.allocUnsafe(0))),
                !(t._cache.length <= e.length))
              ) {
                a = i.concat([a, o(t, e, r)])
                break
              }
              ;(n = t._cache.length), (a = i.concat([a, o(t, e.slice(0, n), r)])), (e = e.slice(n))
            }
            return a
          }
        },
        9968: (t, e, r) => {
          var i = r(8467).Buffer
          function n(t, e, r) {
            for (var i, n, a = -1, s = 0; ++a < 8; )
              (i = e & (1 << (7 - a)) ? 128 : 0),
                (s += (128 & (n = t._cipher.encryptBlock(t._prev)[0] ^ i)) >> a % 8),
                (t._prev = o(t._prev, r ? i : n))
            return s
          }
          function o(t, e) {
            var r = t.length,
              n = -1,
              o = i.allocUnsafe(t.length)
            for (t = i.concat([t, i.from([e])]); ++n < r; ) o[n] = (t[n] << 1) | (t[n + 1] >> 7)
            return o
          }
          e.encrypt = function (t, e, r) {
            for (var o = e.length, a = i.allocUnsafe(o), s = -1; ++s < o; ) a[s] = n(t, e[s], r)
            return a
          }
        },
        6371: (t, e, r) => {
          var i = r(8467).Buffer
          function n(t, e, r) {
            var n = t._cipher.encryptBlock(t._prev)[0] ^ e
            return (t._prev = i.concat([t._prev.slice(1), i.from([r ? e : n])])), n
          }
          e.encrypt = function (t, e, r) {
            for (var o = e.length, a = i.allocUnsafe(o), s = -1; ++s < o; ) a[s] = n(t, e[s], r)
            return a
          }
        },
        160: (t, e, r) => {
          var i = r(8277),
            n = r(8467).Buffer,
            o = r(1123)
          function a(t) {
            var e = t._cipher.encryptBlockRaw(t._prev)
            return o(t._prev), e
          }
          e.encrypt = function (t, e) {
            var r = Math.ceil(e.length / 16),
              o = t._cache.length
            t._cache = n.concat([t._cache, n.allocUnsafe(16 * r)])
            for (var s = 0; s < r; s++) {
              var f = a(t),
                h = o + 16 * s
              t._cache.writeUInt32BE(f[0], h + 0),
                t._cache.writeUInt32BE(f[1], h + 4),
                t._cache.writeUInt32BE(f[2], h + 8),
                t._cache.writeUInt32BE(f[3], h + 12)
            }
            var c = t._cache.slice(0, e.length)
            return (t._cache = t._cache.slice(e.length)), i(e, c)
          }
        },
        9506: (t, e) => {
          ;(e.encrypt = function (t, e) {
            return t._cipher.encryptBlock(e)
          }),
            (e.decrypt = function (t, e) {
              return t._cipher.decryptBlock(e)
            })
        },
        3966: (t, e, r) => {
          var i = {
              ECB: r(9506),
              CBC: r(6996),
              CFB: r(4742),
              CFB8: r(6371),
              CFB1: r(9968),
              OFB: r(5292),
              CTR: r(160),
              GCM: r(160),
              CCM: r(160),
            },
            n = r(7292)
          for (var o in n) n[o].module = i[n[o].mode]
          t.exports = n
        },
        7292: (t) => {
          'use strict'
          t.exports = JSON.parse(
            '{"aes-128-ecb":{"cipher":"AES","key":128,"iv":0,"mode":"ECB","type":"block"},"aes-192-ecb":{"cipher":"AES","key":192,"iv":0,"mode":"ECB","type":"block"},"aes-256-ecb":{"cipher":"AES","key":256,"iv":0,"mode":"ECB","type":"block"},"aes-128-cbc":{"cipher":"AES","key":128,"iv":16,"mode":"CBC","type":"block"},"aes-192-cbc":{"cipher":"AES","key":192,"iv":16,"mode":"CBC","type":"block"},"aes-256-cbc":{"cipher":"AES","key":256,"iv":16,"mode":"CBC","type":"block"},"aes128":{"cipher":"AES","key":128,"iv":16,"mode":"CBC","type":"block"},"aes192":{"cipher":"AES","key":192,"iv":16,"mode":"CBC","type":"block"},"aes256":{"cipher":"AES","key":256,"iv":16,"mode":"CBC","type":"block"},"aes-128-cfb":{"cipher":"AES","key":128,"iv":16,"mode":"CFB","type":"stream"},"aes-192-cfb":{"cipher":"AES","key":192,"iv":16,"mode":"CFB","type":"stream"},"aes-256-cfb":{"cipher":"AES","key":256,"iv":16,"mode":"CFB","type":"stream"},"aes-128-cfb8":{"cipher":"AES","key":128,"iv":16,"mode":"CFB8","type":"stream"},"aes-192-cfb8":{"cipher":"AES","key":192,"iv":16,"mode":"CFB8","type":"stream"},"aes-256-cfb8":{"cipher":"AES","key":256,"iv":16,"mode":"CFB8","type":"stream"},"aes-128-cfb1":{"cipher":"AES","key":128,"iv":16,"mode":"CFB1","type":"stream"},"aes-192-cfb1":{"cipher":"AES","key":192,"iv":16,"mode":"CFB1","type":"stream"},"aes-256-cfb1":{"cipher":"AES","key":256,"iv":16,"mode":"CFB1","type":"stream"},"aes-128-ofb":{"cipher":"AES","key":128,"iv":16,"mode":"OFB","type":"stream"},"aes-192-ofb":{"cipher":"AES","key":192,"iv":16,"mode":"OFB","type":"stream"},"aes-256-ofb":{"cipher":"AES","key":256,"iv":16,"mode":"OFB","type":"stream"},"aes-128-ctr":{"cipher":"AES","key":128,"iv":16,"mode":"CTR","type":"stream"},"aes-192-ctr":{"cipher":"AES","key":192,"iv":16,"mode":"CTR","type":"stream"},"aes-256-ctr":{"cipher":"AES","key":256,"iv":16,"mode":"CTR","type":"stream"},"aes-128-gcm":{"cipher":"AES","key":128,"iv":12,"mode":"GCM","type":"auth"},"aes-192-gcm":{"cipher":"AES","key":192,"iv":12,"mode":"GCM","type":"auth"},"aes-256-gcm":{"cipher":"AES","key":256,"iv":12,"mode":"GCM","type":"auth"},"aes-128-ccm":{"cipher":"AES","key":128,"iv":12,"mode":"CCM","type":"auth"},"aes-192-ccm":{"cipher":"AES","key":192,"iv":12,"mode":"CCM","type":"auth"},"aes-256-ccm":{"cipher":"AES","key":256,"iv":12,"mode":"CCM","type":"auth"}}',
          )
        },
        5292: (t, e, r) => {
          var i = r(692).Buffer,
            n = r(8277)
          function o(t) {
            return (t._prev = t._cipher.encryptBlock(t._prev)), t._prev
          }
          e.encrypt = function (t, e) {
            for (; t._cache.length < e.length; ) t._cache = i.concat([t._cache, o(t)])
            var r = t._cache.slice(0, e.length)
            return (t._cache = t._cache.slice(e.length)), n(e, r)
          }
        },
        4096: (t, e, r) => {
          var i = r(9089),
            n = r(8467).Buffer,
            o = r(6207)
          function a(t, e, r, a) {
            o.call(this),
              (this._cipher = new i.AES(e)),
              (this._prev = n.from(r)),
              (this._cache = n.allocUnsafe(0)),
              (this._secCache = n.allocUnsafe(0)),
              (this._decrypt = a),
              (this._mode = t)
          }
          r(4603)(a, o),
            (a.prototype._update = function (t) {
              return this._mode.encrypt(this, t, this._decrypt)
            }),
            (a.prototype._final = function () {
              this._cipher.scrub()
            }),
            (t.exports = a)
        },
        7383: (t, e, r) => {
          var i = r(798),
            n = r(8860),
            o = r(3966),
            a = r(3960),
            s = r(3014)
          function f(t, e, r) {
            if (((t = t.toLowerCase()), o[t])) return n.createCipheriv(t, e, r)
            if (a[t]) return new i({ key: e, iv: r, mode: t })
            throw new TypeError('invalid suite type')
          }
          function h(t, e, r) {
            if (((t = t.toLowerCase()), o[t])) return n.createDecipheriv(t, e, r)
            if (a[t]) return new i({ key: e, iv: r, mode: t, decrypt: !0 })
            throw new TypeError('invalid suite type')
          }
          ;(e.createCipher = e.Cipher =
            function (t, e) {
              var r, i
              if (((t = t.toLowerCase()), o[t])) (r = o[t].key), (i = o[t].iv)
              else {
                if (!a[t]) throw new TypeError('invalid suite type')
                ;(r = 8 * a[t].key), (i = a[t].iv)
              }
              var n = s(e, !1, r, i)
              return f(t, n.key, n.iv)
            }),
            (e.createCipheriv = e.Cipheriv = f),
            (e.createDecipher = e.Decipher =
              function (t, e) {
                var r, i
                if (((t = t.toLowerCase()), o[t])) (r = o[t].key), (i = o[t].iv)
                else {
                  if (!a[t]) throw new TypeError('invalid suite type')
                  ;(r = 8 * a[t].key), (i = a[t].iv)
                }
                var n = s(e, !1, r, i)
                return h(t, n.key, n.iv)
              }),
            (e.createDecipheriv = e.Decipheriv = h),
            (e.listCiphers = e.getCiphers =
              function () {
                return Object.keys(a).concat(n.getCiphers())
              })
        },
        798: (t, e, r) => {
          var i = r(6207),
            n = r(5557),
            o = r(4603),
            a = r(8467).Buffer,
            s = {
              'des-ede3-cbc': n.CBC.instantiate(n.EDE),
              'des-ede3': n.EDE,
              'des-ede-cbc': n.CBC.instantiate(n.EDE),
              'des-ede': n.EDE,
              'des-cbc': n.CBC.instantiate(n.DES),
              'des-ecb': n.DES,
            }
          function f(t) {
            i.call(this)
            var e,
              r = t.mode.toLowerCase(),
              n = s[r]
            e = t.decrypt ? 'decrypt' : 'encrypt'
            var o = t.key
            a.isBuffer(o) || (o = a.from(o)),
              ('des-ede' !== r && 'des-ede-cbc' !== r) || (o = a.concat([o, o.slice(0, 8)]))
            var f = t.iv
            a.isBuffer(f) || (f = a.from(f)), (this._des = n.create({ key: o, iv: f, type: e }))
          }
          ;(s.des = s['des-cbc']),
            (s.des3 = s['des-ede3-cbc']),
            (t.exports = f),
            o(f, i),
            (f.prototype._update = function (t) {
              return a.from(this._des.update(t))
            }),
            (f.prototype._final = function () {
              return a.from(this._des.final())
            })
        },
        3960: (t, e) => {
          ;(e['des-ecb'] = { key: 8, iv: 0 }),
            (e['des-cbc'] = e.des = { key: 8, iv: 8 }),
            (e['des-ede3-cbc'] = e.des3 = { key: 24, iv: 8 }),
            (e['des-ede3'] = { key: 24, iv: 0 }),
            (e['des-ede-cbc'] = { key: 16, iv: 8 }),
            (e['des-ede'] = { key: 16, iv: 0 })
        },
        213: (t, e, r) => {
          var i = r(692).Buffer,
            n = r(7898),
            o = r(8244)
          function a(t) {
            var e,
              r = t.modulus.byteLength()
            do {
              e = new n(o(r))
            } while (e.cmp(t.modulus) >= 0 || !e.umod(t.prime1) || !e.umod(t.prime2))
            return e
          }
          function s(t, e) {
            var r = (function (t) {
                var e = a(t)
                return {
                  blinder: e.toRed(n.mont(t.modulus)).redPow(new n(t.publicExponent)).fromRed(),
                  unblinder: e.invm(t.modulus),
                }
              })(e),
              o = e.modulus.byteLength(),
              s = new n(t).mul(r.blinder).umod(e.modulus),
              f = s.toRed(n.mont(e.prime1)),
              h = s.toRed(n.mont(e.prime2)),
              c = e.coefficient,
              u = e.prime1,
              d = e.prime2,
              l = f.redPow(e.exponent1).fromRed(),
              p = h.redPow(e.exponent2).fromRed(),
              b = l.isub(p).imul(c).umod(u).imul(d)
            return p.iadd(b).imul(r.unblinder).umod(e.modulus).toArrayLike(i, 'be', o)
          }
          ;(s.getr = a), (t.exports = s)
        },
        5886: (t, e, r) => {
          t.exports = r(5514)
        },
        5514: (t) => {
          'use strict'
          t.exports = JSON.parse(
            '{"sha224WithRSAEncryption":{"sign":"rsa","hash":"sha224","id":"302d300d06096086480165030402040500041c"},"RSA-SHA224":{"sign":"ecdsa/rsa","hash":"sha224","id":"302d300d06096086480165030402040500041c"},"sha256WithRSAEncryption":{"sign":"rsa","hash":"sha256","id":"3031300d060960864801650304020105000420"},"RSA-SHA256":{"sign":"ecdsa/rsa","hash":"sha256","id":"3031300d060960864801650304020105000420"},"sha384WithRSAEncryption":{"sign":"rsa","hash":"sha384","id":"3041300d060960864801650304020205000430"},"RSA-SHA384":{"sign":"ecdsa/rsa","hash":"sha384","id":"3041300d060960864801650304020205000430"},"sha512WithRSAEncryption":{"sign":"rsa","hash":"sha512","id":"3051300d060960864801650304020305000440"},"RSA-SHA512":{"sign":"ecdsa/rsa","hash":"sha512","id":"3051300d060960864801650304020305000440"},"RSA-SHA1":{"sign":"rsa","hash":"sha1","id":"3021300906052b0e03021a05000414"},"ecdsa-with-SHA1":{"sign":"ecdsa","hash":"sha1","id":""},"sha256":{"sign":"ecdsa","hash":"sha256","id":""},"sha224":{"sign":"ecdsa","hash":"sha224","id":""},"sha384":{"sign":"ecdsa","hash":"sha384","id":""},"sha512":{"sign":"ecdsa","hash":"sha512","id":""},"DSA-SHA":{"sign":"dsa","hash":"sha1","id":""},"DSA-SHA1":{"sign":"dsa","hash":"sha1","id":""},"DSA":{"sign":"dsa","hash":"sha1","id":""},"DSA-WITH-SHA224":{"sign":"dsa","hash":"sha224","id":""},"DSA-SHA224":{"sign":"dsa","hash":"sha224","id":""},"DSA-WITH-SHA256":{"sign":"dsa","hash":"sha256","id":""},"DSA-SHA256":{"sign":"dsa","hash":"sha256","id":""},"DSA-WITH-SHA384":{"sign":"dsa","hash":"sha384","id":""},"DSA-SHA384":{"sign":"dsa","hash":"sha384","id":""},"DSA-WITH-SHA512":{"sign":"dsa","hash":"sha512","id":""},"DSA-SHA512":{"sign":"dsa","hash":"sha512","id":""},"DSA-RIPEMD160":{"sign":"dsa","hash":"rmd160","id":""},"ripemd160WithRSA":{"sign":"rsa","hash":"rmd160","id":"3021300906052b2403020105000414"},"RSA-RIPEMD160":{"sign":"rsa","hash":"rmd160","id":"3021300906052b2403020105000414"},"md5WithRSAEncryption":{"sign":"rsa","hash":"md5","id":"3020300c06082a864886f70d020505000410"},"RSA-MD5":{"sign":"rsa","hash":"md5","id":"3020300c06082a864886f70d020505000410"}}',
          )
        },
        946: (t) => {
          'use strict'
          t.exports = JSON.parse(
            '{"1.3.132.0.10":"secp256k1","1.3.132.0.33":"p224","1.2.840.10045.3.1.1":"p192","1.2.840.10045.3.1.7":"p256","1.3.132.0.34":"p384","1.3.132.0.35":"p521"}',
          )
        },
        5478: (t, e, r) => {
          var i = r(8467).Buffer,
            n = r(3987),
            o = r(1902),
            a = r(4603),
            s = r(6213),
            f = r(1045),
            h = r(5514)
          function c(t) {
            o.Writable.call(this)
            var e = h[t]
            if (!e) throw new Error('Unknown message digest')
            ;(this._hashType = e.hash), (this._hash = n(e.hash)), (this._tag = e.id), (this._signType = e.sign)
          }
          function u(t) {
            o.Writable.call(this)
            var e = h[t]
            if (!e) throw new Error('Unknown message digest')
            ;(this._hash = n(e.hash)), (this._tag = e.id), (this._signType = e.sign)
          }
          function d(t) {
            return new c(t)
          }
          function l(t) {
            return new u(t)
          }
          Object.keys(h).forEach(function (t) {
            ;(h[t].id = i.from(h[t].id, 'hex')), (h[t.toLowerCase()] = h[t])
          }),
            a(c, o.Writable),
            (c.prototype._write = function (t, e, r) {
              this._hash.update(t), r()
            }),
            (c.prototype.update = function (t, e) {
              return 'string' == typeof t && (t = i.from(t, e)), this._hash.update(t), this
            }),
            (c.prototype.sign = function (t, e) {
              this.end()
              var r = this._hash.digest(),
                i = s(r, t, this._hashType, this._signType, this._tag)
              return e ? i.toString(e) : i
            }),
            a(u, o.Writable),
            (u.prototype._write = function (t, e, r) {
              this._hash.update(t), r()
            }),
            (u.prototype.update = function (t, e) {
              return 'string' == typeof t && (t = i.from(t, e)), this._hash.update(t), this
            }),
            (u.prototype.verify = function (t, e, r) {
              'string' == typeof e && (e = i.from(e, r)), this.end()
              var n = this._hash.digest()
              return f(e, n, t, this._signType, this._tag)
            }),
            (t.exports = { Sign: d, Verify: l, createSign: d, createVerify: l })
        },
        6213: (t, e, r) => {
          var i = r(8467).Buffer,
            n = r(384),
            o = r(213),
            a = r(7264).ec,
            s = r(7898),
            f = r(9558),
            h = r(946)
          function c(t, e, r, o) {
            if ((t = i.from(t.toArray())).length < e.byteLength()) {
              var a = i.alloc(e.byteLength() - t.length)
              t = i.concat([a, t])
            }
            var s = r.length,
              f = (function (t, e) {
                t = (t = u(t, e)).mod(e)
                var r = i.from(t.toArray())
                if (r.length < e.byteLength()) {
                  var n = i.alloc(e.byteLength() - r.length)
                  r = i.concat([n, r])
                }
                return r
              })(r, e),
              h = i.alloc(s)
            h.fill(1)
            var c = i.alloc(s)
            return (
              (c = n(o, c)
                .update(h)
                .update(i.from([0]))
                .update(t)
                .update(f)
                .digest()),
              (h = n(o, c).update(h).digest()),
              {
                k: (c = n(o, c)
                  .update(h)
                  .update(i.from([1]))
                  .update(t)
                  .update(f)
                  .digest()),
                v: (h = n(o, c).update(h).digest()),
              }
            )
          }
          function u(t, e) {
            var r = new s(t),
              i = (t.length << 3) - e.bitLength()
            return i > 0 && r.ishrn(i), r
          }
          function d(t, e, r) {
            var o, a
            do {
              for (o = i.alloc(0); 8 * o.length < t.bitLength(); )
                (e.v = n(r, e.k).update(e.v).digest()), (o = i.concat([o, e.v]))
              ;(a = u(o, t)),
                (e.k = n(r, e.k)
                  .update(e.v)
                  .update(i.from([0]))
                  .digest()),
                (e.v = n(r, e.k).update(e.v).digest())
            } while (-1 !== a.cmp(t))
            return a
          }
          function l(t, e, r, i) {
            return t.toRed(s.mont(r)).redPow(e).fromRed().mod(i)
          }
          ;(t.exports = function (t, e, r, n, p) {
            var b = f(e)
            if (b.curve) {
              if ('ecdsa' !== n && 'ecdsa/rsa' !== n) throw new Error('wrong private key type')
              return (function (t, e) {
                var r = h[e.curve.join('.')]
                if (!r) throw new Error('unknown curve ' + e.curve.join('.'))
                var n = new a(r).keyFromPrivate(e.privateKey).sign(t)
                return i.from(n.toDER())
              })(t, b)
            }
            if ('dsa' === b.type) {
              if ('dsa' !== n) throw new Error('wrong private key type')
              return (function (t, e, r) {
                for (
                  var n,
                    o = e.params.priv_key,
                    a = e.params.p,
                    f = e.params.q,
                    h = e.params.g,
                    p = new s(0),
                    b = u(t, f).mod(f),
                    m = !1,
                    y = c(o, f, t, r);
                  !1 === m;

                )
                  (p = l(h, (n = d(f, y, r)), a, f)),
                    0 ===
                      (m = n
                        .invm(f)
                        .imul(b.add(o.mul(p)))
                        .mod(f)).cmpn(0) && ((m = !1), (p = new s(0)))
                return (function (t, e) {
                  ;(t = t.toArray()),
                    (e = e.toArray()),
                    128 & t[0] && (t = [0].concat(t)),
                    128 & e[0] && (e = [0].concat(e))
                  var r = [48, t.length + e.length + 4, 2, t.length]
                  return (r = r.concat(t, [2, e.length], e)), i.from(r)
                })(p, m)
              })(t, b, r)
            }
            if ('rsa' !== n && 'ecdsa/rsa' !== n) throw new Error('wrong private key type')
            t = i.concat([p, t])
            for (var m = b.modulus.byteLength(), y = [0, 1]; t.length + y.length + 1 < m; ) y.push(255)
            y.push(0)
            for (var g = -1; ++g < t.length; ) y.push(t[g])
            return o(y, b)
          }),
            (t.exports.getKey = c),
            (t.exports.makeKey = d)
        },
        1045: (t, e, r) => {
          var i = r(8467).Buffer,
            n = r(7898),
            o = r(7264).ec,
            a = r(9558),
            s = r(946)
          function f(t, e) {
            if (t.cmpn(0) <= 0) throw new Error('invalid sig')
            if (t.cmp(e) >= e) throw new Error('invalid sig')
          }
          t.exports = function (t, e, r, h, c) {
            var u = a(r)
            if ('ec' === u.type) {
              if ('ecdsa' !== h && 'ecdsa/rsa' !== h) throw new Error('wrong public key type')
              return (function (t, e, r) {
                var i = s[r.data.algorithm.curve.join('.')]
                if (!i) throw new Error('unknown curve ' + r.data.algorithm.curve.join('.'))
                var n = new o(i),
                  a = r.data.subjectPrivateKey.data
                return n.verify(e, t, a)
              })(t, e, u)
            }
            if ('dsa' === u.type) {
              if ('dsa' !== h) throw new Error('wrong public key type')
              return (function (t, e, r) {
                var i = r.data.p,
                  o = r.data.q,
                  s = r.data.g,
                  h = r.data.pub_key,
                  c = a.signature.decode(t, 'der'),
                  u = c.s,
                  d = c.r
                f(u, o), f(d, o)
                var l = n.mont(i),
                  p = u.invm(o)
                return (
                  0 ===
                  s
                    .toRed(l)
                    .redPow(new n(e).mul(p).mod(o))
                    .fromRed()
                    .mul(h.toRed(l).redPow(d.mul(p).mod(o)).fromRed())
                    .mod(i)
                    .mod(o)
                    .cmp(d)
                )
              })(t, e, u)
            }
            if ('rsa' !== h && 'ecdsa/rsa' !== h) throw new Error('wrong public key type')
            e = i.concat([c, e])
            for (var d = u.modulus.byteLength(), l = [1], p = 0; e.length + l.length + 2 < d; ) l.push(255), p++
            l.push(0)
            for (var b = -1; ++b < e.length; ) l.push(e[b])
            l = i.from(l)
            var m = n.mont(u.modulus)
            ;(t = (t = new n(t).toRed(m)).redPow(new n(u.publicExponent))), (t = i.from(t.fromRed().toArray()))
            var y = p < 8 ? 1 : 0
            for (d = Math.min(t.length, l.length), t.length !== l.length && (y = 1), b = -1; ++b < d; ) y |= t[b] ^ l[b]
            return 0 === y
          }
        },
        8277: (t, e, r) => {
          var i = r(692).Buffer
          t.exports = function (t, e) {
            for (var r = Math.min(t.length, e.length), n = new i(r), o = 0; o < r; ++o) n[o] = t[o] ^ e[o]
            return n
          }
        },
        3234: (t) => {
          t.exports = function (t, e) {
            for (var r = Math.min(t.length, e.length), i = 0; i < r; ++i) t[i] = t[i] ^ e[i]
            return t.slice(0, r)
          }
        },
        692: (t, e, r) => {
          'use strict'
          const i = r(6251),
            n = r(7467),
            o =
              'function' == typeof Symbol && 'function' == typeof Symbol.for
                ? Symbol.for('nodejs.util.inspect.custom')
                : null
          ;(e.Buffer = f),
            (e.SlowBuffer = function (t) {
              return +t != t && (t = 0), f.alloc(+t)
            }),
            (e.INSPECT_MAX_BYTES = 50)
          const a = 2147483647
          function s(t) {
            if (t > a) throw new RangeError('The value "' + t + '" is invalid for option "size"')
            const e = new Uint8Array(t)
            return Object.setPrototypeOf(e, f.prototype), e
          }
          function f(t, e, r) {
            if ('number' == typeof t) {
              if ('string' == typeof e)
                throw new TypeError('The "string" argument must be of type string. Received type number')
              return u(t)
            }
            return h(t, e, r)
          }
          function h(t, e, r) {
            if ('string' == typeof t)
              return (function (t, e) {
                if ((('string' == typeof e && '' !== e) || (e = 'utf8'), !f.isEncoding(e)))
                  throw new TypeError('Unknown encoding: ' + e)
                const r = 0 | b(t, e)
                let i = s(r)
                const n = i.write(t, e)
                return n !== r && (i = i.slice(0, n)), i
              })(t, e)
            if (ArrayBuffer.isView(t))
              return (function (t) {
                if (Z(t, Uint8Array)) {
                  const e = new Uint8Array(t)
                  return l(e.buffer, e.byteOffset, e.byteLength)
                }
                return d(t)
              })(t)
            if (null == t)
              throw new TypeError(
                'The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ' +
                  typeof t,
              )
            if (Z(t, ArrayBuffer) || (t && Z(t.buffer, ArrayBuffer))) return l(t, e, r)
            if (
              'undefined' != typeof SharedArrayBuffer &&
              (Z(t, SharedArrayBuffer) || (t && Z(t.buffer, SharedArrayBuffer)))
            )
              return l(t, e, r)
            if ('number' == typeof t)
              throw new TypeError('The "value" argument must not be of type number. Received type number')
            const i = t.valueOf && t.valueOf()
            if (null != i && i !== t) return f.from(i, e, r)
            const n = (function (t) {
              if (f.isBuffer(t)) {
                const e = 0 | p(t.length),
                  r = s(e)
                return 0 === r.length || t.copy(r, 0, 0, e), r
              }
              return void 0 !== t.length
                ? 'number' != typeof t.length || X(t.length)
                  ? s(0)
                  : d(t)
                : 'Buffer' === t.type && Array.isArray(t.data)
                ? d(t.data)
                : void 0
            })(t)
            if (n) return n
            if (
              'undefined' != typeof Symbol &&
              null != Symbol.toPrimitive &&
              'function' == typeof t[Symbol.toPrimitive]
            )
              return f.from(t[Symbol.toPrimitive]('string'), e, r)
            throw new TypeError(
              'The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ' +
                typeof t,
            )
          }
          function c(t) {
            if ('number' != typeof t) throw new TypeError('"size" argument must be of type number')
            if (t < 0) throw new RangeError('The value "' + t + '" is invalid for option "size"')
          }
          function u(t) {
            return c(t), s(t < 0 ? 0 : 0 | p(t))
          }
          function d(t) {
            const e = t.length < 0 ? 0 : 0 | p(t.length),
              r = s(e)
            for (let i = 0; i < e; i += 1) r[i] = 255 & t[i]
            return r
          }
          function l(t, e, r) {
            if (e < 0 || t.byteLength < e) throw new RangeError('"offset" is outside of buffer bounds')
            if (t.byteLength < e + (r || 0)) throw new RangeError('"length" is outside of buffer bounds')
            let i
            return (
              (i =
                void 0 === e && void 0 === r
                  ? new Uint8Array(t)
                  : void 0 === r
                  ? new Uint8Array(t, e)
                  : new Uint8Array(t, e, r)),
              Object.setPrototypeOf(i, f.prototype),
              i
            )
          }
          function p(t) {
            if (t >= a)
              throw new RangeError(
                'Attempt to allocate Buffer larger than maximum size: 0x' + a.toString(16) + ' bytes',
              )
            return 0 | t
          }
          function b(t, e) {
            if (f.isBuffer(t)) return t.length
            if (ArrayBuffer.isView(t) || Z(t, ArrayBuffer)) return t.byteLength
            if ('string' != typeof t)
              throw new TypeError(
                'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof t,
              )
            const r = t.length,
              i = arguments.length > 2 && !0 === arguments[2]
            if (!i && 0 === r) return 0
            let n = !1
            for (;;)
              switch (e) {
                case 'ascii':
                case 'latin1':
                case 'binary':
                  return r
                case 'utf8':
                case 'utf-8':
                  return W(t).length
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return 2 * r
                case 'hex':
                  return r >>> 1
                case 'base64':
                  return Y(t).length
                default:
                  if (n) return i ? -1 : W(t).length
                  ;(e = ('' + e).toLowerCase()), (n = !0)
              }
          }
          function m(t, e, r) {
            let i = !1
            if (((void 0 === e || e < 0) && (e = 0), e > this.length)) return ''
            if (((void 0 === r || r > this.length) && (r = this.length), r <= 0)) return ''
            if ((r >>>= 0) <= (e >>>= 0)) return ''
            for (t || (t = 'utf8'); ; )
              switch (t) {
                case 'hex':
                  return x(this, e, r)
                case 'utf8':
                case 'utf-8':
                  return k(this, e, r)
                case 'ascii':
                  return B(this, e, r)
                case 'latin1':
                case 'binary':
                  return R(this, e, r)
                case 'base64':
                  return A(this, e, r)
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return T(this, e, r)
                default:
                  if (i) throw new TypeError('Unknown encoding: ' + t)
                  ;(t = (t + '').toLowerCase()), (i = !0)
              }
          }
          function y(t, e, r) {
            const i = t[e]
            ;(t[e] = t[r]), (t[r] = i)
          }
          function g(t, e, r, i, n) {
            if (0 === t.length) return -1
            if (
              ('string' == typeof r
                ? ((i = r), (r = 0))
                : r > 2147483647
                ? (r = 2147483647)
                : r < -2147483648 && (r = -2147483648),
              X((r = +r)) && (r = n ? 0 : t.length - 1),
              r < 0 && (r = t.length + r),
              r >= t.length)
            ) {
              if (n) return -1
              r = t.length - 1
            } else if (r < 0) {
              if (!n) return -1
              r = 0
            }
            if (('string' == typeof e && (e = f.from(e, i)), f.isBuffer(e)))
              return 0 === e.length ? -1 : v(t, e, r, i, n)
            if ('number' == typeof e)
              return (
                (e &= 255),
                'function' == typeof Uint8Array.prototype.indexOf
                  ? n
                    ? Uint8Array.prototype.indexOf.call(t, e, r)
                    : Uint8Array.prototype.lastIndexOf.call(t, e, r)
                  : v(t, [e], r, i, n)
              )
            throw new TypeError('val must be string, number or Buffer')
          }
          function v(t, e, r, i, n) {
            let o,
              a = 1,
              s = t.length,
              f = e.length
            if (
              void 0 !== i &&
              ('ucs2' === (i = String(i).toLowerCase()) || 'ucs-2' === i || 'utf16le' === i || 'utf-16le' === i)
            ) {
              if (t.length < 2 || e.length < 2) return -1
              ;(a = 2), (s /= 2), (f /= 2), (r /= 2)
            }
            function h(t, e) {
              return 1 === a ? t[e] : t.readUInt16BE(e * a)
            }
            if (n) {
              let i = -1
              for (o = r; o < s; o++)
                if (h(t, o) === h(e, -1 === i ? 0 : o - i)) {
                  if ((-1 === i && (i = o), o - i + 1 === f)) return i * a
                } else -1 !== i && (o -= o - i), (i = -1)
            } else
              for (r + f > s && (r = s - f), o = r; o >= 0; o--) {
                let r = !0
                for (let i = 0; i < f; i++)
                  if (h(t, o + i) !== h(e, i)) {
                    r = !1
                    break
                  }
                if (r) return o
              }
            return -1
          }
          function _(t, e, r, i) {
            r = Number(r) || 0
            const n = t.length - r
            i ? (i = Number(i)) > n && (i = n) : (i = n)
            const o = e.length
            let a
            for (i > o / 2 && (i = o / 2), a = 0; a < i; ++a) {
              const i = parseInt(e.substr(2 * a, 2), 16)
              if (X(i)) return a
              t[r + a] = i
            }
            return a
          }
          function w(t, e, r, i) {
            return G(W(e, t.length - r), t, r, i)
          }
          function M(t, e, r, i) {
            return G(
              (function (t) {
                const e = []
                for (let r = 0; r < t.length; ++r) e.push(255 & t.charCodeAt(r))
                return e
              })(e),
              t,
              r,
              i,
            )
          }
          function S(t, e, r, i) {
            return G(Y(e), t, r, i)
          }
          function E(t, e, r, i) {
            return G(
              (function (t, e) {
                let r, i, n
                const o = []
                for (let a = 0; a < t.length && !((e -= 2) < 0); ++a)
                  (r = t.charCodeAt(a)), (i = r >> 8), (n = r % 256), o.push(n), o.push(i)
                return o
              })(e, t.length - r),
              t,
              r,
              i,
            )
          }
          function A(t, e, r) {
            return 0 === e && r === t.length ? i.fromByteArray(t) : i.fromByteArray(t.slice(e, r))
          }
          function k(t, e, r) {
            r = Math.min(t.length, r)
            const i = []
            let n = e
            for (; n < r; ) {
              const e = t[n]
              let o = null,
                a = e > 239 ? 4 : e > 223 ? 3 : e > 191 ? 2 : 1
              if (n + a <= r) {
                let r, i, s, f
                switch (a) {
                  case 1:
                    e < 128 && (o = e)
                    break
                  case 2:
                    ;(r = t[n + 1]), 128 == (192 & r) && ((f = ((31 & e) << 6) | (63 & r)), f > 127 && (o = f))
                    break
                  case 3:
                    ;(r = t[n + 1]),
                      (i = t[n + 2]),
                      128 == (192 & r) &&
                        128 == (192 & i) &&
                        ((f = ((15 & e) << 12) | ((63 & r) << 6) | (63 & i)),
                        f > 2047 && (f < 55296 || f > 57343) && (o = f))
                    break
                  case 4:
                    ;(r = t[n + 1]),
                      (i = t[n + 2]),
                      (s = t[n + 3]),
                      128 == (192 & r) &&
                        128 == (192 & i) &&
                        128 == (192 & s) &&
                        ((f = ((15 & e) << 18) | ((63 & r) << 12) | ((63 & i) << 6) | (63 & s)),
                        f > 65535 && f < 1114112 && (o = f))
                }
              }
              null === o
                ? ((o = 65533), (a = 1))
                : o > 65535 && ((o -= 65536), i.push(((o >>> 10) & 1023) | 55296), (o = 56320 | (1023 & o))),
                i.push(o),
                (n += a)
            }
            return (function (t) {
              const e = t.length
              if (e <= I) return String.fromCharCode.apply(String, t)
              let r = '',
                i = 0
              for (; i < e; ) r += String.fromCharCode.apply(String, t.slice(i, (i += I)))
              return r
            })(i)
          }
          ;(e.kMaxLength = a),
            (f.TYPED_ARRAY_SUPPORT = (function () {
              try {
                const t = new Uint8Array(1),
                  e = {
                    foo: function () {
                      return 42
                    },
                  }
                return Object.setPrototypeOf(e, Uint8Array.prototype), Object.setPrototypeOf(t, e), 42 === t.foo()
              } catch (t) {
                return !1
              }
            })()),
            f.TYPED_ARRAY_SUPPORT ||
              'undefined' == typeof console ||
              'function' != typeof console.error ||
              console.error(
                'This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.',
              ),
            Object.defineProperty(f.prototype, 'parent', {
              enumerable: !0,
              get: function () {
                if (f.isBuffer(this)) return this.buffer
              },
            }),
            Object.defineProperty(f.prototype, 'offset', {
              enumerable: !0,
              get: function () {
                if (f.isBuffer(this)) return this.byteOffset
              },
            }),
            (f.poolSize = 8192),
            (f.from = function (t, e, r) {
              return h(t, e, r)
            }),
            Object.setPrototypeOf(f.prototype, Uint8Array.prototype),
            Object.setPrototypeOf(f, Uint8Array),
            (f.alloc = function (t, e, r) {
              return (function (t, e, r) {
                return (
                  c(t), t <= 0 ? s(t) : void 0 !== e ? ('string' == typeof r ? s(t).fill(e, r) : s(t).fill(e)) : s(t)
                )
              })(t, e, r)
            }),
            (f.allocUnsafe = function (t) {
              return u(t)
            }),
            (f.allocUnsafeSlow = function (t) {
              return u(t)
            }),
            (f.isBuffer = function (t) {
              return null != t && !0 === t._isBuffer && t !== f.prototype
            }),
            (f.compare = function (t, e) {
              if (
                (Z(t, Uint8Array) && (t = f.from(t, t.offset, t.byteLength)),
                Z(e, Uint8Array) && (e = f.from(e, e.offset, e.byteLength)),
                !f.isBuffer(t) || !f.isBuffer(e))
              )
                throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array')
              if (t === e) return 0
              let r = t.length,
                i = e.length
              for (let n = 0, o = Math.min(r, i); n < o; ++n)
                if (t[n] !== e[n]) {
                  ;(r = t[n]), (i = e[n])
                  break
                }
              return r < i ? -1 : i < r ? 1 : 0
            }),
            (f.isEncoding = function (t) {
              switch (String(t).toLowerCase()) {
                case 'hex':
                case 'utf8':
                case 'utf-8':
                case 'ascii':
                case 'latin1':
                case 'binary':
                case 'base64':
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return !0
                default:
                  return !1
              }
            }),
            (f.concat = function (t, e) {
              if (!Array.isArray(t)) throw new TypeError('"list" argument must be an Array of Buffers')
              if (0 === t.length) return f.alloc(0)
              let r
              if (void 0 === e) for (e = 0, r = 0; r < t.length; ++r) e += t[r].length
              const i = f.allocUnsafe(e)
              let n = 0
              for (r = 0; r < t.length; ++r) {
                let e = t[r]
                if (Z(e, Uint8Array))
                  n + e.length > i.length
                    ? (f.isBuffer(e) || (e = f.from(e)), e.copy(i, n))
                    : Uint8Array.prototype.set.call(i, e, n)
                else {
                  if (!f.isBuffer(e)) throw new TypeError('"list" argument must be an Array of Buffers')
                  e.copy(i, n)
                }
                n += e.length
              }
              return i
            }),
            (f.byteLength = b),
            (f.prototype._isBuffer = !0),
            (f.prototype.swap16 = function () {
              const t = this.length
              if (t % 2 != 0) throw new RangeError('Buffer size must be a multiple of 16-bits')
              for (let e = 0; e < t; e += 2) y(this, e, e + 1)
              return this
            }),
            (f.prototype.swap32 = function () {
              const t = this.length
              if (t % 4 != 0) throw new RangeError('Buffer size must be a multiple of 32-bits')
              for (let e = 0; e < t; e += 4) y(this, e, e + 3), y(this, e + 1, e + 2)
              return this
            }),
            (f.prototype.swap64 = function () {
              const t = this.length
              if (t % 8 != 0) throw new RangeError('Buffer size must be a multiple of 64-bits')
              for (let e = 0; e < t; e += 8)
                y(this, e, e + 7), y(this, e + 1, e + 6), y(this, e + 2, e + 5), y(this, e + 3, e + 4)
              return this
            }),
            (f.prototype.toString = function () {
              const t = this.length
              return 0 === t ? '' : 0 === arguments.length ? k(this, 0, t) : m.apply(this, arguments)
            }),
            (f.prototype.toLocaleString = f.prototype.toString),
            (f.prototype.equals = function (t) {
              if (!f.isBuffer(t)) throw new TypeError('Argument must be a Buffer')
              return this === t || 0 === f.compare(this, t)
            }),
            (f.prototype.inspect = function () {
              let t = ''
              const r = e.INSPECT_MAX_BYTES
              return (
                (t = this.toString('hex', 0, r)
                  .replace(/(.{2})/g, '$1 ')
                  .trim()),
                this.length > r && (t += ' ... '),
                '<Buffer ' + t + '>'
              )
            }),
            o && (f.prototype[o] = f.prototype.inspect),
            (f.prototype.compare = function (t, e, r, i, n) {
              if ((Z(t, Uint8Array) && (t = f.from(t, t.offset, t.byteLength)), !f.isBuffer(t)))
                throw new TypeError(
                  'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof t,
                )
              if (
                (void 0 === e && (e = 0),
                void 0 === r && (r = t ? t.length : 0),
                void 0 === i && (i = 0),
                void 0 === n && (n = this.length),
                e < 0 || r > t.length || i < 0 || n > this.length)
              )
                throw new RangeError('out of range index')
              if (i >= n && e >= r) return 0
              if (i >= n) return -1
              if (e >= r) return 1
              if (this === t) return 0
              let o = (n >>>= 0) - (i >>>= 0),
                a = (r >>>= 0) - (e >>>= 0)
              const s = Math.min(o, a),
                h = this.slice(i, n),
                c = t.slice(e, r)
              for (let t = 0; t < s; ++t)
                if (h[t] !== c[t]) {
                  ;(o = h[t]), (a = c[t])
                  break
                }
              return o < a ? -1 : a < o ? 1 : 0
            }),
            (f.prototype.includes = function (t, e, r) {
              return -1 !== this.indexOf(t, e, r)
            }),
            (f.prototype.indexOf = function (t, e, r) {
              return g(this, t, e, r, !0)
            }),
            (f.prototype.lastIndexOf = function (t, e, r) {
              return g(this, t, e, r, !1)
            }),
            (f.prototype.write = function (t, e, r, i) {
              if (void 0 === e) (i = 'utf8'), (r = this.length), (e = 0)
              else if (void 0 === r && 'string' == typeof e) (i = e), (r = this.length), (e = 0)
              else {
                if (!isFinite(e))
                  throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported')
                ;(e >>>= 0), isFinite(r) ? ((r >>>= 0), void 0 === i && (i = 'utf8')) : ((i = r), (r = void 0))
              }
              const n = this.length - e
              if (((void 0 === r || r > n) && (r = n), (t.length > 0 && (r < 0 || e < 0)) || e > this.length))
                throw new RangeError('Attempt to write outside buffer bounds')
              i || (i = 'utf8')
              let o = !1
              for (;;)
                switch (i) {
                  case 'hex':
                    return _(this, t, e, r)
                  case 'utf8':
                  case 'utf-8':
                    return w(this, t, e, r)
                  case 'ascii':
                  case 'latin1':
                  case 'binary':
                    return M(this, t, e, r)
                  case 'base64':
                    return S(this, t, e, r)
                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                    return E(this, t, e, r)
                  default:
                    if (o) throw new TypeError('Unknown encoding: ' + i)
                    ;(i = ('' + i).toLowerCase()), (o = !0)
                }
            }),
            (f.prototype.toJSON = function () {
              return { type: 'Buffer', data: Array.prototype.slice.call(this._arr || this, 0) }
            })
          const I = 4096
          function B(t, e, r) {
            let i = ''
            r = Math.min(t.length, r)
            for (let n = e; n < r; ++n) i += String.fromCharCode(127 & t[n])
            return i
          }
          function R(t, e, r) {
            let i = ''
            r = Math.min(t.length, r)
            for (let n = e; n < r; ++n) i += String.fromCharCode(t[n])
            return i
          }
          function x(t, e, r) {
            const i = t.length
            ;(!e || e < 0) && (e = 0), (!r || r < 0 || r > i) && (r = i)
            let n = ''
            for (let i = e; i < r; ++i) n += $[t[i]]
            return n
          }
          function T(t, e, r) {
            const i = t.slice(e, r)
            let n = ''
            for (let t = 0; t < i.length - 1; t += 2) n += String.fromCharCode(i[t] + 256 * i[t + 1])
            return n
          }
          function L(t, e, r) {
            if (t % 1 != 0 || t < 0) throw new RangeError('offset is not uint')
            if (t + e > r) throw new RangeError('Trying to access beyond buffer length')
          }
          function C(t, e, r, i, n, o) {
            if (!f.isBuffer(t)) throw new TypeError('"buffer" argument must be a Buffer instance')
            if (e > n || e < o) throw new RangeError('"value" argument is out of bounds')
            if (r + i > t.length) throw new RangeError('Index out of range')
          }
          function P(t, e, r, i, n) {
            K(e, i, n, t, r, 7)
            let o = Number(e & BigInt(4294967295))
            ;(t[r++] = o), (o >>= 8), (t[r++] = o), (o >>= 8), (t[r++] = o), (o >>= 8), (t[r++] = o)
            let a = Number((e >> BigInt(32)) & BigInt(4294967295))
            return (t[r++] = a), (a >>= 8), (t[r++] = a), (a >>= 8), (t[r++] = a), (a >>= 8), (t[r++] = a), r
          }
          function O(t, e, r, i, n) {
            K(e, i, n, t, r, 7)
            let o = Number(e & BigInt(4294967295))
            ;(t[r + 7] = o), (o >>= 8), (t[r + 6] = o), (o >>= 8), (t[r + 5] = o), (o >>= 8), (t[r + 4] = o)
            let a = Number((e >> BigInt(32)) & BigInt(4294967295))
            return (t[r + 3] = a), (a >>= 8), (t[r + 2] = a), (a >>= 8), (t[r + 1] = a), (a >>= 8), (t[r] = a), r + 8
          }
          function N(t, e, r, i, n, o) {
            if (r + i > t.length) throw new RangeError('Index out of range')
            if (r < 0) throw new RangeError('Index out of range')
          }
          function U(t, e, r, i, o) {
            return (e = +e), (r >>>= 0), o || N(t, 0, r, 4), n.write(t, e, r, i, 23, 4), r + 4
          }
          function D(t, e, r, i, o) {
            return (e = +e), (r >>>= 0), o || N(t, 0, r, 8), n.write(t, e, r, i, 52, 8), r + 8
          }
          ;(f.prototype.slice = function (t, e) {
            const r = this.length
            ;(t = ~~t) < 0 ? (t += r) < 0 && (t = 0) : t > r && (t = r),
              (e = void 0 === e ? r : ~~e) < 0 ? (e += r) < 0 && (e = 0) : e > r && (e = r),
              e < t && (e = t)
            const i = this.subarray(t, e)
            return Object.setPrototypeOf(i, f.prototype), i
          }),
            (f.prototype.readUintLE = f.prototype.readUIntLE =
              function (t, e, r) {
                ;(t >>>= 0), (e >>>= 0), r || L(t, e, this.length)
                let i = this[t],
                  n = 1,
                  o = 0
                for (; ++o < e && (n *= 256); ) i += this[t + o] * n
                return i
              }),
            (f.prototype.readUintBE = f.prototype.readUIntBE =
              function (t, e, r) {
                ;(t >>>= 0), (e >>>= 0), r || L(t, e, this.length)
                let i = this[t + --e],
                  n = 1
                for (; e > 0 && (n *= 256); ) i += this[t + --e] * n
                return i
              }),
            (f.prototype.readUint8 = f.prototype.readUInt8 =
              function (t, e) {
                return (t >>>= 0), e || L(t, 1, this.length), this[t]
              }),
            (f.prototype.readUint16LE = f.prototype.readUInt16LE =
              function (t, e) {
                return (t >>>= 0), e || L(t, 2, this.length), this[t] | (this[t + 1] << 8)
              }),
            (f.prototype.readUint16BE = f.prototype.readUInt16BE =
              function (t, e) {
                return (t >>>= 0), e || L(t, 2, this.length), (this[t] << 8) | this[t + 1]
              }),
            (f.prototype.readUint32LE = f.prototype.readUInt32LE =
              function (t, e) {
                return (
                  (t >>>= 0),
                  e || L(t, 4, this.length),
                  (this[t] | (this[t + 1] << 8) | (this[t + 2] << 16)) + 16777216 * this[t + 3]
                )
              }),
            (f.prototype.readUint32BE = f.prototype.readUInt32BE =
              function (t, e) {
                return (
                  (t >>>= 0),
                  e || L(t, 4, this.length),
                  16777216 * this[t] + ((this[t + 1] << 16) | (this[t + 2] << 8) | this[t + 3])
                )
              }),
            (f.prototype.readBigUInt64LE = J(function (t) {
              F((t >>>= 0), 'offset')
              const e = this[t],
                r = this[t + 7]
              ;(void 0 !== e && void 0 !== r) || H(t, this.length - 8)
              const i = e + 256 * this[++t] + 65536 * this[++t] + this[++t] * 2 ** 24,
                n = this[++t] + 256 * this[++t] + 65536 * this[++t] + r * 2 ** 24
              return BigInt(i) + (BigInt(n) << BigInt(32))
            })),
            (f.prototype.readBigUInt64BE = J(function (t) {
              F((t >>>= 0), 'offset')
              const e = this[t],
                r = this[t + 7]
              ;(void 0 !== e && void 0 !== r) || H(t, this.length - 8)
              const i = e * 2 ** 24 + 65536 * this[++t] + 256 * this[++t] + this[++t],
                n = this[++t] * 2 ** 24 + 65536 * this[++t] + 256 * this[++t] + r
              return (BigInt(i) << BigInt(32)) + BigInt(n)
            })),
            (f.prototype.readIntLE = function (t, e, r) {
              ;(t >>>= 0), (e >>>= 0), r || L(t, e, this.length)
              let i = this[t],
                n = 1,
                o = 0
              for (; ++o < e && (n *= 256); ) i += this[t + o] * n
              return (n *= 128), i >= n && (i -= Math.pow(2, 8 * e)), i
            }),
            (f.prototype.readIntBE = function (t, e, r) {
              ;(t >>>= 0), (e >>>= 0), r || L(t, e, this.length)
              let i = e,
                n = 1,
                o = this[t + --i]
              for (; i > 0 && (n *= 256); ) o += this[t + --i] * n
              return (n *= 128), o >= n && (o -= Math.pow(2, 8 * e)), o
            }),
            (f.prototype.readInt8 = function (t, e) {
              return (t >>>= 0), e || L(t, 1, this.length), 128 & this[t] ? -1 * (255 - this[t] + 1) : this[t]
            }),
            (f.prototype.readInt16LE = function (t, e) {
              ;(t >>>= 0), e || L(t, 2, this.length)
              const r = this[t] | (this[t + 1] << 8)
              return 32768 & r ? 4294901760 | r : r
            }),
            (f.prototype.readInt16BE = function (t, e) {
              ;(t >>>= 0), e || L(t, 2, this.length)
              const r = this[t + 1] | (this[t] << 8)
              return 32768 & r ? 4294901760 | r : r
            }),
            (f.prototype.readInt32LE = function (t, e) {
              return (
                (t >>>= 0),
                e || L(t, 4, this.length),
                this[t] | (this[t + 1] << 8) | (this[t + 2] << 16) | (this[t + 3] << 24)
              )
            }),
            (f.prototype.readInt32BE = function (t, e) {
              return (
                (t >>>= 0),
                e || L(t, 4, this.length),
                (this[t] << 24) | (this[t + 1] << 16) | (this[t + 2] << 8) | this[t + 3]
              )
            }),
            (f.prototype.readBigInt64LE = J(function (t) {
              F((t >>>= 0), 'offset')
              const e = this[t],
                r = this[t + 7]
              ;(void 0 !== e && void 0 !== r) || H(t, this.length - 8)
              const i = this[t + 4] + 256 * this[t + 5] + 65536 * this[t + 6] + (r << 24)
              return (BigInt(i) << BigInt(32)) + BigInt(e + 256 * this[++t] + 65536 * this[++t] + this[++t] * 2 ** 24)
            })),
            (f.prototype.readBigInt64BE = J(function (t) {
              F((t >>>= 0), 'offset')
              const e = this[t],
                r = this[t + 7]
              ;(void 0 !== e && void 0 !== r) || H(t, this.length - 8)
              const i = (e << 24) + 65536 * this[++t] + 256 * this[++t] + this[++t]
              return (BigInt(i) << BigInt(32)) + BigInt(this[++t] * 2 ** 24 + 65536 * this[++t] + 256 * this[++t] + r)
            })),
            (f.prototype.readFloatLE = function (t, e) {
              return (t >>>= 0), e || L(t, 4, this.length), n.read(this, t, !0, 23, 4)
            }),
            (f.prototype.readFloatBE = function (t, e) {
              return (t >>>= 0), e || L(t, 4, this.length), n.read(this, t, !1, 23, 4)
            }),
            (f.prototype.readDoubleLE = function (t, e) {
              return (t >>>= 0), e || L(t, 8, this.length), n.read(this, t, !0, 52, 8)
            }),
            (f.prototype.readDoubleBE = function (t, e) {
              return (t >>>= 0), e || L(t, 8, this.length), n.read(this, t, !1, 52, 8)
            }),
            (f.prototype.writeUintLE = f.prototype.writeUIntLE =
              function (t, e, r, i) {
                ;(t = +t), (e >>>= 0), (r >>>= 0), i || C(this, t, e, r, Math.pow(2, 8 * r) - 1, 0)
                let n = 1,
                  o = 0
                for (this[e] = 255 & t; ++o < r && (n *= 256); ) this[e + o] = (t / n) & 255
                return e + r
              }),
            (f.prototype.writeUintBE = f.prototype.writeUIntBE =
              function (t, e, r, i) {
                ;(t = +t), (e >>>= 0), (r >>>= 0), i || C(this, t, e, r, Math.pow(2, 8 * r) - 1, 0)
                let n = r - 1,
                  o = 1
                for (this[e + n] = 255 & t; --n >= 0 && (o *= 256); ) this[e + n] = (t / o) & 255
                return e + r
              }),
            (f.prototype.writeUint8 = f.prototype.writeUInt8 =
              function (t, e, r) {
                return (t = +t), (e >>>= 0), r || C(this, t, e, 1, 255, 0), (this[e] = 255 & t), e + 1
              }),
            (f.prototype.writeUint16LE = f.prototype.writeUInt16LE =
              function (t, e, r) {
                return (
                  (t = +t),
                  (e >>>= 0),
                  r || C(this, t, e, 2, 65535, 0),
                  (this[e] = 255 & t),
                  (this[e + 1] = t >>> 8),
                  e + 2
                )
              }),
            (f.prototype.writeUint16BE = f.prototype.writeUInt16BE =
              function (t, e, r) {
                return (
                  (t = +t),
                  (e >>>= 0),
                  r || C(this, t, e, 2, 65535, 0),
                  (this[e] = t >>> 8),
                  (this[e + 1] = 255 & t),
                  e + 2
                )
              }),
            (f.prototype.writeUint32LE = f.prototype.writeUInt32LE =
              function (t, e, r) {
                return (
                  (t = +t),
                  (e >>>= 0),
                  r || C(this, t, e, 4, 4294967295, 0),
                  (this[e + 3] = t >>> 24),
                  (this[e + 2] = t >>> 16),
                  (this[e + 1] = t >>> 8),
                  (this[e] = 255 & t),
                  e + 4
                )
              }),
            (f.prototype.writeUint32BE = f.prototype.writeUInt32BE =
              function (t, e, r) {
                return (
                  (t = +t),
                  (e >>>= 0),
                  r || C(this, t, e, 4, 4294967295, 0),
                  (this[e] = t >>> 24),
                  (this[e + 1] = t >>> 16),
                  (this[e + 2] = t >>> 8),
                  (this[e + 3] = 255 & t),
                  e + 4
                )
              }),
            (f.prototype.writeBigUInt64LE = J(function (t, e = 0) {
              return P(this, t, e, BigInt(0), BigInt('0xffffffffffffffff'))
            })),
            (f.prototype.writeBigUInt64BE = J(function (t, e = 0) {
              return O(this, t, e, BigInt(0), BigInt('0xffffffffffffffff'))
            })),
            (f.prototype.writeIntLE = function (t, e, r, i) {
              if (((t = +t), (e >>>= 0), !i)) {
                const i = Math.pow(2, 8 * r - 1)
                C(this, t, e, r, i - 1, -i)
              }
              let n = 0,
                o = 1,
                a = 0
              for (this[e] = 255 & t; ++n < r && (o *= 256); )
                t < 0 && 0 === a && 0 !== this[e + n - 1] && (a = 1), (this[e + n] = (((t / o) >> 0) - a) & 255)
              return e + r
            }),
            (f.prototype.writeIntBE = function (t, e, r, i) {
              if (((t = +t), (e >>>= 0), !i)) {
                const i = Math.pow(2, 8 * r - 1)
                C(this, t, e, r, i - 1, -i)
              }
              let n = r - 1,
                o = 1,
                a = 0
              for (this[e + n] = 255 & t; --n >= 0 && (o *= 256); )
                t < 0 && 0 === a && 0 !== this[e + n + 1] && (a = 1), (this[e + n] = (((t / o) >> 0) - a) & 255)
              return e + r
            }),
            (f.prototype.writeInt8 = function (t, e, r) {
              return (
                (t = +t),
                (e >>>= 0),
                r || C(this, t, e, 1, 127, -128),
                t < 0 && (t = 255 + t + 1),
                (this[e] = 255 & t),
                e + 1
              )
            }),
            (f.prototype.writeInt16LE = function (t, e, r) {
              return (
                (t = +t),
                (e >>>= 0),
                r || C(this, t, e, 2, 32767, -32768),
                (this[e] = 255 & t),
                (this[e + 1] = t >>> 8),
                e + 2
              )
            }),
            (f.prototype.writeInt16BE = function (t, e, r) {
              return (
                (t = +t),
                (e >>>= 0),
                r || C(this, t, e, 2, 32767, -32768),
                (this[e] = t >>> 8),
                (this[e + 1] = 255 & t),
                e + 2
              )
            }),
            (f.prototype.writeInt32LE = function (t, e, r) {
              return (
                (t = +t),
                (e >>>= 0),
                r || C(this, t, e, 4, 2147483647, -2147483648),
                (this[e] = 255 & t),
                (this[e + 1] = t >>> 8),
                (this[e + 2] = t >>> 16),
                (this[e + 3] = t >>> 24),
                e + 4
              )
            }),
            (f.prototype.writeInt32BE = function (t, e, r) {
              return (
                (t = +t),
                (e >>>= 0),
                r || C(this, t, e, 4, 2147483647, -2147483648),
                t < 0 && (t = 4294967295 + t + 1),
                (this[e] = t >>> 24),
                (this[e + 1] = t >>> 16),
                (this[e + 2] = t >>> 8),
                (this[e + 3] = 255 & t),
                e + 4
              )
            }),
            (f.prototype.writeBigInt64LE = J(function (t, e = 0) {
              return P(this, t, e, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
            })),
            (f.prototype.writeBigInt64BE = J(function (t, e = 0) {
              return O(this, t, e, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
            })),
            (f.prototype.writeFloatLE = function (t, e, r) {
              return U(this, t, e, !0, r)
            }),
            (f.prototype.writeFloatBE = function (t, e, r) {
              return U(this, t, e, !1, r)
            }),
            (f.prototype.writeDoubleLE = function (t, e, r) {
              return D(this, t, e, !0, r)
            }),
            (f.prototype.writeDoubleBE = function (t, e, r) {
              return D(this, t, e, !1, r)
            }),
            (f.prototype.copy = function (t, e, r, i) {
              if (!f.isBuffer(t)) throw new TypeError('argument should be a Buffer')
              if (
                (r || (r = 0),
                i || 0 === i || (i = this.length),
                e >= t.length && (e = t.length),
                e || (e = 0),
                i > 0 && i < r && (i = r),
                i === r)
              )
                return 0
              if (0 === t.length || 0 === this.length) return 0
              if (e < 0) throw new RangeError('targetStart out of bounds')
              if (r < 0 || r >= this.length) throw new RangeError('Index out of range')
              if (i < 0) throw new RangeError('sourceEnd out of bounds')
              i > this.length && (i = this.length), t.length - e < i - r && (i = t.length - e + r)
              const n = i - r
              return (
                this === t && 'function' == typeof Uint8Array.prototype.copyWithin
                  ? this.copyWithin(e, r, i)
                  : Uint8Array.prototype.set.call(t, this.subarray(r, i), e),
                n
              )
            }),
            (f.prototype.fill = function (t, e, r, i) {
              if ('string' == typeof t) {
                if (
                  ('string' == typeof e
                    ? ((i = e), (e = 0), (r = this.length))
                    : 'string' == typeof r && ((i = r), (r = this.length)),
                  void 0 !== i && 'string' != typeof i)
                )
                  throw new TypeError('encoding must be a string')
                if ('string' == typeof i && !f.isEncoding(i)) throw new TypeError('Unknown encoding: ' + i)
                if (1 === t.length) {
                  const e = t.charCodeAt(0)
                  ;(('utf8' === i && e < 128) || 'latin1' === i) && (t = e)
                }
              } else 'number' == typeof t ? (t &= 255) : 'boolean' == typeof t && (t = Number(t))
              if (e < 0 || this.length < e || this.length < r) throw new RangeError('Out of range index')
              if (r <= e) return this
              let n
              if (((e >>>= 0), (r = void 0 === r ? this.length : r >>> 0), t || (t = 0), 'number' == typeof t))
                for (n = e; n < r; ++n) this[n] = t
              else {
                const o = f.isBuffer(t) ? t : f.from(t, i),
                  a = o.length
                if (0 === a) throw new TypeError('The value "' + t + '" is invalid for argument "value"')
                for (n = 0; n < r - e; ++n) this[n + e] = o[n % a]
              }
              return this
            })
          const j = {}
          function q(t, e, r) {
            j[t] = class extends r {
              constructor() {
                super(),
                  Object.defineProperty(this, 'message', {
                    value: e.apply(this, arguments),
                    writable: !0,
                    configurable: !0,
                  }),
                  (this.name = `${this.name} [${t}]`),
                  this.stack,
                  delete this.name
              }
              get code() {
                return t
              }
              set code(t) {
                Object.defineProperty(this, 'code', { configurable: !0, enumerable: !0, value: t, writable: !0 })
              }
              toString() {
                return `${this.name} [${t}]: ${this.message}`
              }
            }
          }
          function z(t) {
            let e = '',
              r = t.length
            const i = '-' === t[0] ? 1 : 0
            for (; r >= i + 4; r -= 3) e = `_${t.slice(r - 3, r)}${e}`
            return `${t.slice(0, r)}${e}`
          }
          function K(t, e, r, i, n, o) {
            if (t > r || t < e) {
              const i = 'bigint' == typeof e ? 'n' : ''
              let n
              throw (
                ((n =
                  o > 3
                    ? 0 === e || e === BigInt(0)
                      ? `>= 0${i} and < 2${i} ** ${8 * (o + 1)}${i}`
                      : `>= -(2${i} ** ${8 * (o + 1) - 1}${i}) and < 2 ** ${8 * (o + 1) - 1}${i}`
                    : `>= ${e}${i} and <= ${r}${i}`),
                new j.ERR_OUT_OF_RANGE('value', n, t))
              )
            }
            !(function (t, e, r) {
              F(e, 'offset'), (void 0 !== t[e] && void 0 !== t[e + r]) || H(e, t.length - (r + 1))
            })(i, n, o)
          }
          function F(t, e) {
            if ('number' != typeof t) throw new j.ERR_INVALID_ARG_TYPE(e, 'number', t)
          }
          function H(t, e, r) {
            if (Math.floor(t) !== t) throw (F(t, r), new j.ERR_OUT_OF_RANGE(r || 'offset', 'an integer', t))
            if (e < 0) throw new j.ERR_BUFFER_OUT_OF_BOUNDS()
            throw new j.ERR_OUT_OF_RANGE(r || 'offset', `>= ${r ? 1 : 0} and <= ${e}`, t)
          }
          q(
            'ERR_BUFFER_OUT_OF_BOUNDS',
            function (t) {
              return t ? `${t} is outside of buffer bounds` : 'Attempt to access memory outside buffer bounds'
            },
            RangeError,
          ),
            q(
              'ERR_INVALID_ARG_TYPE',
              function (t, e) {
                return `The "${t}" argument must be of type number. Received type ${typeof e}`
              },
              TypeError,
            ),
            q(
              'ERR_OUT_OF_RANGE',
              function (t, e, r) {
                let i = `The value of "${t}" is out of range.`,
                  n = r
                return (
                  Number.isInteger(r) && Math.abs(r) > 2 ** 32
                    ? (n = z(String(r)))
                    : 'bigint' == typeof r &&
                      ((n = String(r)),
                      (r > BigInt(2) ** BigInt(32) || r < -(BigInt(2) ** BigInt(32))) && (n = z(n)),
                      (n += 'n')),
                  (i += ` It must be ${e}. Received ${n}`),
                  i
                )
              },
              RangeError,
            )
          const V = /[^+/0-9A-Za-z-_]/g
          function W(t, e) {
            let r
            e = e || 1 / 0
            const i = t.length
            let n = null
            const o = []
            for (let a = 0; a < i; ++a) {
              if (((r = t.charCodeAt(a)), r > 55295 && r < 57344)) {
                if (!n) {
                  if (r > 56319) {
                    ;(e -= 3) > -1 && o.push(239, 191, 189)
                    continue
                  }
                  if (a + 1 === i) {
                    ;(e -= 3) > -1 && o.push(239, 191, 189)
                    continue
                  }
                  n = r
                  continue
                }
                if (r < 56320) {
                  ;(e -= 3) > -1 && o.push(239, 191, 189), (n = r)
                  continue
                }
                r = 65536 + (((n - 55296) << 10) | (r - 56320))
              } else n && (e -= 3) > -1 && o.push(239, 191, 189)
              if (((n = null), r < 128)) {
                if ((e -= 1) < 0) break
                o.push(r)
              } else if (r < 2048) {
                if ((e -= 2) < 0) break
                o.push((r >> 6) | 192, (63 & r) | 128)
              } else if (r < 65536) {
                if ((e -= 3) < 0) break
                o.push((r >> 12) | 224, ((r >> 6) & 63) | 128, (63 & r) | 128)
              } else {
                if (!(r < 1114112)) throw new Error('Invalid code point')
                if ((e -= 4) < 0) break
                o.push((r >> 18) | 240, ((r >> 12) & 63) | 128, ((r >> 6) & 63) | 128, (63 & r) | 128)
              }
            }
            return o
          }
          function Y(t) {
            return i.toByteArray(
              (function (t) {
                if ((t = (t = t.split('=')[0]).trim().replace(V, '')).length < 2) return ''
                for (; t.length % 4 != 0; ) t += '='
                return t
              })(t),
            )
          }
          function G(t, e, r, i) {
            let n
            for (n = 0; n < i && !(n + r >= e.length || n >= t.length); ++n) e[n + r] = t[n]
            return n
          }
          function Z(t, e) {
            return (
              t instanceof e ||
              (null != t && null != t.constructor && null != t.constructor.name && t.constructor.name === e.name)
            )
          }
          function X(t) {
            return t != t
          }
          const $ = (function () {
            const t = '0123456789abcdef',
              e = new Array(256)
            for (let r = 0; r < 16; ++r) {
              const i = 16 * r
              for (let n = 0; n < 16; ++n) e[i + n] = t[r] + t[n]
            }
            return e
          })()
          function J(t) {
            return 'undefined' == typeof BigInt ? Q : t
          }
          function Q() {
            throw new Error('BigInt not supported')
          }
        },
        6207: (t, e, r) => {
          var i = r(8467).Buffer,
            n = r(1859).Transform,
            o = r(8154).s
          function a(t) {
            n.call(this),
              (this.hashMode = 'string' == typeof t),
              this.hashMode ? (this[t] = this._finalOrDigest) : (this.final = this._finalOrDigest),
              this._final && ((this.__final = this._final), (this._final = null)),
              (this._decoder = null),
              (this._encoding = null)
          }
          r(4603)(a, n),
            (a.prototype.update = function (t, e, r) {
              'string' == typeof t && (t = i.from(t, e))
              var n = this._update(t)
              return this.hashMode ? this : (r && (n = this._toString(n, r)), n)
            }),
            (a.prototype.setAutoPadding = function () {}),
            (a.prototype.getAuthTag = function () {
              throw new Error('trying to get auth tag in unsupported state')
            }),
            (a.prototype.setAuthTag = function () {
              throw new Error('trying to set auth tag in unsupported state')
            }),
            (a.prototype.setAAD = function () {
              throw new Error('trying to set aad in unsupported state')
            }),
            (a.prototype._transform = function (t, e, r) {
              var i
              try {
                this.hashMode ? this._update(t) : this.push(this._update(t))
              } catch (t) {
                i = t
              } finally {
                r(i)
              }
            }),
            (a.prototype._flush = function (t) {
              var e
              try {
                this.push(this.__final())
              } catch (t) {
                e = t
              }
              t(e)
            }),
            (a.prototype._finalOrDigest = function (t) {
              var e = this.__final() || i.alloc(0)
              return t && (e = this._toString(e, t, !0)), e
            }),
            (a.prototype._toString = function (t, e, r) {
              if ((this._decoder || ((this._decoder = new o(e)), (this._encoding = e)), this._encoding !== e))
                throw new Error("can't switch encodings")
              var i = this._decoder.write(t)
              return r && (i += this._decoder.end()), i
            }),
            (t.exports = a)
        },
        3590: (t, e, r) => {
          var i = r(692).Buffer,
            n = r(7264),
            o = r(5612)
          t.exports = function (t) {
            return new s(t)
          }
          var a = {
            secp256k1: { name: 'secp256k1', byteLength: 32 },
            secp224r1: { name: 'p224', byteLength: 28 },
            prime256v1: { name: 'p256', byteLength: 32 },
            prime192v1: { name: 'p192', byteLength: 24 },
            ed25519: { name: 'ed25519', byteLength: 32 },
            secp384r1: { name: 'p384', byteLength: 48 },
            secp521r1: { name: 'p521', byteLength: 66 },
          }
          function s(t) {
            ;(this.curveType = a[t]),
              this.curveType || (this.curveType = { name: t }),
              (this.curve = new n.ec(this.curveType.name)),
              (this.keys = void 0)
          }
          function f(t, e, r) {
            Array.isArray(t) || (t = t.toArray())
            var n = new i(t)
            if (r && n.length < r) {
              var o = new i(r - n.length)
              o.fill(0), (n = i.concat([o, n]))
            }
            return e ? n.toString(e) : n
          }
          ;(a.p224 = a.secp224r1),
            (a.p256 = a.secp256r1 = a.prime256v1),
            (a.p192 = a.secp192r1 = a.prime192v1),
            (a.p384 = a.secp384r1),
            (a.p521 = a.secp521r1),
            (s.prototype.generateKeys = function (t, e) {
              return (this.keys = this.curve.genKeyPair()), this.getPublicKey(t, e)
            }),
            (s.prototype.computeSecret = function (t, e, r) {
              return (
                (e = e || 'utf8'),
                i.isBuffer(t) || (t = new i(t, e)),
                f(
                  this.curve.keyFromPublic(t).getPublic().mul(this.keys.getPrivate()).getX(),
                  r,
                  this.curveType.byteLength,
                )
              )
            }),
            (s.prototype.getPublicKey = function (t, e) {
              var r = this.keys.getPublic('compressed' === e, !0)
              return 'hybrid' === e && (r[r.length - 1] % 2 ? (r[0] = 7) : (r[0] = 6)), f(r, t)
            }),
            (s.prototype.getPrivateKey = function (t) {
              return f(this.keys.getPrivate(), t)
            }),
            (s.prototype.setPublicKey = function (t, e) {
              return (e = e || 'utf8'), i.isBuffer(t) || (t = new i(t, e)), this.keys._importPublic(t), this
            }),
            (s.prototype.setPrivateKey = function (t, e) {
              ;(e = e || 'utf8'), i.isBuffer(t) || (t = new i(t, e))
              var r = new o(t)
              return (r = r.toString(16)), (this.keys = this.curve.genKeyPair()), this.keys._importPrivate(r), this
            })
        },
        3987: (t, e, r) => {
          'use strict'
          var i = r(4603),
            n = r(2108),
            o = r(2997),
            a = r(8927),
            s = r(6207)
          function f(t) {
            s.call(this, 'digest'), (this._hash = t)
          }
          i(f, s),
            (f.prototype._update = function (t) {
              this._hash.update(t)
            }),
            (f.prototype._final = function () {
              return this._hash.digest()
            }),
            (t.exports = function (t) {
              return 'md5' === (t = t.toLowerCase())
                ? new n()
                : 'rmd160' === t || 'ripemd160' === t
                ? new o()
                : new f(a(t))
            })
        },
        5298: (t, e, r) => {
          var i = r(2108)
          t.exports = function (t) {
            return new i().update(t).digest()
          }
        },
        384: (t, e, r) => {
          'use strict'
          var i = r(4603),
            n = r(3980),
            o = r(6207),
            a = r(8467).Buffer,
            s = r(5298),
            f = r(2997),
            h = r(8927),
            c = a.alloc(128)
          function u(t, e) {
            o.call(this, 'digest'), 'string' == typeof e && (e = a.from(e))
            var r = 'sha512' === t || 'sha384' === t ? 128 : 64
            ;(this._alg = t),
              (this._key = e),
              e.length > r
                ? (e = ('rmd160' === t ? new f() : h(t)).update(e).digest())
                : e.length < r && (e = a.concat([e, c], r))
            for (var i = (this._ipad = a.allocUnsafe(r)), n = (this._opad = a.allocUnsafe(r)), s = 0; s < r; s++)
              (i[s] = 54 ^ e[s]), (n[s] = 92 ^ e[s])
            ;(this._hash = 'rmd160' === t ? new f() : h(t)), this._hash.update(i)
          }
          i(u, o),
            (u.prototype._update = function (t) {
              this._hash.update(t)
            }),
            (u.prototype._final = function () {
              var t = this._hash.digest()
              return ('rmd160' === this._alg ? new f() : h(this._alg)).update(this._opad).update(t).digest()
            }),
            (t.exports = function (t, e) {
              return 'rmd160' === (t = t.toLowerCase()) || 'ripemd160' === t
                ? new u('rmd160', e)
                : 'md5' === t
                ? new n(s, e)
                : new u(t, e)
            })
        },
        3980: (t, e, r) => {
          'use strict'
          var i = r(4603),
            n = r(8467).Buffer,
            o = r(6207),
            a = n.alloc(128),
            s = 64
          function f(t, e) {
            o.call(this, 'digest'),
              'string' == typeof e && (e = n.from(e)),
              (this._alg = t),
              (this._key = e),
              e.length > s ? (e = t(e)) : e.length < s && (e = n.concat([e, a], s))
            for (var r = (this._ipad = n.allocUnsafe(s)), i = (this._opad = n.allocUnsafe(s)), f = 0; f < s; f++)
              (r[f] = 54 ^ e[f]), (i[f] = 92 ^ e[f])
            this._hash = [r]
          }
          i(f, o),
            (f.prototype._update = function (t) {
              this._hash.push(t)
            }),
            (f.prototype._final = function () {
              var t = this._alg(n.concat(this._hash))
              return this._alg(n.concat([this._opad, t]))
            }),
            (t.exports = f)
        },
        2498: (t, e, r) => {
          'use strict'
          ;(e.randomBytes = e.rng = e.pseudoRandomBytes = e.prng = r(8244)),
            (e.createHash = e.Hash = r(3987)),
            (e.createHmac = e.Hmac = r(384))
          var i = r(5886),
            n = Object.keys(i),
            o = ['sha1', 'sha224', 'sha256', 'sha384', 'sha512', 'md5', 'rmd160'].concat(n)
          e.getHashes = function () {
            return o
          }
          var a = r(2769)
          ;(e.pbkdf2 = a.pbkdf2), (e.pbkdf2Sync = a.pbkdf2Sync)
          var s = r(7383)
          ;(e.Cipher = s.Cipher),
            (e.createCipher = s.createCipher),
            (e.Cipheriv = s.Cipheriv),
            (e.createCipheriv = s.createCipheriv),
            (e.Decipher = s.Decipher),
            (e.createDecipher = s.createDecipher),
            (e.Decipheriv = s.Decipheriv),
            (e.createDecipheriv = s.createDecipheriv),
            (e.getCiphers = s.getCiphers),
            (e.listCiphers = s.listCiphers)
          var f = r(9402)
          ;(e.DiffieHellmanGroup = f.DiffieHellmanGroup),
            (e.createDiffieHellmanGroup = f.createDiffieHellmanGroup),
            (e.getDiffieHellman = f.getDiffieHellman),
            (e.createDiffieHellman = f.createDiffieHellman),
            (e.DiffieHellman = f.DiffieHellman)
          var h = r(5478)
          ;(e.createSign = h.createSign),
            (e.Sign = h.Sign),
            (e.createVerify = h.createVerify),
            (e.Verify = h.Verify),
            (e.createECDH = r(3590))
          var c = r(970)
          ;(e.publicEncrypt = c.publicEncrypt),
            (e.privateEncrypt = c.privateEncrypt),
            (e.publicDecrypt = c.publicDecrypt),
            (e.privateDecrypt = c.privateDecrypt)
          var u = r(8156)
          ;(e.randomFill = u.randomFill),
            (e.randomFillSync = u.randomFillSync),
            (e.createCredentials = function () {
              throw new Error(
                [
                  'sorry, createCredentials is not implemented yet',
                  'we accept pull requests',
                  'https://github.com/crypto-browserify/crypto-browserify',
                ].join('\n'),
              )
            }),
            (e.constants = {
              DH_CHECK_P_NOT_SAFE_PRIME: 2,
              DH_CHECK_P_NOT_PRIME: 1,
              DH_UNABLE_TO_CHECK_GENERATOR: 4,
              DH_NOT_SUITABLE_GENERATOR: 8,
              NPN_ENABLED: 1,
              ALPN_ENABLED: 1,
              RSA_PKCS1_PADDING: 1,
              RSA_SSLV23_PADDING: 2,
              RSA_NO_PADDING: 3,
              RSA_PKCS1_OAEP_PADDING: 4,
              RSA_X931_PADDING: 5,
              RSA_PKCS1_PSS_PADDING: 6,
              POINT_CONVERSION_COMPRESSED: 2,
              POINT_CONVERSION_UNCOMPRESSED: 4,
              POINT_CONVERSION_HYBRID: 6,
            })
        },
        5557: (t, e, r) => {
          'use strict'
          ;(e.utils = r(7538)), (e.Cipher = r(647)), (e.DES = r(6265)), (e.CBC = r(9315)), (e.EDE = r(3673))
        },
        9315: (t, e, r) => {
          'use strict'
          var i = r(1339),
            n = r(4603),
            o = {}
          function a(t) {
            i.equal(t.length, 8, 'Invalid IV length'), (this.iv = new Array(8))
            for (var e = 0; e < this.iv.length; e++) this.iv[e] = t[e]
          }
          ;(e.instantiate = function (t) {
            function e(e) {
              t.call(this, e), this._cbcInit()
            }
            n(e, t)
            for (var r = Object.keys(o), i = 0; i < r.length; i++) {
              var a = r[i]
              e.prototype[a] = o[a]
            }
            return (
              (e.create = function (t) {
                return new e(t)
              }),
              e
            )
          }),
            (o._cbcInit = function () {
              var t = new a(this.options.iv)
              this._cbcState = t
            }),
            (o._update = function (t, e, r, i) {
              var n = this._cbcState,
                o = this.constructor.super_.prototype,
                a = n.iv
              if ('encrypt' === this.type) {
                for (var s = 0; s < this.blockSize; s++) a[s] ^= t[e + s]
                for (o._update.call(this, a, 0, r, i), s = 0; s < this.blockSize; s++) a[s] = r[i + s]
              } else {
                for (o._update.call(this, t, e, r, i), s = 0; s < this.blockSize; s++) r[i + s] ^= a[s]
                for (s = 0; s < this.blockSize; s++) a[s] = t[e + s]
              }
            })
        },
        647: (t, e, r) => {
          'use strict'
          var i = r(1339)
          function n(t) {
            ;(this.options = t),
              (this.type = this.options.type),
              (this.blockSize = 8),
              this._init(),
              (this.buffer = new Array(this.blockSize)),
              (this.bufferOff = 0)
          }
          ;(t.exports = n),
            (n.prototype._init = function () {}),
            (n.prototype.update = function (t) {
              return 0 === t.length ? [] : 'decrypt' === this.type ? this._updateDecrypt(t) : this._updateEncrypt(t)
            }),
            (n.prototype._buffer = function (t, e) {
              for (var r = Math.min(this.buffer.length - this.bufferOff, t.length - e), i = 0; i < r; i++)
                this.buffer[this.bufferOff + i] = t[e + i]
              return (this.bufferOff += r), r
            }),
            (n.prototype._flushBuffer = function (t, e) {
              return this._update(this.buffer, 0, t, e), (this.bufferOff = 0), this.blockSize
            }),
            (n.prototype._updateEncrypt = function (t) {
              var e = 0,
                r = 0,
                i = ((this.bufferOff + t.length) / this.blockSize) | 0,
                n = new Array(i * this.blockSize)
              0 !== this.bufferOff &&
                ((e += this._buffer(t, e)), this.bufferOff === this.buffer.length && (r += this._flushBuffer(n, r)))
              for (var o = t.length - ((t.length - e) % this.blockSize); e < o; e += this.blockSize)
                this._update(t, e, n, r), (r += this.blockSize)
              for (; e < t.length; e++, this.bufferOff++) this.buffer[this.bufferOff] = t[e]
              return n
            }),
            (n.prototype._updateDecrypt = function (t) {
              for (
                var e = 0,
                  r = 0,
                  i = Math.ceil((this.bufferOff + t.length) / this.blockSize) - 1,
                  n = new Array(i * this.blockSize);
                i > 0;
                i--
              )
                (e += this._buffer(t, e)), (r += this._flushBuffer(n, r))
              return (e += this._buffer(t, e)), n
            }),
            (n.prototype.final = function (t) {
              var e, r
              return (
                t && (e = this.update(t)),
                (r = 'encrypt' === this.type ? this._finalEncrypt() : this._finalDecrypt()),
                e ? e.concat(r) : r
              )
            }),
            (n.prototype._pad = function (t, e) {
              if (0 === e) return !1
              for (; e < t.length; ) t[e++] = 0
              return !0
            }),
            (n.prototype._finalEncrypt = function () {
              if (!this._pad(this.buffer, this.bufferOff)) return []
              var t = new Array(this.blockSize)
              return this._update(this.buffer, 0, t, 0), t
            }),
            (n.prototype._unpad = function (t) {
              return t
            }),
            (n.prototype._finalDecrypt = function () {
              i.equal(this.bufferOff, this.blockSize, 'Not enough data to decrypt')
              var t = new Array(this.blockSize)
              return this._flushBuffer(t, 0), this._unpad(t)
            })
        },
        6265: (t, e, r) => {
          'use strict'
          var i = r(1339),
            n = r(4603),
            o = r(7538),
            a = r(647)
          function s() {
            ;(this.tmp = new Array(2)), (this.keys = null)
          }
          function f(t) {
            a.call(this, t)
            var e = new s()
            ;(this._desState = e), this.deriveKeys(e, t.key)
          }
          n(f, a),
            (t.exports = f),
            (f.create = function (t) {
              return new f(t)
            })
          var h = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1]
          ;(f.prototype.deriveKeys = function (t, e) {
            ;(t.keys = new Array(32)), i.equal(e.length, this.blockSize, 'Invalid key length')
            var r = o.readUInt32BE(e, 0),
              n = o.readUInt32BE(e, 4)
            o.pc1(r, n, t.tmp, 0), (r = t.tmp[0]), (n = t.tmp[1])
            for (var a = 0; a < t.keys.length; a += 2) {
              var s = h[a >>> 1]
              ;(r = o.r28shl(r, s)), (n = o.r28shl(n, s)), o.pc2(r, n, t.keys, a)
            }
          }),
            (f.prototype._update = function (t, e, r, i) {
              var n = this._desState,
                a = o.readUInt32BE(t, e),
                s = o.readUInt32BE(t, e + 4)
              o.ip(a, s, n.tmp, 0),
                (a = n.tmp[0]),
                (s = n.tmp[1]),
                'encrypt' === this.type ? this._encrypt(n, a, s, n.tmp, 0) : this._decrypt(n, a, s, n.tmp, 0),
                (a = n.tmp[0]),
                (s = n.tmp[1]),
                o.writeUInt32BE(r, a, i),
                o.writeUInt32BE(r, s, i + 4)
            }),
            (f.prototype._pad = function (t, e) {
              for (var r = t.length - e, i = e; i < t.length; i++) t[i] = r
              return !0
            }),
            (f.prototype._unpad = function (t) {
              for (var e = t[t.length - 1], r = t.length - e; r < t.length; r++) i.equal(t[r], e)
              return t.slice(0, t.length - e)
            }),
            (f.prototype._encrypt = function (t, e, r, i, n) {
              for (var a = e, s = r, f = 0; f < t.keys.length; f += 2) {
                var h = t.keys[f],
                  c = t.keys[f + 1]
                o.expand(s, t.tmp, 0), (h ^= t.tmp[0]), (c ^= t.tmp[1])
                var u = o.substitute(h, c),
                  d = s
                ;(s = (a ^ o.permute(u)) >>> 0), (a = d)
              }
              o.rip(s, a, i, n)
            }),
            (f.prototype._decrypt = function (t, e, r, i, n) {
              for (var a = r, s = e, f = t.keys.length - 2; f >= 0; f -= 2) {
                var h = t.keys[f],
                  c = t.keys[f + 1]
                o.expand(a, t.tmp, 0), (h ^= t.tmp[0]), (c ^= t.tmp[1])
                var u = o.substitute(h, c),
                  d = a
                ;(a = (s ^ o.permute(u)) >>> 0), (s = d)
              }
              o.rip(a, s, i, n)
            })
        },
        3673: (t, e, r) => {
          'use strict'
          var i = r(1339),
            n = r(4603),
            o = r(647),
            a = r(6265)
          function s(t, e) {
            i.equal(e.length, 24, 'Invalid key length')
            var r = e.slice(0, 8),
              n = e.slice(8, 16),
              o = e.slice(16, 24)
            this.ciphers =
              'encrypt' === t
                ? [
                    a.create({ type: 'encrypt', key: r }),
                    a.create({ type: 'decrypt', key: n }),
                    a.create({ type: 'encrypt', key: o }),
                  ]
                : [
                    a.create({ type: 'decrypt', key: o }),
                    a.create({ type: 'encrypt', key: n }),
                    a.create({ type: 'decrypt', key: r }),
                  ]
          }
          function f(t) {
            o.call(this, t)
            var e = new s(this.type, this.options.key)
            this._edeState = e
          }
          n(f, o),
            (t.exports = f),
            (f.create = function (t) {
              return new f(t)
            }),
            (f.prototype._update = function (t, e, r, i) {
              var n = this._edeState
              n.ciphers[0]._update(t, e, r, i), n.ciphers[1]._update(r, i, r, i), n.ciphers[2]._update(r, i, r, i)
            }),
            (f.prototype._pad = a.prototype._pad),
            (f.prototype._unpad = a.prototype._unpad)
        },
        7538: (t, e) => {
          'use strict'
          ;(e.readUInt32BE = function (t, e) {
            return ((t[0 + e] << 24) | (t[1 + e] << 16) | (t[2 + e] << 8) | t[3 + e]) >>> 0
          }),
            (e.writeUInt32BE = function (t, e, r) {
              ;(t[0 + r] = e >>> 24), (t[1 + r] = (e >>> 16) & 255), (t[2 + r] = (e >>> 8) & 255), (t[3 + r] = 255 & e)
            }),
            (e.ip = function (t, e, r, i) {
              for (var n = 0, o = 0, a = 6; a >= 0; a -= 2) {
                for (var s = 0; s <= 24; s += 8) (n <<= 1), (n |= (e >>> (s + a)) & 1)
                for (s = 0; s <= 24; s += 8) (n <<= 1), (n |= (t >>> (s + a)) & 1)
              }
              for (a = 6; a >= 0; a -= 2) {
                for (s = 1; s <= 25; s += 8) (o <<= 1), (o |= (e >>> (s + a)) & 1)
                for (s = 1; s <= 25; s += 8) (o <<= 1), (o |= (t >>> (s + a)) & 1)
              }
              ;(r[i + 0] = n >>> 0), (r[i + 1] = o >>> 0)
            }),
            (e.rip = function (t, e, r, i) {
              for (var n = 0, o = 0, a = 0; a < 4; a++)
                for (var s = 24; s >= 0; s -= 8)
                  (n <<= 1), (n |= (e >>> (s + a)) & 1), (n <<= 1), (n |= (t >>> (s + a)) & 1)
              for (a = 4; a < 8; a++)
                for (s = 24; s >= 0; s -= 8)
                  (o <<= 1), (o |= (e >>> (s + a)) & 1), (o <<= 1), (o |= (t >>> (s + a)) & 1)
              ;(r[i + 0] = n >>> 0), (r[i + 1] = o >>> 0)
            }),
            (e.pc1 = function (t, e, r, i) {
              for (var n = 0, o = 0, a = 7; a >= 5; a--) {
                for (var s = 0; s <= 24; s += 8) (n <<= 1), (n |= (e >> (s + a)) & 1)
                for (s = 0; s <= 24; s += 8) (n <<= 1), (n |= (t >> (s + a)) & 1)
              }
              for (s = 0; s <= 24; s += 8) (n <<= 1), (n |= (e >> (s + a)) & 1)
              for (a = 1; a <= 3; a++) {
                for (s = 0; s <= 24; s += 8) (o <<= 1), (o |= (e >> (s + a)) & 1)
                for (s = 0; s <= 24; s += 8) (o <<= 1), (o |= (t >> (s + a)) & 1)
              }
              for (s = 0; s <= 24; s += 8) (o <<= 1), (o |= (t >> (s + a)) & 1)
              ;(r[i + 0] = n >>> 0), (r[i + 1] = o >>> 0)
            }),
            (e.r28shl = function (t, e) {
              return ((t << e) & 268435455) | (t >>> (28 - e))
            })
          var r = [
            14, 11, 17, 4, 27, 23, 25, 0, 13, 22, 7, 18, 5, 9, 16, 24, 2, 20, 12, 21, 1, 8, 15, 26, 15, 4, 25, 19, 9, 1,
            26, 16, 5, 11, 23, 8, 12, 7, 17, 0, 22, 3, 10, 14, 6, 20, 27, 24,
          ]
          ;(e.pc2 = function (t, e, i, n) {
            for (var o = 0, a = 0, s = r.length >>> 1, f = 0; f < s; f++) (o <<= 1), (o |= (t >>> r[f]) & 1)
            for (f = s; f < r.length; f++) (a <<= 1), (a |= (e >>> r[f]) & 1)
            ;(i[n + 0] = o >>> 0), (i[n + 1] = a >>> 0)
          }),
            (e.expand = function (t, e, r) {
              var i = 0,
                n = 0
              i = ((1 & t) << 5) | (t >>> 27)
              for (var o = 23; o >= 15; o -= 4) (i <<= 6), (i |= (t >>> o) & 63)
              for (o = 11; o >= 3; o -= 4) (n |= (t >>> o) & 63), (n <<= 6)
              ;(n |= ((31 & t) << 1) | (t >>> 31)), (e[r + 0] = i >>> 0), (e[r + 1] = n >>> 0)
            })
          var i = [
            14, 0, 4, 15, 13, 7, 1, 4, 2, 14, 15, 2, 11, 13, 8, 1, 3, 10, 10, 6, 6, 12, 12, 11, 5, 9, 9, 5, 0, 3, 7, 8,
            4, 15, 1, 12, 14, 8, 8, 2, 13, 4, 6, 9, 2, 1, 11, 7, 15, 5, 12, 11, 9, 3, 7, 14, 3, 10, 10, 0, 5, 6, 0, 13,
            15, 3, 1, 13, 8, 4, 14, 7, 6, 15, 11, 2, 3, 8, 4, 14, 9, 12, 7, 0, 2, 1, 13, 10, 12, 6, 0, 9, 5, 11, 10, 5,
            0, 13, 14, 8, 7, 10, 11, 1, 10, 3, 4, 15, 13, 4, 1, 2, 5, 11, 8, 6, 12, 7, 6, 12, 9, 0, 3, 5, 2, 14, 15, 9,
            10, 13, 0, 7, 9, 0, 14, 9, 6, 3, 3, 4, 15, 6, 5, 10, 1, 2, 13, 8, 12, 5, 7, 14, 11, 12, 4, 11, 2, 15, 8, 1,
            13, 1, 6, 10, 4, 13, 9, 0, 8, 6, 15, 9, 3, 8, 0, 7, 11, 4, 1, 15, 2, 14, 12, 3, 5, 11, 10, 5, 14, 2, 7, 12,
            7, 13, 13, 8, 14, 11, 3, 5, 0, 6, 6, 15, 9, 0, 10, 3, 1, 4, 2, 7, 8, 2, 5, 12, 11, 1, 12, 10, 4, 14, 15, 9,
            10, 3, 6, 15, 9, 0, 0, 6, 12, 10, 11, 1, 7, 13, 13, 8, 15, 9, 1, 4, 3, 5, 14, 11, 5, 12, 2, 7, 8, 2, 4, 14,
            2, 14, 12, 11, 4, 2, 1, 12, 7, 4, 10, 7, 11, 13, 6, 1, 8, 5, 5, 0, 3, 15, 15, 10, 13, 3, 0, 9, 14, 8, 9, 6,
            4, 11, 2, 8, 1, 12, 11, 7, 10, 1, 13, 14, 7, 2, 8, 13, 15, 6, 9, 15, 12, 0, 5, 9, 6, 10, 3, 4, 0, 5, 14, 3,
            12, 10, 1, 15, 10, 4, 15, 2, 9, 7, 2, 12, 6, 9, 8, 5, 0, 6, 13, 1, 3, 13, 4, 14, 14, 0, 7, 11, 5, 3, 11, 8,
            9, 4, 14, 3, 15, 2, 5, 12, 2, 9, 8, 5, 12, 15, 3, 10, 7, 11, 0, 14, 4, 1, 10, 7, 1, 6, 13, 0, 11, 8, 6, 13,
            4, 13, 11, 0, 2, 11, 14, 7, 15, 4, 0, 9, 8, 1, 13, 10, 3, 14, 12, 3, 9, 5, 7, 12, 5, 2, 10, 15, 6, 8, 1, 6,
            1, 6, 4, 11, 11, 13, 13, 8, 12, 1, 3, 4, 7, 10, 14, 7, 10, 9, 15, 5, 6, 0, 8, 15, 0, 14, 5, 2, 9, 3, 2, 12,
            13, 1, 2, 15, 8, 13, 4, 8, 6, 10, 15, 3, 11, 7, 1, 4, 10, 12, 9, 5, 3, 6, 14, 11, 5, 0, 0, 14, 12, 9, 7, 2,
            7, 2, 11, 1, 4, 14, 1, 7, 9, 4, 12, 10, 14, 8, 2, 13, 0, 15, 6, 12, 10, 9, 13, 0, 15, 3, 3, 5, 5, 6, 8, 11,
          ]
          e.substitute = function (t, e) {
            for (var r = 0, n = 0; n < 4; n++) (r <<= 4), (r |= i[64 * n + ((t >>> (18 - 6 * n)) & 63)])
            for (n = 0; n < 4; n++) (r <<= 4), (r |= i[256 + 64 * n + ((e >>> (18 - 6 * n)) & 63)])
            return r >>> 0
          }
          var n = [
            16, 25, 12, 11, 3, 20, 4, 15, 31, 17, 9, 6, 27, 14, 1, 22, 30, 24, 8, 18, 0, 5, 29, 23, 13, 19, 2, 26, 10,
            21, 28, 7,
          ]
          ;(e.permute = function (t) {
            for (var e = 0, r = 0; r < n.length; r++) (e <<= 1), (e |= (t >>> n[r]) & 1)
            return e >>> 0
          }),
            (e.padSplit = function (t, e, r) {
              for (var i = t.toString(2); i.length < e; ) i = '0' + i
              for (var n = [], o = 0; o < e; o += r) n.push(i.slice(o, o + r))
              return n.join(' ')
            })
        },
        9402: (t, e, r) => {
          var i = r(692).Buffer,
            n = r(688),
            o = r(5925),
            a = r(6304),
            s = { binary: !0, hex: !0, base64: !0 }
          ;(e.DiffieHellmanGroup =
            e.createDiffieHellmanGroup =
            e.getDiffieHellman =
              function (t) {
                var e = new i(o[t].prime, 'hex'),
                  r = new i(o[t].gen, 'hex')
                return new a(e, r)
              }),
            (e.createDiffieHellman = e.DiffieHellman =
              function t(e, r, o, f) {
                return i.isBuffer(r) || void 0 === s[r]
                  ? t(e, 'binary', r, o)
                  : ((r = r || 'binary'),
                    (f = f || 'binary'),
                    (o = o || new i([2])),
                    i.isBuffer(o) || (o = new i(o, f)),
                    'number' == typeof e
                      ? new a(n(e, o), o, !0)
                      : (i.isBuffer(e) || (e = new i(e, r)), new a(e, o, !0)))
              })
        },
        6304: (t, e, r) => {
          var i = r(692).Buffer,
            n = r(5612),
            o = new (r(9409))(),
            a = new n(24),
            s = new n(11),
            f = new n(10),
            h = new n(3),
            c = new n(7),
            u = r(688),
            d = r(8244)
          function l(t, e) {
            return (e = e || 'utf8'), i.isBuffer(t) || (t = new i(t, e)), (this._pub = new n(t)), this
          }
          function p(t, e) {
            return (e = e || 'utf8'), i.isBuffer(t) || (t = new i(t, e)), (this._priv = new n(t)), this
          }
          t.exports = m
          var b = {}
          function m(t, e, r) {
            this.setGenerator(e),
              (this.__prime = new n(t)),
              (this._prime = n.mont(this.__prime)),
              (this._primeLen = t.length),
              (this._pub = void 0),
              (this._priv = void 0),
              (this._primeCode = void 0),
              r ? ((this.setPublicKey = l), (this.setPrivateKey = p)) : (this._primeCode = 8)
          }
          function y(t, e) {
            var r = new i(t.toArray())
            return e ? r.toString(e) : r
          }
          Object.defineProperty(m.prototype, 'verifyError', {
            enumerable: !0,
            get: function () {
              return (
                'number' != typeof this._primeCode &&
                  (this._primeCode = (function (t, e) {
                    var r = e.toString('hex'),
                      i = [r, t.toString(16)].join('_')
                    if (i in b) return b[i]
                    var n,
                      d = 0
                    if (t.isEven() || !u.simpleSieve || !u.fermatTest(t) || !o.test(t))
                      return (d += 1), (d += '02' === r || '05' === r ? 8 : 4), (b[i] = d), d
                    switch ((o.test(t.shrn(1)) || (d += 2), r)) {
                      case '02':
                        t.mod(a).cmp(s) && (d += 8)
                        break
                      case '05':
                        ;(n = t.mod(f)).cmp(h) && n.cmp(c) && (d += 8)
                        break
                      default:
                        d += 4
                    }
                    return (b[i] = d), d
                  })(this.__prime, this.__gen)),
                this._primeCode
              )
            },
          }),
            (m.prototype.generateKeys = function () {
              return (
                this._priv || (this._priv = new n(d(this._primeLen))),
                (this._pub = this._gen.toRed(this._prime).redPow(this._priv).fromRed()),
                this.getPublicKey()
              )
            }),
            (m.prototype.computeSecret = function (t) {
              var e = (t = (t = new n(t)).toRed(this._prime)).redPow(this._priv).fromRed(),
                r = new i(e.toArray()),
                o = this.getPrime()
              if (r.length < o.length) {
                var a = new i(o.length - r.length)
                a.fill(0), (r = i.concat([a, r]))
              }
              return r
            }),
            (m.prototype.getPublicKey = function (t) {
              return y(this._pub, t)
            }),
            (m.prototype.getPrivateKey = function (t) {
              return y(this._priv, t)
            }),
            (m.prototype.getPrime = function (t) {
              return y(this.__prime, t)
            }),
            (m.prototype.getGenerator = function (t) {
              return y(this._gen, t)
            }),
            (m.prototype.setGenerator = function (t, e) {
              return (
                (e = e || 'utf8'), i.isBuffer(t) || (t = new i(t, e)), (this.__gen = t), (this._gen = new n(t)), this
              )
            })
        },
        688: (t, e, r) => {
          var i = r(8244)
          ;(t.exports = g), (g.simpleSieve = m), (g.fermatTest = y)
          var n = r(5612),
            o = new n(24),
            a = new (r(9409))(),
            s = new n(1),
            f = new n(2),
            h = new n(5),
            c = (new n(16), new n(8), new n(10)),
            u = new n(3),
            d = (new n(7), new n(11)),
            l = new n(4),
            p = (new n(12), null)
          function b() {
            if (null !== p) return p
            var t = []
            t[0] = 2
            for (var e = 1, r = 3; r < 1048576; r += 2) {
              for (var i = Math.ceil(Math.sqrt(r)), n = 0; n < e && t[n] <= i && r % t[n] != 0; n++);
              ;(e !== n && t[n] <= i) || (t[e++] = r)
            }
            return (p = t), t
          }
          function m(t) {
            for (var e = b(), r = 0; r < e.length; r++) if (0 === t.modn(e[r])) return 0 === t.cmpn(e[r])
            return !0
          }
          function y(t) {
            var e = n.mont(t)
            return 0 === f.toRed(e).redPow(t.subn(1)).fromRed().cmpn(1)
          }
          function g(t, e) {
            if (t < 16) return new n(2 === e || 5 === e ? [140, 123] : [140, 39])
            var r, p
            for (e = new n(e); ; ) {
              for (r = new n(i(Math.ceil(t / 8))); r.bitLength() > t; ) r.ishrn(1)
              if ((r.isEven() && r.iadd(s), r.testn(1) || r.iadd(f), e.cmp(f))) {
                if (!e.cmp(h)) for (; r.mod(c).cmp(u); ) r.iadd(l)
              } else for (; r.mod(o).cmp(d); ) r.iadd(l)
              if (m((p = r.shrn(1))) && m(r) && y(p) && y(r) && a.test(p) && a.test(r)) return r
            }
          }
        },
        5925: (t) => {
          'use strict'
          t.exports = JSON.parse(
            '{"modp1":{"gen":"02","prime":"ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a63a3620ffffffffffffffff"},"modp2":{"gen":"02","prime":"ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece65381ffffffffffffffff"},"modp5":{"gen":"02","prime":"ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca237327ffffffffffffffff"},"modp14":{"gen":"02","prime":"ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aacaa68ffffffffffffffff"},"modp15":{"gen":"02","prime":"ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a93ad2caffffffffffffffff"},"modp16":{"gen":"02","prime":"ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a92108011a723c12a787e6d788719a10bdba5b2699c327186af4e23c1a946834b6150bda2583e9ca2ad44ce8dbbbc2db04de8ef92e8efc141fbecaa6287c59474e6bc05d99b2964fa090c3a2233ba186515be7ed1f612970cee2d7afb81bdd762170481cd0069127d5b05aa993b4ea988d8fddc186ffb7dc90a6c08f4df435c934063199ffffffffffffffff"},"modp17":{"gen":"02","prime":"ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a92108011a723c12a787e6d788719a10bdba5b2699c327186af4e23c1a946834b6150bda2583e9ca2ad44ce8dbbbc2db04de8ef92e8efc141fbecaa6287c59474e6bc05d99b2964fa090c3a2233ba186515be7ed1f612970cee2d7afb81bdd762170481cd0069127d5b05aa993b4ea988d8fddc186ffb7dc90a6c08f4df435c93402849236c3fab4d27c7026c1d4dcb2602646dec9751e763dba37bdf8ff9406ad9e530ee5db382f413001aeb06a53ed9027d831179727b0865a8918da3edbebcf9b14ed44ce6cbaced4bb1bdb7f1447e6cc254b332051512bd7af426fb8f401378cd2bf5983ca01c64b92ecf032ea15d1721d03f482d7ce6e74fef6d55e702f46980c82b5a84031900b1c9e59e7c97fbec7e8f323a97a7e36cc88be0f1d45b7ff585ac54bd407b22b4154aacc8f6d7ebf48e1d814cc5ed20f8037e0a79715eef29be32806a1d58bb7c5da76f550aa3d8a1fbff0eb19ccb1a313d55cda56c9ec2ef29632387fe8d76e3c0468043e8f663f4860ee12bf2d5b0b7474d6e694f91e6dcc4024ffffffffffffffff"},"modp18":{"gen":"02","prime":"ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a92108011a723c12a787e6d788719a10bdba5b2699c327186af4e23c1a946834b6150bda2583e9ca2ad44ce8dbbbc2db04de8ef92e8efc141fbecaa6287c59474e6bc05d99b2964fa090c3a2233ba186515be7ed1f612970cee2d7afb81bdd762170481cd0069127d5b05aa993b4ea988d8fddc186ffb7dc90a6c08f4df435c93402849236c3fab4d27c7026c1d4dcb2602646dec9751e763dba37bdf8ff9406ad9e530ee5db382f413001aeb06a53ed9027d831179727b0865a8918da3edbebcf9b14ed44ce6cbaced4bb1bdb7f1447e6cc254b332051512bd7af426fb8f401378cd2bf5983ca01c64b92ecf032ea15d1721d03f482d7ce6e74fef6d55e702f46980c82b5a84031900b1c9e59e7c97fbec7e8f323a97a7e36cc88be0f1d45b7ff585ac54bd407b22b4154aacc8f6d7ebf48e1d814cc5ed20f8037e0a79715eef29be32806a1d58bb7c5da76f550aa3d8a1fbff0eb19ccb1a313d55cda56c9ec2ef29632387fe8d76e3c0468043e8f663f4860ee12bf2d5b0b7474d6e694f91e6dbe115974a3926f12fee5e438777cb6a932df8cd8bec4d073b931ba3bc832b68d9dd300741fa7bf8afc47ed2576f6936ba424663aab639c5ae4f5683423b4742bf1c978238f16cbe39d652de3fdb8befc848ad922222e04a4037c0713eb57a81a23f0c73473fc646cea306b4bcbc8862f8385ddfa9d4b7fa2c087e879683303ed5bdd3a062b3cf5b3a278a66d2a13f83f44f82ddf310ee074ab6a364597e899a0255dc164f31cc50846851df9ab48195ded7ea1b1d510bd7ee74d73faf36bc31ecfa268359046f4eb879f924009438b481c6cd7889a002ed5ee382bc9190da6fc026e479558e4475677e9aa9e3050e2765694dfc81f56e880b96e7160c980dd98edd3dfffffffffffffffff"}}',
          )
        },
        7264: (t, e, r) => {
          'use strict'
          var i = e
          ;(i.version = r(3356).i8),
            (i.utils = r(19)),
            (i.rand = r(5229)),
            (i.curve = r(9766)),
            (i.curves = r(274)),
            (i.ec = r(4848)),
            (i.eddsa = r(7004))
        },
        1375: (t, e, r) => {
          'use strict'
          var i = r(5612),
            n = r(19),
            o = n.getNAF,
            a = n.getJSF,
            s = n.assert
          function f(t, e) {
            ;(this.type = t),
              (this.p = new i(e.p, 16)),
              (this.red = e.prime ? i.red(e.prime) : i.mont(this.p)),
              (this.zero = new i(0).toRed(this.red)),
              (this.one = new i(1).toRed(this.red)),
              (this.two = new i(2).toRed(this.red)),
              (this.n = e.n && new i(e.n, 16)),
              (this.g = e.g && this.pointFromJSON(e.g, e.gRed)),
              (this._wnafT1 = new Array(4)),
              (this._wnafT2 = new Array(4)),
              (this._wnafT3 = new Array(4)),
              (this._wnafT4 = new Array(4)),
              (this._bitLength = this.n ? this.n.bitLength() : 0)
            var r = this.n && this.p.div(this.n)
            !r || r.cmpn(100) > 0
              ? (this.redN = null)
              : ((this._maxwellTrick = !0), (this.redN = this.n.toRed(this.red)))
          }
          function h(t, e) {
            ;(this.curve = t), (this.type = e), (this.precomputed = null)
          }
          ;(t.exports = f),
            (f.prototype.point = function () {
              throw new Error('Not implemented')
            }),
            (f.prototype.validate = function () {
              throw new Error('Not implemented')
            }),
            (f.prototype._fixedNafMul = function (t, e) {
              s(t.precomputed)
              var r = t._getDoubles(),
                i = o(e, 1, this._bitLength),
                n = (1 << (r.step + 1)) - (r.step % 2 == 0 ? 2 : 1)
              n /= 3
              for (var a = [], f = 0; f < i.length; f += r.step) {
                var h = 0
                for (e = f + r.step - 1; e >= f; e--) h = (h << 1) + i[e]
                a.push(h)
              }
              for (var c = this.jpoint(null, null, null), u = this.jpoint(null, null, null), d = n; d > 0; d--) {
                for (f = 0; f < a.length; f++)
                  (h = a[f]) === d ? (u = u.mixedAdd(r.points[f])) : h === -d && (u = u.mixedAdd(r.points[f].neg()))
                c = c.add(u)
              }
              return c.toP()
            }),
            (f.prototype._wnafMul = function (t, e) {
              var r = 4,
                i = t._getNAFPoints(r)
              r = i.wnd
              for (
                var n = i.points, a = o(e, r, this._bitLength), f = this.jpoint(null, null, null), h = a.length - 1;
                h >= 0;
                h--
              ) {
                for (e = 0; h >= 0 && 0 === a[h]; h--) e++
                if ((h >= 0 && e++, (f = f.dblp(e)), h < 0)) break
                var c = a[h]
                s(0 !== c),
                  (f =
                    'affine' === t.type
                      ? c > 0
                        ? f.mixedAdd(n[(c - 1) >> 1])
                        : f.mixedAdd(n[(-c - 1) >> 1].neg())
                      : c > 0
                      ? f.add(n[(c - 1) >> 1])
                      : f.add(n[(-c - 1) >> 1].neg()))
              }
              return 'affine' === t.type ? f.toP() : f
            }),
            (f.prototype._wnafMulAdd = function (t, e, r, i, n) {
              for (var s = this._wnafT1, f = this._wnafT2, h = this._wnafT3, c = 0, u = 0; u < i; u++) {
                var d = (A = e[u])._getNAFPoints(t)
                ;(s[u] = d.wnd), (f[u] = d.points)
              }
              for (u = i - 1; u >= 1; u -= 2) {
                var l = u - 1,
                  p = u
                if (1 === s[l] && 1 === s[p]) {
                  var b = [e[l], null, null, e[p]]
                  0 === e[l].y.cmp(e[p].y)
                    ? ((b[1] = e[l].add(e[p])), (b[2] = e[l].toJ().mixedAdd(e[p].neg())))
                    : 0 === e[l].y.cmp(e[p].y.redNeg())
                    ? ((b[1] = e[l].toJ().mixedAdd(e[p])), (b[2] = e[l].add(e[p].neg())))
                    : ((b[1] = e[l].toJ().mixedAdd(e[p])), (b[2] = e[l].toJ().mixedAdd(e[p].neg())))
                  var m = [-3, -1, -5, -7, 0, 7, 5, 1, 3],
                    y = a(r[l], r[p])
                  ;(c = Math.max(y[0].length, c)), (h[l] = new Array(c)), (h[p] = new Array(c))
                  for (var g = 0; g < c; g++) {
                    var v = 0 | y[0][g],
                      _ = 0 | y[1][g]
                    ;(h[l][g] = m[3 * (v + 1) + (_ + 1)]), (h[p][g] = 0), (f[l] = b)
                  }
                } else
                  (h[l] = o(r[l], s[l], this._bitLength)),
                    (h[p] = o(r[p], s[p], this._bitLength)),
                    (c = Math.max(h[l].length, c)),
                    (c = Math.max(h[p].length, c))
              }
              var w = this.jpoint(null, null, null),
                M = this._wnafT4
              for (u = c; u >= 0; u--) {
                for (var S = 0; u >= 0; ) {
                  var E = !0
                  for (g = 0; g < i; g++) (M[g] = 0 | h[g][u]), 0 !== M[g] && (E = !1)
                  if (!E) break
                  S++, u--
                }
                if ((u >= 0 && S++, (w = w.dblp(S)), u < 0)) break
                for (g = 0; g < i; g++) {
                  var A,
                    k = M[g]
                  0 !== k &&
                    (k > 0 ? (A = f[g][(k - 1) >> 1]) : k < 0 && (A = f[g][(-k - 1) >> 1].neg()),
                    (w = 'affine' === A.type ? w.mixedAdd(A) : w.add(A)))
                }
              }
              for (u = 0; u < i; u++) f[u] = null
              return n ? w : w.toP()
            }),
            (f.BasePoint = h),
            (h.prototype.eq = function () {
              throw new Error('Not implemented')
            }),
            (h.prototype.validate = function () {
              return this.curve.validate(this)
            }),
            (f.prototype.decodePoint = function (t, e) {
              t = n.toArray(t, e)
              var r = this.p.byteLength()
              if ((4 === t[0] || 6 === t[0] || 7 === t[0]) && t.length - 1 == 2 * r)
                return (
                  6 === t[0] ? s(t[t.length - 1] % 2 == 0) : 7 === t[0] && s(t[t.length - 1] % 2 == 1),
                  this.point(t.slice(1, 1 + r), t.slice(1 + r, 1 + 2 * r))
                )
              if ((2 === t[0] || 3 === t[0]) && t.length - 1 === r)
                return this.pointFromX(t.slice(1, 1 + r), 3 === t[0])
              throw new Error('Unknown point format')
            }),
            (h.prototype.encodeCompressed = function (t) {
              return this.encode(t, !0)
            }),
            (h.prototype._encode = function (t) {
              var e = this.curve.p.byteLength(),
                r = this.getX().toArray('be', e)
              return t ? [this.getY().isEven() ? 2 : 3].concat(r) : [4].concat(r, this.getY().toArray('be', e))
            }),
            (h.prototype.encode = function (t, e) {
              return n.encode(this._encode(e), t)
            }),
            (h.prototype.precompute = function (t) {
              if (this.precomputed) return this
              var e = { doubles: null, naf: null, beta: null }
              return (
                (e.naf = this._getNAFPoints(8)),
                (e.doubles = this._getDoubles(4, t)),
                (e.beta = this._getBeta()),
                (this.precomputed = e),
                this
              )
            }),
            (h.prototype._hasDoubles = function (t) {
              if (!this.precomputed) return !1
              var e = this.precomputed.doubles
              return !!e && e.points.length >= Math.ceil((t.bitLength() + 1) / e.step)
            }),
            (h.prototype._getDoubles = function (t, e) {
              if (this.precomputed && this.precomputed.doubles) return this.precomputed.doubles
              for (var r = [this], i = this, n = 0; n < e; n += t) {
                for (var o = 0; o < t; o++) i = i.dbl()
                r.push(i)
              }
              return { step: t, points: r }
            }),
            (h.prototype._getNAFPoints = function (t) {
              if (this.precomputed && this.precomputed.naf) return this.precomputed.naf
              for (var e = [this], r = (1 << t) - 1, i = 1 === r ? null : this.dbl(), n = 1; n < r; n++)
                e[n] = e[n - 1].add(i)
              return { wnd: t, points: e }
            }),
            (h.prototype._getBeta = function () {
              return null
            }),
            (h.prototype.dblp = function (t) {
              for (var e = this, r = 0; r < t; r++) e = e.dbl()
              return e
            })
        },
        3844: (t, e, r) => {
          'use strict'
          var i = r(19),
            n = r(5612),
            o = r(4603),
            a = r(1375),
            s = i.assert
          function f(t) {
            ;(this.twisted = 1 != (0 | t.a)),
              (this.mOneA = this.twisted && -1 == (0 | t.a)),
              (this.extended = this.mOneA),
              a.call(this, 'edwards', t),
              (this.a = new n(t.a, 16).umod(this.red.m)),
              (this.a = this.a.toRed(this.red)),
              (this.c = new n(t.c, 16).toRed(this.red)),
              (this.c2 = this.c.redSqr()),
              (this.d = new n(t.d, 16).toRed(this.red)),
              (this.dd = this.d.redAdd(this.d)),
              s(!this.twisted || 0 === this.c.fromRed().cmpn(1)),
              (this.oneC = 1 == (0 | t.c))
          }
          function h(t, e, r, i, o) {
            a.BasePoint.call(this, t, 'projective'),
              null === e && null === r && null === i
                ? ((this.x = this.curve.zero),
                  (this.y = this.curve.one),
                  (this.z = this.curve.one),
                  (this.t = this.curve.zero),
                  (this.zOne = !0))
                : ((this.x = new n(e, 16)),
                  (this.y = new n(r, 16)),
                  (this.z = i ? new n(i, 16) : this.curve.one),
                  (this.t = o && new n(o, 16)),
                  this.x.red || (this.x = this.x.toRed(this.curve.red)),
                  this.y.red || (this.y = this.y.toRed(this.curve.red)),
                  this.z.red || (this.z = this.z.toRed(this.curve.red)),
                  this.t && !this.t.red && (this.t = this.t.toRed(this.curve.red)),
                  (this.zOne = this.z === this.curve.one),
                  this.curve.extended &&
                    !this.t &&
                    ((this.t = this.x.redMul(this.y)), this.zOne || (this.t = this.t.redMul(this.z.redInvm()))))
          }
          o(f, a),
            (t.exports = f),
            (f.prototype._mulA = function (t) {
              return this.mOneA ? t.redNeg() : this.a.redMul(t)
            }),
            (f.prototype._mulC = function (t) {
              return this.oneC ? t : this.c.redMul(t)
            }),
            (f.prototype.jpoint = function (t, e, r, i) {
              return this.point(t, e, r, i)
            }),
            (f.prototype.pointFromX = function (t, e) {
              ;(t = new n(t, 16)).red || (t = t.toRed(this.red))
              var r = t.redSqr(),
                i = this.c2.redSub(this.a.redMul(r)),
                o = this.one.redSub(this.c2.redMul(this.d).redMul(r)),
                a = i.redMul(o.redInvm()),
                s = a.redSqrt()
              if (0 !== s.redSqr().redSub(a).cmp(this.zero)) throw new Error('invalid point')
              var f = s.fromRed().isOdd()
              return ((e && !f) || (!e && f)) && (s = s.redNeg()), this.point(t, s)
            }),
            (f.prototype.pointFromY = function (t, e) {
              ;(t = new n(t, 16)).red || (t = t.toRed(this.red))
              var r = t.redSqr(),
                i = r.redSub(this.c2),
                o = r.redMul(this.d).redMul(this.c2).redSub(this.a),
                a = i.redMul(o.redInvm())
              if (0 === a.cmp(this.zero)) {
                if (e) throw new Error('invalid point')
                return this.point(this.zero, t)
              }
              var s = a.redSqrt()
              if (0 !== s.redSqr().redSub(a).cmp(this.zero)) throw new Error('invalid point')
              return s.fromRed().isOdd() !== e && (s = s.redNeg()), this.point(s, t)
            }),
            (f.prototype.validate = function (t) {
              if (t.isInfinity()) return !0
              t.normalize()
              var e = t.x.redSqr(),
                r = t.y.redSqr(),
                i = e.redMul(this.a).redAdd(r),
                n = this.c2.redMul(this.one.redAdd(this.d.redMul(e).redMul(r)))
              return 0 === i.cmp(n)
            }),
            o(h, a.BasePoint),
            (f.prototype.pointFromJSON = function (t) {
              return h.fromJSON(this, t)
            }),
            (f.prototype.point = function (t, e, r, i) {
              return new h(this, t, e, r, i)
            }),
            (h.fromJSON = function (t, e) {
              return new h(t, e[0], e[1], e[2])
            }),
            (h.prototype.inspect = function () {
              return this.isInfinity()
                ? '<EC Point Infinity>'
                : '<EC Point x: ' +
                    this.x.fromRed().toString(16, 2) +
                    ' y: ' +
                    this.y.fromRed().toString(16, 2) +
                    ' z: ' +
                    this.z.fromRed().toString(16, 2) +
                    '>'
            }),
            (h.prototype.isInfinity = function () {
              return 0 === this.x.cmpn(0) && (0 === this.y.cmp(this.z) || (this.zOne && 0 === this.y.cmp(this.curve.c)))
            }),
            (h.prototype._extDbl = function () {
              var t = this.x.redSqr(),
                e = this.y.redSqr(),
                r = this.z.redSqr()
              r = r.redIAdd(r)
              var i = this.curve._mulA(t),
                n = this.x.redAdd(this.y).redSqr().redISub(t).redISub(e),
                o = i.redAdd(e),
                a = o.redSub(r),
                s = i.redSub(e),
                f = n.redMul(a),
                h = o.redMul(s),
                c = n.redMul(s),
                u = a.redMul(o)
              return this.curve.point(f, h, u, c)
            }),
            (h.prototype._projDbl = function () {
              var t,
                e,
                r,
                i = this.x.redAdd(this.y).redSqr(),
                n = this.x.redSqr(),
                o = this.y.redSqr()
              if (this.curve.twisted) {
                var a = (h = this.curve._mulA(n)).redAdd(o)
                if (this.zOne)
                  (t = i.redSub(n).redSub(o).redMul(a.redSub(this.curve.two))),
                    (e = a.redMul(h.redSub(o))),
                    (r = a.redSqr().redSub(a).redSub(a))
                else {
                  var s = this.z.redSqr(),
                    f = a.redSub(s).redISub(s)
                  ;(t = i.redSub(n).redISub(o).redMul(f)), (e = a.redMul(h.redSub(o))), (r = a.redMul(f))
                }
              } else {
                var h = n.redAdd(o)
                ;(s = this.curve._mulC(this.z).redSqr()),
                  (f = h.redSub(s).redSub(s)),
                  (t = this.curve._mulC(i.redISub(h)).redMul(f)),
                  (e = this.curve._mulC(h).redMul(n.redISub(o))),
                  (r = h.redMul(f))
              }
              return this.curve.point(t, e, r)
            }),
            (h.prototype.dbl = function () {
              return this.isInfinity() ? this : this.curve.extended ? this._extDbl() : this._projDbl()
            }),
            (h.prototype._extAdd = function (t) {
              var e = this.y.redSub(this.x).redMul(t.y.redSub(t.x)),
                r = this.y.redAdd(this.x).redMul(t.y.redAdd(t.x)),
                i = this.t.redMul(this.curve.dd).redMul(t.t),
                n = this.z.redMul(t.z.redAdd(t.z)),
                o = r.redSub(e),
                a = n.redSub(i),
                s = n.redAdd(i),
                f = r.redAdd(e),
                h = o.redMul(a),
                c = s.redMul(f),
                u = o.redMul(f),
                d = a.redMul(s)
              return this.curve.point(h, c, d, u)
            }),
            (h.prototype._projAdd = function (t) {
              var e,
                r,
                i = this.z.redMul(t.z),
                n = i.redSqr(),
                o = this.x.redMul(t.x),
                a = this.y.redMul(t.y),
                s = this.curve.d.redMul(o).redMul(a),
                f = n.redSub(s),
                h = n.redAdd(s),
                c = this.x.redAdd(this.y).redMul(t.x.redAdd(t.y)).redISub(o).redISub(a),
                u = i.redMul(f).redMul(c)
              return (
                this.curve.twisted
                  ? ((e = i.redMul(h).redMul(a.redSub(this.curve._mulA(o)))), (r = f.redMul(h)))
                  : ((e = i.redMul(h).redMul(a.redSub(o))), (r = this.curve._mulC(f).redMul(h))),
                this.curve.point(u, e, r)
              )
            }),
            (h.prototype.add = function (t) {
              return this.isInfinity()
                ? t
                : t.isInfinity()
                ? this
                : this.curve.extended
                ? this._extAdd(t)
                : this._projAdd(t)
            }),
            (h.prototype.mul = function (t) {
              return this._hasDoubles(t) ? this.curve._fixedNafMul(this, t) : this.curve._wnafMul(this, t)
            }),
            (h.prototype.mulAdd = function (t, e, r) {
              return this.curve._wnafMulAdd(1, [this, e], [t, r], 2, !1)
            }),
            (h.prototype.jmulAdd = function (t, e, r) {
              return this.curve._wnafMulAdd(1, [this, e], [t, r], 2, !0)
            }),
            (h.prototype.normalize = function () {
              if (this.zOne) return this
              var t = this.z.redInvm()
              return (
                (this.x = this.x.redMul(t)),
                (this.y = this.y.redMul(t)),
                this.t && (this.t = this.t.redMul(t)),
                (this.z = this.curve.one),
                (this.zOne = !0),
                this
              )
            }),
            (h.prototype.neg = function () {
              return this.curve.point(this.x.redNeg(), this.y, this.z, this.t && this.t.redNeg())
            }),
            (h.prototype.getX = function () {
              return this.normalize(), this.x.fromRed()
            }),
            (h.prototype.getY = function () {
              return this.normalize(), this.y.fromRed()
            }),
            (h.prototype.eq = function (t) {
              return this === t || (0 === this.getX().cmp(t.getX()) && 0 === this.getY().cmp(t.getY()))
            }),
            (h.prototype.eqXToP = function (t) {
              var e = t.toRed(this.curve.red).redMul(this.z)
              if (0 === this.x.cmp(e)) return !0
              for (var r = t.clone(), i = this.curve.redN.redMul(this.z); ; ) {
                if ((r.iadd(this.curve.n), r.cmp(this.curve.p) >= 0)) return !1
                if ((e.redIAdd(i), 0 === this.x.cmp(e))) return !0
              }
            }),
            (h.prototype.toP = h.prototype.normalize),
            (h.prototype.mixedAdd = h.prototype.add)
        },
        9766: (t, e, r) => {
          'use strict'
          var i = e
          ;(i.base = r(1375)), (i.short = r(7165)), (i.mont = r(3203)), (i.edwards = r(3844))
        },
        3203: (t, e, r) => {
          'use strict'
          var i = r(5612),
            n = r(4603),
            o = r(1375),
            a = r(19)
          function s(t) {
            o.call(this, 'mont', t),
              (this.a = new i(t.a, 16).toRed(this.red)),
              (this.b = new i(t.b, 16).toRed(this.red)),
              (this.i4 = new i(4).toRed(this.red).redInvm()),
              (this.two = new i(2).toRed(this.red)),
              (this.a24 = this.i4.redMul(this.a.redAdd(this.two)))
          }
          function f(t, e, r) {
            o.BasePoint.call(this, t, 'projective'),
              null === e && null === r
                ? ((this.x = this.curve.one), (this.z = this.curve.zero))
                : ((this.x = new i(e, 16)),
                  (this.z = new i(r, 16)),
                  this.x.red || (this.x = this.x.toRed(this.curve.red)),
                  this.z.red || (this.z = this.z.toRed(this.curve.red)))
          }
          n(s, o),
            (t.exports = s),
            (s.prototype.validate = function (t) {
              var e = t.normalize().x,
                r = e.redSqr(),
                i = r.redMul(e).redAdd(r.redMul(this.a)).redAdd(e)
              return 0 === i.redSqrt().redSqr().cmp(i)
            }),
            n(f, o.BasePoint),
            (s.prototype.decodePoint = function (t, e) {
              return this.point(a.toArray(t, e), 1)
            }),
            (s.prototype.point = function (t, e) {
              return new f(this, t, e)
            }),
            (s.prototype.pointFromJSON = function (t) {
              return f.fromJSON(this, t)
            }),
            (f.prototype.precompute = function () {}),
            (f.prototype._encode = function () {
              return this.getX().toArray('be', this.curve.p.byteLength())
            }),
            (f.fromJSON = function (t, e) {
              return new f(t, e[0], e[1] || t.one)
            }),
            (f.prototype.inspect = function () {
              return this.isInfinity()
                ? '<EC Point Infinity>'
                : '<EC Point x: ' + this.x.fromRed().toString(16, 2) + ' z: ' + this.z.fromRed().toString(16, 2) + '>'
            }),
            (f.prototype.isInfinity = function () {
              return 0 === this.z.cmpn(0)
            }),
            (f.prototype.dbl = function () {
              var t = this.x.redAdd(this.z).redSqr(),
                e = this.x.redSub(this.z).redSqr(),
                r = t.redSub(e),
                i = t.redMul(e),
                n = r.redMul(e.redAdd(this.curve.a24.redMul(r)))
              return this.curve.point(i, n)
            }),
            (f.prototype.add = function () {
              throw new Error('Not supported on Montgomery curve')
            }),
            (f.prototype.diffAdd = function (t, e) {
              var r = this.x.redAdd(this.z),
                i = this.x.redSub(this.z),
                n = t.x.redAdd(t.z),
                o = t.x.redSub(t.z).redMul(r),
                a = n.redMul(i),
                s = e.z.redMul(o.redAdd(a).redSqr()),
                f = e.x.redMul(o.redISub(a).redSqr())
              return this.curve.point(s, f)
            }),
            (f.prototype.mul = function (t) {
              for (var e = t.clone(), r = this, i = this.curve.point(null, null), n = []; 0 !== e.cmpn(0); e.iushrn(1))
                n.push(e.andln(1))
              for (var o = n.length - 1; o >= 0; o--)
                0 === n[o] ? ((r = r.diffAdd(i, this)), (i = i.dbl())) : ((i = r.diffAdd(i, this)), (r = r.dbl()))
              return i
            }),
            (f.prototype.mulAdd = function () {
              throw new Error('Not supported on Montgomery curve')
            }),
            (f.prototype.jumlAdd = function () {
              throw new Error('Not supported on Montgomery curve')
            }),
            (f.prototype.eq = function (t) {
              return 0 === this.getX().cmp(t.getX())
            }),
            (f.prototype.normalize = function () {
              return (this.x = this.x.redMul(this.z.redInvm())), (this.z = this.curve.one), this
            }),
            (f.prototype.getX = function () {
              return this.normalize(), this.x.fromRed()
            })
        },
        7165: (t, e, r) => {
          'use strict'
          var i = r(19),
            n = r(5612),
            o = r(4603),
            a = r(1375),
            s = i.assert
          function f(t) {
            a.call(this, 'short', t),
              (this.a = new n(t.a, 16).toRed(this.red)),
              (this.b = new n(t.b, 16).toRed(this.red)),
              (this.tinv = this.two.redInvm()),
              (this.zeroA = 0 === this.a.fromRed().cmpn(0)),
              (this.threeA = 0 === this.a.fromRed().sub(this.p).cmpn(-3)),
              (this.endo = this._getEndomorphism(t)),
              (this._endoWnafT1 = new Array(4)),
              (this._endoWnafT2 = new Array(4))
          }
          function h(t, e, r, i) {
            a.BasePoint.call(this, t, 'affine'),
              null === e && null === r
                ? ((this.x = null), (this.y = null), (this.inf = !0))
                : ((this.x = new n(e, 16)),
                  (this.y = new n(r, 16)),
                  i && (this.x.forceRed(this.curve.red), this.y.forceRed(this.curve.red)),
                  this.x.red || (this.x = this.x.toRed(this.curve.red)),
                  this.y.red || (this.y = this.y.toRed(this.curve.red)),
                  (this.inf = !1))
          }
          function c(t, e, r, i) {
            a.BasePoint.call(this, t, 'jacobian'),
              null === e && null === r && null === i
                ? ((this.x = this.curve.one), (this.y = this.curve.one), (this.z = new n(0)))
                : ((this.x = new n(e, 16)), (this.y = new n(r, 16)), (this.z = new n(i, 16))),
              this.x.red || (this.x = this.x.toRed(this.curve.red)),
              this.y.red || (this.y = this.y.toRed(this.curve.red)),
              this.z.red || (this.z = this.z.toRed(this.curve.red)),
              (this.zOne = this.z === this.curve.one)
          }
          o(f, a),
            (t.exports = f),
            (f.prototype._getEndomorphism = function (t) {
              if (this.zeroA && this.g && this.n && 1 === this.p.modn(3)) {
                var e, r
                if (t.beta) e = new n(t.beta, 16).toRed(this.red)
                else {
                  var i = this._getEndoRoots(this.p)
                  e = (e = i[0].cmp(i[1]) < 0 ? i[0] : i[1]).toRed(this.red)
                }
                if (t.lambda) r = new n(t.lambda, 16)
                else {
                  var o = this._getEndoRoots(this.n)
                  0 === this.g.mul(o[0]).x.cmp(this.g.x.redMul(e))
                    ? (r = o[0])
                    : ((r = o[1]), s(0 === this.g.mul(r).x.cmp(this.g.x.redMul(e))))
                }
                return {
                  beta: e,
                  lambda: r,
                  basis: t.basis
                    ? t.basis.map(function (t) {
                        return { a: new n(t.a, 16), b: new n(t.b, 16) }
                      })
                    : this._getEndoBasis(r),
                }
              }
            }),
            (f.prototype._getEndoRoots = function (t) {
              var e = t === this.p ? this.red : n.mont(t),
                r = new n(2).toRed(e).redInvm(),
                i = r.redNeg(),
                o = new n(3).toRed(e).redNeg().redSqrt().redMul(r)
              return [i.redAdd(o).fromRed(), i.redSub(o).fromRed()]
            }),
            (f.prototype._getEndoBasis = function (t) {
              for (
                var e,
                  r,
                  i,
                  o,
                  a,
                  s,
                  f,
                  h,
                  c,
                  u = this.n.ushrn(Math.floor(this.n.bitLength() / 2)),
                  d = t,
                  l = this.n.clone(),
                  p = new n(1),
                  b = new n(0),
                  m = new n(0),
                  y = new n(1),
                  g = 0;
                0 !== d.cmpn(0);

              ) {
                var v = l.div(d)
                ;(h = l.sub(v.mul(d))), (c = m.sub(v.mul(p)))
                var _ = y.sub(v.mul(b))
                if (!i && h.cmp(u) < 0) (e = f.neg()), (r = p), (i = h.neg()), (o = c)
                else if (i && 2 == ++g) break
                ;(f = h), (l = d), (d = h), (m = p), (p = c), (y = b), (b = _)
              }
              ;(a = h.neg()), (s = c)
              var w = i.sqr().add(o.sqr())
              return (
                a.sqr().add(s.sqr()).cmp(w) >= 0 && ((a = e), (s = r)),
                i.negative && ((i = i.neg()), (o = o.neg())),
                a.negative && ((a = a.neg()), (s = s.neg())),
                [
                  { a: i, b: o },
                  { a, b: s },
                ]
              )
            }),
            (f.prototype._endoSplit = function (t) {
              var e = this.endo.basis,
                r = e[0],
                i = e[1],
                n = i.b.mul(t).divRound(this.n),
                o = r.b.neg().mul(t).divRound(this.n),
                a = n.mul(r.a),
                s = o.mul(i.a),
                f = n.mul(r.b),
                h = o.mul(i.b)
              return { k1: t.sub(a).sub(s), k2: f.add(h).neg() }
            }),
            (f.prototype.pointFromX = function (t, e) {
              ;(t = new n(t, 16)).red || (t = t.toRed(this.red))
              var r = t.redSqr().redMul(t).redIAdd(t.redMul(this.a)).redIAdd(this.b),
                i = r.redSqrt()
              if (0 !== i.redSqr().redSub(r).cmp(this.zero)) throw new Error('invalid point')
              var o = i.fromRed().isOdd()
              return ((e && !o) || (!e && o)) && (i = i.redNeg()), this.point(t, i)
            }),
            (f.prototype.validate = function (t) {
              if (t.inf) return !0
              var e = t.x,
                r = t.y,
                i = this.a.redMul(e),
                n = e.redSqr().redMul(e).redIAdd(i).redIAdd(this.b)
              return 0 === r.redSqr().redISub(n).cmpn(0)
            }),
            (f.prototype._endoWnafMulAdd = function (t, e, r) {
              for (var i = this._endoWnafT1, n = this._endoWnafT2, o = 0; o < t.length; o++) {
                var a = this._endoSplit(e[o]),
                  s = t[o],
                  f = s._getBeta()
                a.k1.negative && (a.k1.ineg(), (s = s.neg(!0))),
                  a.k2.negative && (a.k2.ineg(), (f = f.neg(!0))),
                  (i[2 * o] = s),
                  (i[2 * o + 1] = f),
                  (n[2 * o] = a.k1),
                  (n[2 * o + 1] = a.k2)
              }
              for (var h = this._wnafMulAdd(1, i, n, 2 * o, r), c = 0; c < 2 * o; c++) (i[c] = null), (n[c] = null)
              return h
            }),
            o(h, a.BasePoint),
            (f.prototype.point = function (t, e, r) {
              return new h(this, t, e, r)
            }),
            (f.prototype.pointFromJSON = function (t, e) {
              return h.fromJSON(this, t, e)
            }),
            (h.prototype._getBeta = function () {
              if (this.curve.endo) {
                var t = this.precomputed
                if (t && t.beta) return t.beta
                var e = this.curve.point(this.x.redMul(this.curve.endo.beta), this.y)
                if (t) {
                  var r = this.curve,
                    i = function (t) {
                      return r.point(t.x.redMul(r.endo.beta), t.y)
                    }
                  ;(t.beta = e),
                    (e.precomputed = {
                      beta: null,
                      naf: t.naf && { wnd: t.naf.wnd, points: t.naf.points.map(i) },
                      doubles: t.doubles && { step: t.doubles.step, points: t.doubles.points.map(i) },
                    })
                }
                return e
              }
            }),
            (h.prototype.toJSON = function () {
              return this.precomputed
                ? [
                    this.x,
                    this.y,
                    this.precomputed && {
                      doubles: this.precomputed.doubles && {
                        step: this.precomputed.doubles.step,
                        points: this.precomputed.doubles.points.slice(1),
                      },
                      naf: this.precomputed.naf && {
                        wnd: this.precomputed.naf.wnd,
                        points: this.precomputed.naf.points.slice(1),
                      },
                    },
                  ]
                : [this.x, this.y]
            }),
            (h.fromJSON = function (t, e, r) {
              'string' == typeof e && (e = JSON.parse(e))
              var i = t.point(e[0], e[1], r)
              if (!e[2]) return i
              function n(e) {
                return t.point(e[0], e[1], r)
              }
              var o = e[2]
              return (
                (i.precomputed = {
                  beta: null,
                  doubles: o.doubles && { step: o.doubles.step, points: [i].concat(o.doubles.points.map(n)) },
                  naf: o.naf && { wnd: o.naf.wnd, points: [i].concat(o.naf.points.map(n)) },
                }),
                i
              )
            }),
            (h.prototype.inspect = function () {
              return this.isInfinity()
                ? '<EC Point Infinity>'
                : '<EC Point x: ' + this.x.fromRed().toString(16, 2) + ' y: ' + this.y.fromRed().toString(16, 2) + '>'
            }),
            (h.prototype.isInfinity = function () {
              return this.inf
            }),
            (h.prototype.add = function (t) {
              if (this.inf) return t
              if (t.inf) return this
              if (this.eq(t)) return this.dbl()
              if (this.neg().eq(t)) return this.curve.point(null, null)
              if (0 === this.x.cmp(t.x)) return this.curve.point(null, null)
              var e = this.y.redSub(t.y)
              0 !== e.cmpn(0) && (e = e.redMul(this.x.redSub(t.x).redInvm()))
              var r = e.redSqr().redISub(this.x).redISub(t.x),
                i = e.redMul(this.x.redSub(r)).redISub(this.y)
              return this.curve.point(r, i)
            }),
            (h.prototype.dbl = function () {
              if (this.inf) return this
              var t = this.y.redAdd(this.y)
              if (0 === t.cmpn(0)) return this.curve.point(null, null)
              var e = this.curve.a,
                r = this.x.redSqr(),
                i = t.redInvm(),
                n = r.redAdd(r).redIAdd(r).redIAdd(e).redMul(i),
                o = n.redSqr().redISub(this.x.redAdd(this.x)),
                a = n.redMul(this.x.redSub(o)).redISub(this.y)
              return this.curve.point(o, a)
            }),
            (h.prototype.getX = function () {
              return this.x.fromRed()
            }),
            (h.prototype.getY = function () {
              return this.y.fromRed()
            }),
            (h.prototype.mul = function (t) {
              return (
                (t = new n(t, 16)),
                this.isInfinity()
                  ? this
                  : this._hasDoubles(t)
                  ? this.curve._fixedNafMul(this, t)
                  : this.curve.endo
                  ? this.curve._endoWnafMulAdd([this], [t])
                  : this.curve._wnafMul(this, t)
              )
            }),
            (h.prototype.mulAdd = function (t, e, r) {
              var i = [this, e],
                n = [t, r]
              return this.curve.endo ? this.curve._endoWnafMulAdd(i, n) : this.curve._wnafMulAdd(1, i, n, 2)
            }),
            (h.prototype.jmulAdd = function (t, e, r) {
              var i = [this, e],
                n = [t, r]
              return this.curve.endo ? this.curve._endoWnafMulAdd(i, n, !0) : this.curve._wnafMulAdd(1, i, n, 2, !0)
            }),
            (h.prototype.eq = function (t) {
              return (
                this === t || (this.inf === t.inf && (this.inf || (0 === this.x.cmp(t.x) && 0 === this.y.cmp(t.y))))
              )
            }),
            (h.prototype.neg = function (t) {
              if (this.inf) return this
              var e = this.curve.point(this.x, this.y.redNeg())
              if (t && this.precomputed) {
                var r = this.precomputed,
                  i = function (t) {
                    return t.neg()
                  }
                e.precomputed = {
                  naf: r.naf && { wnd: r.naf.wnd, points: r.naf.points.map(i) },
                  doubles: r.doubles && { step: r.doubles.step, points: r.doubles.points.map(i) },
                }
              }
              return e
            }),
            (h.prototype.toJ = function () {
              return this.inf ? this.curve.jpoint(null, null, null) : this.curve.jpoint(this.x, this.y, this.curve.one)
            }),
            o(c, a.BasePoint),
            (f.prototype.jpoint = function (t, e, r) {
              return new c(this, t, e, r)
            }),
            (c.prototype.toP = function () {
              if (this.isInfinity()) return this.curve.point(null, null)
              var t = this.z.redInvm(),
                e = t.redSqr(),
                r = this.x.redMul(e),
                i = this.y.redMul(e).redMul(t)
              return this.curve.point(r, i)
            }),
            (c.prototype.neg = function () {
              return this.curve.jpoint(this.x, this.y.redNeg(), this.z)
            }),
            (c.prototype.add = function (t) {
              if (this.isInfinity()) return t
              if (t.isInfinity()) return this
              var e = t.z.redSqr(),
                r = this.z.redSqr(),
                i = this.x.redMul(e),
                n = t.x.redMul(r),
                o = this.y.redMul(e.redMul(t.z)),
                a = t.y.redMul(r.redMul(this.z)),
                s = i.redSub(n),
                f = o.redSub(a)
              if (0 === s.cmpn(0)) return 0 !== f.cmpn(0) ? this.curve.jpoint(null, null, null) : this.dbl()
              var h = s.redSqr(),
                c = h.redMul(s),
                u = i.redMul(h),
                d = f.redSqr().redIAdd(c).redISub(u).redISub(u),
                l = f.redMul(u.redISub(d)).redISub(o.redMul(c)),
                p = this.z.redMul(t.z).redMul(s)
              return this.curve.jpoint(d, l, p)
            }),
            (c.prototype.mixedAdd = function (t) {
              if (this.isInfinity()) return t.toJ()
              if (t.isInfinity()) return this
              var e = this.z.redSqr(),
                r = this.x,
                i = t.x.redMul(e),
                n = this.y,
                o = t.y.redMul(e).redMul(this.z),
                a = r.redSub(i),
                s = n.redSub(o)
              if (0 === a.cmpn(0)) return 0 !== s.cmpn(0) ? this.curve.jpoint(null, null, null) : this.dbl()
              var f = a.redSqr(),
                h = f.redMul(a),
                c = r.redMul(f),
                u = s.redSqr().redIAdd(h).redISub(c).redISub(c),
                d = s.redMul(c.redISub(u)).redISub(n.redMul(h)),
                l = this.z.redMul(a)
              return this.curve.jpoint(u, d, l)
            }),
            (c.prototype.dblp = function (t) {
              if (0 === t) return this
              if (this.isInfinity()) return this
              if (!t) return this.dbl()
              if (this.curve.zeroA || this.curve.threeA) {
                for (var e = this, r = 0; r < t; r++) e = e.dbl()
                return e
              }
              var i = this.curve.a,
                n = this.curve.tinv,
                o = this.x,
                a = this.y,
                s = this.z,
                f = s.redSqr().redSqr(),
                h = a.redAdd(a)
              for (r = 0; r < t; r++) {
                var c = o.redSqr(),
                  u = h.redSqr(),
                  d = u.redSqr(),
                  l = c.redAdd(c).redIAdd(c).redIAdd(i.redMul(f)),
                  p = o.redMul(u),
                  b = l.redSqr().redISub(p.redAdd(p)),
                  m = p.redISub(b),
                  y = l.redMul(m)
                y = y.redIAdd(y).redISub(d)
                var g = h.redMul(s)
                r + 1 < t && (f = f.redMul(d)), (o = b), (s = g), (h = y)
              }
              return this.curve.jpoint(o, h.redMul(n), s)
            }),
            (c.prototype.dbl = function () {
              return this.isInfinity()
                ? this
                : this.curve.zeroA
                ? this._zeroDbl()
                : this.curve.threeA
                ? this._threeDbl()
                : this._dbl()
            }),
            (c.prototype._zeroDbl = function () {
              var t, e, r
              if (this.zOne) {
                var i = this.x.redSqr(),
                  n = this.y.redSqr(),
                  o = n.redSqr(),
                  a = this.x.redAdd(n).redSqr().redISub(i).redISub(o)
                a = a.redIAdd(a)
                var s = i.redAdd(i).redIAdd(i),
                  f = s.redSqr().redISub(a).redISub(a),
                  h = o.redIAdd(o)
                ;(h = (h = h.redIAdd(h)).redIAdd(h)),
                  (t = f),
                  (e = s.redMul(a.redISub(f)).redISub(h)),
                  (r = this.y.redAdd(this.y))
              } else {
                var c = this.x.redSqr(),
                  u = this.y.redSqr(),
                  d = u.redSqr(),
                  l = this.x.redAdd(u).redSqr().redISub(c).redISub(d)
                l = l.redIAdd(l)
                var p = c.redAdd(c).redIAdd(c),
                  b = p.redSqr(),
                  m = d.redIAdd(d)
                ;(m = (m = m.redIAdd(m)).redIAdd(m)),
                  (t = b.redISub(l).redISub(l)),
                  (e = p.redMul(l.redISub(t)).redISub(m)),
                  (r = (r = this.y.redMul(this.z)).redIAdd(r))
              }
              return this.curve.jpoint(t, e, r)
            }),
            (c.prototype._threeDbl = function () {
              var t, e, r
              if (this.zOne) {
                var i = this.x.redSqr(),
                  n = this.y.redSqr(),
                  o = n.redSqr(),
                  a = this.x.redAdd(n).redSqr().redISub(i).redISub(o)
                a = a.redIAdd(a)
                var s = i.redAdd(i).redIAdd(i).redIAdd(this.curve.a),
                  f = s.redSqr().redISub(a).redISub(a)
                t = f
                var h = o.redIAdd(o)
                ;(h = (h = h.redIAdd(h)).redIAdd(h)),
                  (e = s.redMul(a.redISub(f)).redISub(h)),
                  (r = this.y.redAdd(this.y))
              } else {
                var c = this.z.redSqr(),
                  u = this.y.redSqr(),
                  d = this.x.redMul(u),
                  l = this.x.redSub(c).redMul(this.x.redAdd(c))
                l = l.redAdd(l).redIAdd(l)
                var p = d.redIAdd(d),
                  b = (p = p.redIAdd(p)).redAdd(p)
                ;(t = l.redSqr().redISub(b)), (r = this.y.redAdd(this.z).redSqr().redISub(u).redISub(c))
                var m = u.redSqr()
                ;(m = (m = (m = m.redIAdd(m)).redIAdd(m)).redIAdd(m)), (e = l.redMul(p.redISub(t)).redISub(m))
              }
              return this.curve.jpoint(t, e, r)
            }),
            (c.prototype._dbl = function () {
              var t = this.curve.a,
                e = this.x,
                r = this.y,
                i = this.z,
                n = i.redSqr().redSqr(),
                o = e.redSqr(),
                a = r.redSqr(),
                s = o.redAdd(o).redIAdd(o).redIAdd(t.redMul(n)),
                f = e.redAdd(e),
                h = (f = f.redIAdd(f)).redMul(a),
                c = s.redSqr().redISub(h.redAdd(h)),
                u = h.redISub(c),
                d = a.redSqr()
              d = (d = (d = d.redIAdd(d)).redIAdd(d)).redIAdd(d)
              var l = s.redMul(u).redISub(d),
                p = r.redAdd(r).redMul(i)
              return this.curve.jpoint(c, l, p)
            }),
            (c.prototype.trpl = function () {
              if (!this.curve.zeroA) return this.dbl().add(this)
              var t = this.x.redSqr(),
                e = this.y.redSqr(),
                r = this.z.redSqr(),
                i = e.redSqr(),
                n = t.redAdd(t).redIAdd(t),
                o = n.redSqr(),
                a = this.x.redAdd(e).redSqr().redISub(t).redISub(i),
                s = (a = (a = (a = a.redIAdd(a)).redAdd(a).redIAdd(a)).redISub(o)).redSqr(),
                f = i.redIAdd(i)
              f = (f = (f = f.redIAdd(f)).redIAdd(f)).redIAdd(f)
              var h = n.redIAdd(a).redSqr().redISub(o).redISub(s).redISub(f),
                c = e.redMul(h)
              c = (c = c.redIAdd(c)).redIAdd(c)
              var u = this.x.redMul(s).redISub(c)
              u = (u = u.redIAdd(u)).redIAdd(u)
              var d = this.y.redMul(h.redMul(f.redISub(h)).redISub(a.redMul(s)))
              d = (d = (d = d.redIAdd(d)).redIAdd(d)).redIAdd(d)
              var l = this.z.redAdd(a).redSqr().redISub(r).redISub(s)
              return this.curve.jpoint(u, d, l)
            }),
            (c.prototype.mul = function (t, e) {
              return (t = new n(t, e)), this.curve._wnafMul(this, t)
            }),
            (c.prototype.eq = function (t) {
              if ('affine' === t.type) return this.eq(t.toJ())
              if (this === t) return !0
              var e = this.z.redSqr(),
                r = t.z.redSqr()
              if (0 !== this.x.redMul(r).redISub(t.x.redMul(e)).cmpn(0)) return !1
              var i = e.redMul(this.z),
                n = r.redMul(t.z)
              return 0 === this.y.redMul(n).redISub(t.y.redMul(i)).cmpn(0)
            }),
            (c.prototype.eqXToP = function (t) {
              var e = this.z.redSqr(),
                r = t.toRed(this.curve.red).redMul(e)
              if (0 === this.x.cmp(r)) return !0
              for (var i = t.clone(), n = this.curve.redN.redMul(e); ; ) {
                if ((i.iadd(this.curve.n), i.cmp(this.curve.p) >= 0)) return !1
                if ((r.redIAdd(n), 0 === this.x.cmp(r))) return !0
              }
            }),
            (c.prototype.inspect = function () {
              return this.isInfinity()
                ? '<EC JPoint Infinity>'
                : '<EC JPoint x: ' +
                    this.x.toString(16, 2) +
                    ' y: ' +
                    this.y.toString(16, 2) +
                    ' z: ' +
                    this.z.toString(16, 2) +
                    '>'
            }),
            (c.prototype.isInfinity = function () {
              return 0 === this.z.cmpn(0)
            })
        },
        274: (t, e, r) => {
          'use strict'
          var i,
            n = e,
            o = r(5582),
            a = r(9766),
            s = r(19).assert
          function f(t) {
            'short' === t.type
              ? (this.curve = new a.short(t))
              : 'edwards' === t.type
              ? (this.curve = new a.edwards(t))
              : (this.curve = new a.mont(t)),
              (this.g = this.curve.g),
              (this.n = this.curve.n),
              (this.hash = t.hash),
              s(this.g.validate(), 'Invalid curve'),
              s(this.g.mul(this.n).isInfinity(), 'Invalid curve, G*N != O')
          }
          function h(t, e) {
            Object.defineProperty(n, t, {
              configurable: !0,
              enumerable: !0,
              get: function () {
                var r = new f(e)
                return Object.defineProperty(n, t, { configurable: !0, enumerable: !0, value: r }), r
              },
            })
          }
          ;(n.PresetCurve = f),
            h('p192', {
              type: 'short',
              prime: 'p192',
              p: 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff',
              a: 'ffffffff ffffffff ffffffff fffffffe ffffffff fffffffc',
              b: '64210519 e59c80e7 0fa7e9ab 72243049 feb8deec c146b9b1',
              n: 'ffffffff ffffffff ffffffff 99def836 146bc9b1 b4d22831',
              hash: o.sha256,
              gRed: !1,
              g: [
                '188da80e b03090f6 7cbf20eb 43a18800 f4ff0afd 82ff1012',
                '07192b95 ffc8da78 631011ed 6b24cdd5 73f977a1 1e794811',
              ],
            }),
            h('p224', {
              type: 'short',
              prime: 'p224',
              p: 'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001',
              a: 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff fffffffe',
              b: 'b4050a85 0c04b3ab f5413256 5044b0b7 d7bfd8ba 270b3943 2355ffb4',
              n: 'ffffffff ffffffff ffffffff ffff16a2 e0b8f03e 13dd2945 5c5c2a3d',
              hash: o.sha256,
              gRed: !1,
              g: [
                'b70e0cbd 6bb4bf7f 321390b9 4a03c1d3 56c21122 343280d6 115c1d21',
                'bd376388 b5f723fb 4c22dfe6 cd4375a0 5a074764 44d58199 85007e34',
              ],
            }),
            h('p256', {
              type: 'short',
              prime: null,
              p: 'ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff ffffffff',
              a: 'ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff fffffffc',
              b: '5ac635d8 aa3a93e7 b3ebbd55 769886bc 651d06b0 cc53b0f6 3bce3c3e 27d2604b',
              n: 'ffffffff 00000000 ffffffff ffffffff bce6faad a7179e84 f3b9cac2 fc632551',
              hash: o.sha256,
              gRed: !1,
              g: [
                '6b17d1f2 e12c4247 f8bce6e5 63a440f2 77037d81 2deb33a0 f4a13945 d898c296',
                '4fe342e2 fe1a7f9b 8ee7eb4a 7c0f9e16 2bce3357 6b315ece cbb64068 37bf51f5',
              ],
            }),
            h('p384', {
              type: 'short',
              prime: null,
              p: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe ffffffff 00000000 00000000 ffffffff',
              a: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe ffffffff 00000000 00000000 fffffffc',
              b: 'b3312fa7 e23ee7e4 988e056b e3f82d19 181d9c6e fe814112 0314088f 5013875a c656398d 8a2ed19d 2a85c8ed d3ec2aef',
              n: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff c7634d81 f4372ddf 581a0db2 48b0a77a ecec196a ccc52973',
              hash: o.sha384,
              gRed: !1,
              g: [
                'aa87ca22 be8b0537 8eb1c71e f320ad74 6e1d3b62 8ba79b98 59f741e0 82542a38 5502f25d bf55296c 3a545e38 72760ab7',
                '3617de4a 96262c6f 5d9e98bf 9292dc29 f8f41dbd 289a147c e9da3113 b5f0b8c0 0a60b1ce 1d7e819d 7a431d7c 90ea0e5f',
              ],
            }),
            h('p521', {
              type: 'short',
              prime: null,
              p: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff',
              a: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffc',
              b: '00000051 953eb961 8e1c9a1f 929a21a0 b68540ee a2da725b 99b315f3 b8b48991 8ef109e1 56193951 ec7e937b 1652c0bd 3bb1bf07 3573df88 3d2c34f1 ef451fd4 6b503f00',
              n: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffa 51868783 bf2f966b 7fcc0148 f709a5d0 3bb5c9b8 899c47ae bb6fb71e 91386409',
              hash: o.sha512,
              gRed: !1,
              g: [
                '000000c6 858e06b7 0404e9cd 9e3ecb66 2395b442 9c648139 053fb521 f828af60 6b4d3dba a14b5e77 efe75928 fe1dc127 a2ffa8de 3348b3c1 856a429b f97e7e31 c2e5bd66',
                '00000118 39296a78 9a3bc004 5c8a5fb4 2c7d1bd9 98f54449 579b4468 17afbd17 273e662c 97ee7299 5ef42640 c550b901 3fad0761 353c7086 a272c240 88be9476 9fd16650',
              ],
            }),
            h('curve25519', {
              type: 'mont',
              prime: 'p25519',
              p: '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed',
              a: '76d06',
              b: '1',
              n: '1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed',
              hash: o.sha256,
              gRed: !1,
              g: ['9'],
            }),
            h('ed25519', {
              type: 'edwards',
              prime: 'p25519',
              p: '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed',
              a: '-1',
              c: '1',
              d: '52036cee2b6ffe73 8cc740797779e898 00700a4d4141d8ab 75eb4dca135978a3',
              n: '1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed',
              hash: o.sha256,
              gRed: !1,
              g: [
                '216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a',
                '6666666666666666666666666666666666666666666666666666666666666658',
              ],
            })
          try {
            i = r(2392)
          } catch (t) {
            i = void 0
          }
          h('secp256k1', {
            type: 'short',
            prime: 'k256',
            p: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f',
            a: '0',
            b: '7',
            n: 'ffffffff ffffffff ffffffff fffffffe baaedce6 af48a03b bfd25e8c d0364141',
            h: '1',
            hash: o.sha256,
            beta: '7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee',
            lambda: '5363ad4cc05c30e0a5261c028812645a122e22ea20816678df02967c1b23bd72',
            basis: [
              { a: '3086d221a7d46bcde86c90e49284eb15', b: '-e4437ed6010e88286f547fa90abfe4c3' },
              { a: '114ca50f7a8e2f3f657c1108d9d44cfd8', b: '3086d221a7d46bcde86c90e49284eb15' },
            ],
            gRed: !1,
            g: [
              '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
              '483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
              i,
            ],
          })
        },
        4848: (t, e, r) => {
          'use strict'
          var i = r(5612),
            n = r(4227),
            o = r(19),
            a = r(274),
            s = r(5229),
            f = o.assert,
            h = r(6461),
            c = r(2525)
          function u(t) {
            if (!(this instanceof u)) return new u(t)
            'string' == typeof t && (f(a.hasOwnProperty(t), 'Unknown curve ' + t), (t = a[t])),
              t instanceof a.PresetCurve && (t = { curve: t }),
              (this.curve = t.curve.curve),
              (this.n = this.curve.n),
              (this.nh = this.n.ushrn(1)),
              (this.g = this.curve.g),
              (this.g = t.curve.g),
              this.g.precompute(t.curve.n.bitLength() + 1),
              (this.hash = t.hash || t.curve.hash)
          }
          ;(t.exports = u),
            (u.prototype.keyPair = function (t) {
              return new h(this, t)
            }),
            (u.prototype.keyFromPrivate = function (t, e) {
              return h.fromPrivate(this, t, e)
            }),
            (u.prototype.keyFromPublic = function (t, e) {
              return h.fromPublic(this, t, e)
            }),
            (u.prototype.genKeyPair = function (t) {
              t || (t = {})
              for (
                var e = new n({
                    hash: this.hash,
                    pers: t.pers,
                    persEnc: t.persEnc || 'utf8',
                    entropy: t.entropy || s(this.hash.hmacStrength),
                    entropyEnc: (t.entropy && t.entropyEnc) || 'utf8',
                    nonce: this.n.toArray(),
                  }),
                  r = this.n.byteLength(),
                  o = this.n.sub(new i(2));
                ;

              ) {
                var a = new i(e.generate(r))
                if (!(a.cmp(o) > 0)) return a.iaddn(1), this.keyFromPrivate(a)
              }
            }),
            (u.prototype._truncateToN = function (t, e) {
              var r = 8 * t.byteLength() - this.n.bitLength()
              return r > 0 && (t = t.ushrn(r)), !e && t.cmp(this.n) >= 0 ? t.sub(this.n) : t
            }),
            (u.prototype.sign = function (t, e, r, o) {
              'object' == typeof r && ((o = r), (r = null)),
                o || (o = {}),
                (e = this.keyFromPrivate(e, r)),
                (t = this._truncateToN(new i(t, 16)))
              for (
                var a = this.n.byteLength(),
                  s = e.getPrivate().toArray('be', a),
                  f = t.toArray('be', a),
                  h = new n({ hash: this.hash, entropy: s, nonce: f, pers: o.pers, persEnc: o.persEnc || 'utf8' }),
                  u = this.n.sub(new i(1)),
                  d = 0;
                ;
                d++
              ) {
                var l = o.k ? o.k(d) : new i(h.generate(this.n.byteLength()))
                if (!((l = this._truncateToN(l, !0)).cmpn(1) <= 0 || l.cmp(u) >= 0)) {
                  var p = this.g.mul(l)
                  if (!p.isInfinity()) {
                    var b = p.getX(),
                      m = b.umod(this.n)
                    if (0 !== m.cmpn(0)) {
                      var y = l.invm(this.n).mul(m.mul(e.getPrivate()).iadd(t))
                      if (0 !== (y = y.umod(this.n)).cmpn(0)) {
                        var g = (p.getY().isOdd() ? 1 : 0) | (0 !== b.cmp(m) ? 2 : 0)
                        return (
                          o.canonical && y.cmp(this.nh) > 0 && ((y = this.n.sub(y)), (g ^= 1)),
                          new c({ r: m, s: y, recoveryParam: g })
                        )
                      }
                    }
                  }
                }
              }
            }),
            (u.prototype.verify = function (t, e, r, n) {
              ;(t = this._truncateToN(new i(t, 16))), (r = this.keyFromPublic(r, n))
              var o = (e = new c(e, 'hex')).r,
                a = e.s
              if (o.cmpn(1) < 0 || o.cmp(this.n) >= 0) return !1
              if (a.cmpn(1) < 0 || a.cmp(this.n) >= 0) return !1
              var s,
                f = a.invm(this.n),
                h = f.mul(t).umod(this.n),
                u = f.mul(o).umod(this.n)
              return this.curve._maxwellTrick
                ? !(s = this.g.jmulAdd(h, r.getPublic(), u)).isInfinity() && s.eqXToP(o)
                : !(s = this.g.mulAdd(h, r.getPublic(), u)).isInfinity() && 0 === s.getX().umod(this.n).cmp(o)
            }),
            (u.prototype.recoverPubKey = function (t, e, r, n) {
              f((3 & r) === r, 'The recovery param is more than two bits'), (e = new c(e, n))
              var o = this.n,
                a = new i(t),
                s = e.r,
                h = e.s,
                u = 1 & r,
                d = r >> 1
              if (s.cmp(this.curve.p.umod(this.curve.n)) >= 0 && d)
                throw new Error('Unable to find sencond key candinate')
              s = d ? this.curve.pointFromX(s.add(this.curve.n), u) : this.curve.pointFromX(s, u)
              var l = e.r.invm(o),
                p = o.sub(a).mul(l).umod(o),
                b = h.mul(l).umod(o)
              return this.g.mulAdd(p, s, b)
            }),
            (u.prototype.getKeyRecoveryParam = function (t, e, r, i) {
              if (null !== (e = new c(e, i)).recoveryParam) return e.recoveryParam
              for (var n = 0; n < 4; n++) {
                var o
                try {
                  o = this.recoverPubKey(t, e, n)
                } catch (t) {
                  continue
                }
                if (o.eq(r)) return n
              }
              throw new Error('Unable to find valid recovery factor')
            })
        },
        6461: (t, e, r) => {
          'use strict'
          var i = r(5612),
            n = r(19).assert
          function o(t, e) {
            ;(this.ec = t),
              (this.priv = null),
              (this.pub = null),
              e.priv && this._importPrivate(e.priv, e.privEnc),
              e.pub && this._importPublic(e.pub, e.pubEnc)
          }
          ;(t.exports = o),
            (o.fromPublic = function (t, e, r) {
              return e instanceof o ? e : new o(t, { pub: e, pubEnc: r })
            }),
            (o.fromPrivate = function (t, e, r) {
              return e instanceof o ? e : new o(t, { priv: e, privEnc: r })
            }),
            (o.prototype.validate = function () {
              var t = this.getPublic()
              return t.isInfinity()
                ? { result: !1, reason: 'Invalid public key' }
                : t.validate()
                ? t.mul(this.ec.curve.n).isInfinity()
                  ? { result: !0, reason: null }
                  : { result: !1, reason: 'Public key * N != O' }
                : { result: !1, reason: 'Public key is not a point' }
            }),
            (o.prototype.getPublic = function (t, e) {
              return (
                'string' == typeof t && ((e = t), (t = null)),
                this.pub || (this.pub = this.ec.g.mul(this.priv)),
                e ? this.pub.encode(e, t) : this.pub
              )
            }),
            (o.prototype.getPrivate = function (t) {
              return 'hex' === t ? this.priv.toString(16, 2) : this.priv
            }),
            (o.prototype._importPrivate = function (t, e) {
              ;(this.priv = new i(t, e || 16)), (this.priv = this.priv.umod(this.ec.curve.n))
            }),
            (o.prototype._importPublic = function (t, e) {
              if (t.x || t.y)
                return (
                  'mont' === this.ec.curve.type
                    ? n(t.x, 'Need x coordinate')
                    : ('short' !== this.ec.curve.type && 'edwards' !== this.ec.curve.type) ||
                      n(t.x && t.y, 'Need both x and y coordinate'),
                  void (this.pub = this.ec.curve.point(t.x, t.y))
                )
              this.pub = this.ec.curve.decodePoint(t, e)
            }),
            (o.prototype.derive = function (t) {
              return t.mul(this.priv).getX()
            }),
            (o.prototype.sign = function (t, e, r) {
              return this.ec.sign(t, this, e, r)
            }),
            (o.prototype.verify = function (t, e) {
              return this.ec.verify(t, e, this)
            }),
            (o.prototype.inspect = function () {
              return (
                '<Key priv: ' +
                (this.priv && this.priv.toString(16, 2)) +
                ' pub: ' +
                (this.pub && this.pub.inspect()) +
                ' >'
              )
            })
        },
        2525: (t, e, r) => {
          'use strict'
          var i = r(5612),
            n = r(19),
            o = n.assert
          function a(t, e) {
            if (t instanceof a) return t
            this._importDER(t, e) ||
              (o(t.r && t.s, 'Signature without r or s'),
              (this.r = new i(t.r, 16)),
              (this.s = new i(t.s, 16)),
              void 0 === t.recoveryParam ? (this.recoveryParam = null) : (this.recoveryParam = t.recoveryParam))
          }
          function s() {
            this.place = 0
          }
          function f(t, e) {
            var r = t[e.place++]
            if (!(128 & r)) return r
            var i = 15 & r
            if (0 === i || i > 4) return !1
            for (var n = 0, o = 0, a = e.place; o < i; o++, a++) (n <<= 8), (n |= t[a]), (n >>>= 0)
            return !(n <= 127) && ((e.place = a), n)
          }
          function h(t) {
            for (var e = 0, r = t.length - 1; !t[e] && !(128 & t[e + 1]) && e < r; ) e++
            return 0 === e ? t : t.slice(e)
          }
          function c(t, e) {
            if (e < 128) t.push(e)
            else {
              var r = 1 + ((Math.log(e) / Math.LN2) >>> 3)
              for (t.push(128 | r); --r; ) t.push((e >>> (r << 3)) & 255)
              t.push(e)
            }
          }
          ;(t.exports = a),
            (a.prototype._importDER = function (t, e) {
              t = n.toArray(t, e)
              var r = new s()
              if (48 !== t[r.place++]) return !1
              var o = f(t, r)
              if (!1 === o) return !1
              if (o + r.place !== t.length) return !1
              if (2 !== t[r.place++]) return !1
              var a = f(t, r)
              if (!1 === a) return !1
              var h = t.slice(r.place, a + r.place)
              if (((r.place += a), 2 !== t[r.place++])) return !1
              var c = f(t, r)
              if (!1 === c) return !1
              if (t.length !== c + r.place) return !1
              var u = t.slice(r.place, c + r.place)
              if (0 === h[0]) {
                if (!(128 & h[1])) return !1
                h = h.slice(1)
              }
              if (0 === u[0]) {
                if (!(128 & u[1])) return !1
                u = u.slice(1)
              }
              return (this.r = new i(h)), (this.s = new i(u)), (this.recoveryParam = null), !0
            }),
            (a.prototype.toDER = function (t) {
              var e = this.r.toArray(),
                r = this.s.toArray()
              for (
                128 & e[0] && (e = [0].concat(e)), 128 & r[0] && (r = [0].concat(r)), e = h(e), r = h(r);
                !(r[0] || 128 & r[1]);

              )
                r = r.slice(1)
              var i = [2]
              c(i, e.length), (i = i.concat(e)).push(2), c(i, r.length)
              var o = i.concat(r),
                a = [48]
              return c(a, o.length), (a = a.concat(o)), n.encode(a, t)
            })
        },
        7004: (t, e, r) => {
          'use strict'
          var i = r(5582),
            n = r(274),
            o = r(19),
            a = o.assert,
            s = o.parseBytes,
            f = r(2774),
            h = r(696)
          function c(t) {
            if ((a('ed25519' === t, 'only tested with ed25519 so far'), !(this instanceof c))) return new c(t)
            ;(t = n[t].curve),
              (this.curve = t),
              (this.g = t.g),
              this.g.precompute(t.n.bitLength() + 1),
              (this.pointClass = t.point().constructor),
              (this.encodingLength = Math.ceil(t.n.bitLength() / 8)),
              (this.hash = i.sha512)
          }
          ;(t.exports = c),
            (c.prototype.sign = function (t, e) {
              t = s(t)
              var r = this.keyFromSecret(e),
                i = this.hashInt(r.messagePrefix(), t),
                n = this.g.mul(i),
                o = this.encodePoint(n),
                a = this.hashInt(o, r.pubBytes(), t).mul(r.priv()),
                f = i.add(a).umod(this.curve.n)
              return this.makeSignature({ R: n, S: f, Rencoded: o })
            }),
            (c.prototype.verify = function (t, e, r) {
              ;(t = s(t)), (e = this.makeSignature(e))
              var i = this.keyFromPublic(r),
                n = this.hashInt(e.Rencoded(), i.pubBytes(), t),
                o = this.g.mul(e.S())
              return e.R().add(i.pub().mul(n)).eq(o)
            }),
            (c.prototype.hashInt = function () {
              for (var t = this.hash(), e = 0; e < arguments.length; e++) t.update(arguments[e])
              return o.intFromLE(t.digest()).umod(this.curve.n)
            }),
            (c.prototype.keyFromPublic = function (t) {
              return f.fromPublic(this, t)
            }),
            (c.prototype.keyFromSecret = function (t) {
              return f.fromSecret(this, t)
            }),
            (c.prototype.makeSignature = function (t) {
              return t instanceof h ? t : new h(this, t)
            }),
            (c.prototype.encodePoint = function (t) {
              var e = t.getY().toArray('le', this.encodingLength)
              return (e[this.encodingLength - 1] |= t.getX().isOdd() ? 128 : 0), e
            }),
            (c.prototype.decodePoint = function (t) {
              var e = (t = o.parseBytes(t)).length - 1,
                r = t.slice(0, e).concat(-129 & t[e]),
                i = 0 != (128 & t[e]),
                n = o.intFromLE(r)
              return this.curve.pointFromY(n, i)
            }),
            (c.prototype.encodeInt = function (t) {
              return t.toArray('le', this.encodingLength)
            }),
            (c.prototype.decodeInt = function (t) {
              return o.intFromLE(t)
            }),
            (c.prototype.isPoint = function (t) {
              return t instanceof this.pointClass
            })
        },
        2774: (t, e, r) => {
          'use strict'
          var i = r(19),
            n = i.assert,
            o = i.parseBytes,
            a = i.cachedProperty
          function s(t, e) {
            ;(this.eddsa = t),
              (this._secret = o(e.secret)),
              t.isPoint(e.pub) ? (this._pub = e.pub) : (this._pubBytes = o(e.pub))
          }
          ;(s.fromPublic = function (t, e) {
            return e instanceof s ? e : new s(t, { pub: e })
          }),
            (s.fromSecret = function (t, e) {
              return e instanceof s ? e : new s(t, { secret: e })
            }),
            (s.prototype.secret = function () {
              return this._secret
            }),
            a(s, 'pubBytes', function () {
              return this.eddsa.encodePoint(this.pub())
            }),
            a(s, 'pub', function () {
              return this._pubBytes ? this.eddsa.decodePoint(this._pubBytes) : this.eddsa.g.mul(this.priv())
            }),
            a(s, 'privBytes', function () {
              var t = this.eddsa,
                e = this.hash(),
                r = t.encodingLength - 1,
                i = e.slice(0, t.encodingLength)
              return (i[0] &= 248), (i[r] &= 127), (i[r] |= 64), i
            }),
            a(s, 'priv', function () {
              return this.eddsa.decodeInt(this.privBytes())
            }),
            a(s, 'hash', function () {
              return this.eddsa.hash().update(this.secret()).digest()
            }),
            a(s, 'messagePrefix', function () {
              return this.hash().slice(this.eddsa.encodingLength)
            }),
            (s.prototype.sign = function (t) {
              return n(this._secret, 'KeyPair can only verify'), this.eddsa.sign(t, this)
            }),
            (s.prototype.verify = function (t, e) {
              return this.eddsa.verify(t, e, this)
            }),
            (s.prototype.getSecret = function (t) {
              return n(this._secret, 'KeyPair is public only'), i.encode(this.secret(), t)
            }),
            (s.prototype.getPublic = function (t) {
              return i.encode(this.pubBytes(), t)
            }),
            (t.exports = s)
        },
        696: (t, e, r) => {
          'use strict'
          var i = r(5612),
            n = r(19),
            o = n.assert,
            a = n.cachedProperty,
            s = n.parseBytes
          function f(t, e) {
            ;(this.eddsa = t),
              'object' != typeof e && (e = s(e)),
              Array.isArray(e) && (e = { R: e.slice(0, t.encodingLength), S: e.slice(t.encodingLength) }),
              o(e.R && e.S, 'Signature without R or S'),
              t.isPoint(e.R) && (this._R = e.R),
              e.S instanceof i && (this._S = e.S),
              (this._Rencoded = Array.isArray(e.R) ? e.R : e.Rencoded),
              (this._Sencoded = Array.isArray(e.S) ? e.S : e.Sencoded)
          }
          a(f, 'S', function () {
            return this.eddsa.decodeInt(this.Sencoded())
          }),
            a(f, 'R', function () {
              return this.eddsa.decodePoint(this.Rencoded())
            }),
            a(f, 'Rencoded', function () {
              return this.eddsa.encodePoint(this.R())
            }),
            a(f, 'Sencoded', function () {
              return this.eddsa.encodeInt(this.S())
            }),
            (f.prototype.toBytes = function () {
              return this.Rencoded().concat(this.Sencoded())
            }),
            (f.prototype.toHex = function () {
              return n.encode(this.toBytes(), 'hex').toUpperCase()
            }),
            (t.exports = f)
        },
        2392: (t) => {
          t.exports = {
            doubles: {
              step: 4,
              points: [
                [
                  'e60fce93b59e9ec53011aabc21c23e97b2a31369b87a5ae9c44ee89e2a6dec0a',
                  'f7e3507399e595929db99f34f57937101296891e44d23f0be1f32cce69616821',
                ],
                [
                  '8282263212c609d9ea2a6e3e172de238d8c39cabd5ac1ca10646e23fd5f51508',
                  '11f8a8098557dfe45e8256e830b60ace62d613ac2f7b17bed31b6eaff6e26caf',
                ],
                [
                  '175e159f728b865a72f99cc6c6fc846de0b93833fd2222ed73fce5b551e5b739',
                  'd3506e0d9e3c79eba4ef97a51ff71f5eacb5955add24345c6efa6ffee9fed695',
                ],
                [
                  '363d90d447b00c9c99ceac05b6262ee053441c7e55552ffe526bad8f83ff4640',
                  '4e273adfc732221953b445397f3363145b9a89008199ecb62003c7f3bee9de9',
                ],
                [
                  '8b4b5f165df3c2be8c6244b5b745638843e4a781a15bcd1b69f79a55dffdf80c',
                  '4aad0a6f68d308b4b3fbd7813ab0da04f9e336546162ee56b3eff0c65fd4fd36',
                ],
                [
                  '723cbaa6e5db996d6bf771c00bd548c7b700dbffa6c0e77bcb6115925232fcda',
                  '96e867b5595cc498a921137488824d6e2660a0653779494801dc069d9eb39f5f',
                ],
                [
                  'eebfa4d493bebf98ba5feec812c2d3b50947961237a919839a533eca0e7dd7fa',
                  '5d9a8ca3970ef0f269ee7edaf178089d9ae4cdc3a711f712ddfd4fdae1de8999',
                ],
                [
                  '100f44da696e71672791d0a09b7bde459f1215a29b3c03bfefd7835b39a48db0',
                  'cdd9e13192a00b772ec8f3300c090666b7ff4a18ff5195ac0fbd5cd62bc65a09',
                ],
                [
                  'e1031be262c7ed1b1dc9227a4a04c017a77f8d4464f3b3852c8acde6e534fd2d',
                  '9d7061928940405e6bb6a4176597535af292dd419e1ced79a44f18f29456a00d',
                ],
                [
                  'feea6cae46d55b530ac2839f143bd7ec5cf8b266a41d6af52d5e688d9094696d',
                  'e57c6b6c97dce1bab06e4e12bf3ecd5c981c8957cc41442d3155debf18090088',
                ],
                [
                  'da67a91d91049cdcb367be4be6ffca3cfeed657d808583de33fa978bc1ec6cb1',
                  '9bacaa35481642bc41f463f7ec9780e5dec7adc508f740a17e9ea8e27a68be1d',
                ],
                [
                  '53904faa0b334cdda6e000935ef22151ec08d0f7bb11069f57545ccc1a37b7c0',
                  '5bc087d0bc80106d88c9eccac20d3c1c13999981e14434699dcb096b022771c8',
                ],
                [
                  '8e7bcd0bd35983a7719cca7764ca906779b53a043a9b8bcaeff959f43ad86047',
                  '10b7770b2a3da4b3940310420ca9514579e88e2e47fd68b3ea10047e8460372a',
                ],
                [
                  '385eed34c1cdff21e6d0818689b81bde71a7f4f18397e6690a841e1599c43862',
                  '283bebc3e8ea23f56701de19e9ebf4576b304eec2086dc8cc0458fe5542e5453',
                ],
                [
                  '6f9d9b803ecf191637c73a4413dfa180fddf84a5947fbc9c606ed86c3fac3a7',
                  '7c80c68e603059ba69b8e2a30e45c4d47ea4dd2f5c281002d86890603a842160',
                ],
                [
                  '3322d401243c4e2582a2147c104d6ecbf774d163db0f5e5313b7e0e742d0e6bd',
                  '56e70797e9664ef5bfb019bc4ddaf9b72805f63ea2873af624f3a2e96c28b2a0',
                ],
                [
                  '85672c7d2de0b7da2bd1770d89665868741b3f9af7643397721d74d28134ab83',
                  '7c481b9b5b43b2eb6374049bfa62c2e5e77f17fcc5298f44c8e3094f790313a6',
                ],
                [
                  '948bf809b1988a46b06c9f1919413b10f9226c60f668832ffd959af60c82a0a',
                  '53a562856dcb6646dc6b74c5d1c3418c6d4dff08c97cd2bed4cb7f88d8c8e589',
                ],
                [
                  '6260ce7f461801c34f067ce0f02873a8f1b0e44dfc69752accecd819f38fd8e8',
                  'bc2da82b6fa5b571a7f09049776a1ef7ecd292238051c198c1a84e95b2b4ae17',
                ],
                [
                  'e5037de0afc1d8d43d8348414bbf4103043ec8f575bfdc432953cc8d2037fa2d',
                  '4571534baa94d3b5f9f98d09fb990bddbd5f5b03ec481f10e0e5dc841d755bda',
                ],
                [
                  'e06372b0f4a207adf5ea905e8f1771b4e7e8dbd1c6a6c5b725866a0ae4fce725',
                  '7a908974bce18cfe12a27bb2ad5a488cd7484a7787104870b27034f94eee31dd',
                ],
                [
                  '213c7a715cd5d45358d0bbf9dc0ce02204b10bdde2a3f58540ad6908d0559754',
                  '4b6dad0b5ae462507013ad06245ba190bb4850f5f36a7eeddff2c27534b458f2',
                ],
                [
                  '4e7c272a7af4b34e8dbb9352a5419a87e2838c70adc62cddf0cc3a3b08fbd53c',
                  '17749c766c9d0b18e16fd09f6def681b530b9614bff7dd33e0b3941817dcaae6',
                ],
                [
                  'fea74e3dbe778b1b10f238ad61686aa5c76e3db2be43057632427e2840fb27b6',
                  '6e0568db9b0b13297cf674deccb6af93126b596b973f7b77701d3db7f23cb96f',
                ],
                [
                  '76e64113f677cf0e10a2570d599968d31544e179b760432952c02a4417bdde39',
                  'c90ddf8dee4e95cf577066d70681f0d35e2a33d2b56d2032b4b1752d1901ac01',
                ],
                [
                  'c738c56b03b2abe1e8281baa743f8f9a8f7cc643df26cbee3ab150242bcbb891',
                  '893fb578951ad2537f718f2eacbfbbbb82314eef7880cfe917e735d9699a84c3',
                ],
                [
                  'd895626548b65b81e264c7637c972877d1d72e5f3a925014372e9f6588f6c14b',
                  'febfaa38f2bc7eae728ec60818c340eb03428d632bb067e179363ed75d7d991f',
                ],
                [
                  'b8da94032a957518eb0f6433571e8761ceffc73693e84edd49150a564f676e03',
                  '2804dfa44805a1e4d7c99cc9762808b092cc584d95ff3b511488e4e74efdf6e7',
                ],
                [
                  'e80fea14441fb33a7d8adab9475d7fab2019effb5156a792f1a11778e3c0df5d',
                  'eed1de7f638e00771e89768ca3ca94472d155e80af322ea9fcb4291b6ac9ec78',
                ],
                [
                  'a301697bdfcd704313ba48e51d567543f2a182031efd6915ddc07bbcc4e16070',
                  '7370f91cfb67e4f5081809fa25d40f9b1735dbf7c0a11a130c0d1a041e177ea1',
                ],
                [
                  '90ad85b389d6b936463f9d0512678de208cc330b11307fffab7ac63e3fb04ed4',
                  'e507a3620a38261affdcbd9427222b839aefabe1582894d991d4d48cb6ef150',
                ],
                [
                  '8f68b9d2f63b5f339239c1ad981f162ee88c5678723ea3351b7b444c9ec4c0da',
                  '662a9f2dba063986de1d90c2b6be215dbbea2cfe95510bfdf23cbf79501fff82',
                ],
                [
                  'e4f3fb0176af85d65ff99ff9198c36091f48e86503681e3e6686fd5053231e11',
                  '1e63633ad0ef4f1c1661a6d0ea02b7286cc7e74ec951d1c9822c38576feb73bc',
                ],
                [
                  '8c00fa9b18ebf331eb961537a45a4266c7034f2f0d4e1d0716fb6eae20eae29e',
                  'efa47267fea521a1a9dc343a3736c974c2fadafa81e36c54e7d2a4c66702414b',
                ],
                [
                  'e7a26ce69dd4829f3e10cec0a9e98ed3143d084f308b92c0997fddfc60cb3e41',
                  '2a758e300fa7984b471b006a1aafbb18d0a6b2c0420e83e20e8a9421cf2cfd51',
                ],
                [
                  'b6459e0ee3662ec8d23540c223bcbdc571cbcb967d79424f3cf29eb3de6b80ef',
                  '67c876d06f3e06de1dadf16e5661db3c4b3ae6d48e35b2ff30bf0b61a71ba45',
                ],
                [
                  'd68a80c8280bb840793234aa118f06231d6f1fc67e73c5a5deda0f5b496943e8',
                  'db8ba9fff4b586d00c4b1f9177b0e28b5b0e7b8f7845295a294c84266b133120',
                ],
                [
                  '324aed7df65c804252dc0270907a30b09612aeb973449cea4095980fc28d3d5d',
                  '648a365774b61f2ff130c0c35aec1f4f19213b0c7e332843967224af96ab7c84',
                ],
                [
                  '4df9c14919cde61f6d51dfdbe5fee5dceec4143ba8d1ca888e8bd373fd054c96',
                  '35ec51092d8728050974c23a1d85d4b5d506cdc288490192ebac06cad10d5d',
                ],
                [
                  '9c3919a84a474870faed8a9c1cc66021523489054d7f0308cbfc99c8ac1f98cd',
                  'ddb84f0f4a4ddd57584f044bf260e641905326f76c64c8e6be7e5e03d4fc599d',
                ],
                [
                  '6057170b1dd12fdf8de05f281d8e06bb91e1493a8b91d4cc5a21382120a959e5',
                  '9a1af0b26a6a4807add9a2daf71df262465152bc3ee24c65e899be932385a2a8',
                ],
                [
                  'a576df8e23a08411421439a4518da31880cef0fba7d4df12b1a6973eecb94266',
                  '40a6bf20e76640b2c92b97afe58cd82c432e10a7f514d9f3ee8be11ae1b28ec8',
                ],
                [
                  '7778a78c28dec3e30a05fe9629de8c38bb30d1f5cf9a3a208f763889be58ad71',
                  '34626d9ab5a5b22ff7098e12f2ff580087b38411ff24ac563b513fc1fd9f43ac',
                ],
                [
                  '928955ee637a84463729fd30e7afd2ed5f96274e5ad7e5cb09eda9c06d903ac',
                  'c25621003d3f42a827b78a13093a95eeac3d26efa8a8d83fc5180e935bcd091f',
                ],
                [
                  '85d0fef3ec6db109399064f3a0e3b2855645b4a907ad354527aae75163d82751',
                  '1f03648413a38c0be29d496e582cf5663e8751e96877331582c237a24eb1f962',
                ],
                [
                  'ff2b0dce97eece97c1c9b6041798b85dfdfb6d8882da20308f5404824526087e',
                  '493d13fef524ba188af4c4dc54d07936c7b7ed6fb90e2ceb2c951e01f0c29907',
                ],
                [
                  '827fbbe4b1e880ea9ed2b2e6301b212b57f1ee148cd6dd28780e5e2cf856e241',
                  'c60f9c923c727b0b71bef2c67d1d12687ff7a63186903166d605b68baec293ec',
                ],
                [
                  'eaa649f21f51bdbae7be4ae34ce6e5217a58fdce7f47f9aa7f3b58fa2120e2b3',
                  'be3279ed5bbbb03ac69a80f89879aa5a01a6b965f13f7e59d47a5305ba5ad93d',
                ],
                [
                  'e4a42d43c5cf169d9391df6decf42ee541b6d8f0c9a137401e23632dda34d24f',
                  '4d9f92e716d1c73526fc99ccfb8ad34ce886eedfa8d8e4f13a7f7131deba9414',
                ],
                [
                  '1ec80fef360cbdd954160fadab352b6b92b53576a88fea4947173b9d4300bf19',
                  'aeefe93756b5340d2f3a4958a7abbf5e0146e77f6295a07b671cdc1cc107cefd',
                ],
                [
                  '146a778c04670c2f91b00af4680dfa8bce3490717d58ba889ddb5928366642be',
                  'b318e0ec3354028add669827f9d4b2870aaa971d2f7e5ed1d0b297483d83efd0',
                ],
                [
                  'fa50c0f61d22e5f07e3acebb1aa07b128d0012209a28b9776d76a8793180eef9',
                  '6b84c6922397eba9b72cd2872281a68a5e683293a57a213b38cd8d7d3f4f2811',
                ],
                [
                  'da1d61d0ca721a11b1a5bf6b7d88e8421a288ab5d5bba5220e53d32b5f067ec2',
                  '8157f55a7c99306c79c0766161c91e2966a73899d279b48a655fba0f1ad836f1',
                ],
                [
                  'a8e282ff0c9706907215ff98e8fd416615311de0446f1e062a73b0610d064e13',
                  '7f97355b8db81c09abfb7f3c5b2515888b679a3e50dd6bd6cef7c73111f4cc0c',
                ],
                [
                  '174a53b9c9a285872d39e56e6913cab15d59b1fa512508c022f382de8319497c',
                  'ccc9dc37abfc9c1657b4155f2c47f9e6646b3a1d8cb9854383da13ac079afa73',
                ],
                [
                  '959396981943785c3d3e57edf5018cdbe039e730e4918b3d884fdff09475b7ba',
                  '2e7e552888c331dd8ba0386a4b9cd6849c653f64c8709385e9b8abf87524f2fd',
                ],
                [
                  'd2a63a50ae401e56d645a1153b109a8fcca0a43d561fba2dbb51340c9d82b151',
                  'e82d86fb6443fcb7565aee58b2948220a70f750af484ca52d4142174dcf89405',
                ],
                [
                  '64587e2335471eb890ee7896d7cfdc866bacbdbd3839317b3436f9b45617e073',
                  'd99fcdd5bf6902e2ae96dd6447c299a185b90a39133aeab358299e5e9faf6589',
                ],
                [
                  '8481bde0e4e4d885b3a546d3e549de042f0aa6cea250e7fd358d6c86dd45e458',
                  '38ee7b8cba5404dd84a25bf39cecb2ca900a79c42b262e556d64b1b59779057e',
                ],
                [
                  '13464a57a78102aa62b6979ae817f4637ffcfed3c4b1ce30bcd6303f6caf666b',
                  '69be159004614580ef7e433453ccb0ca48f300a81d0942e13f495a907f6ecc27',
                ],
                [
                  'bc4a9df5b713fe2e9aef430bcc1dc97a0cd9ccede2f28588cada3a0d2d83f366',
                  'd3a81ca6e785c06383937adf4b798caa6e8a9fbfa547b16d758d666581f33c1',
                ],
                [
                  '8c28a97bf8298bc0d23d8c749452a32e694b65e30a9472a3954ab30fe5324caa',
                  '40a30463a3305193378fedf31f7cc0eb7ae784f0451cb9459e71dc73cbef9482',
                ],
                [
                  '8ea9666139527a8c1dd94ce4f071fd23c8b350c5a4bb33748c4ba111faccae0',
                  '620efabbc8ee2782e24e7c0cfb95c5d735b783be9cf0f8e955af34a30e62b945',
                ],
                [
                  'dd3625faef5ba06074669716bbd3788d89bdde815959968092f76cc4eb9a9787',
                  '7a188fa3520e30d461da2501045731ca941461982883395937f68d00c644a573',
                ],
                [
                  'f710d79d9eb962297e4f6232b40e8f7feb2bc63814614d692c12de752408221e',
                  'ea98e67232d3b3295d3b535532115ccac8612c721851617526ae47a9c77bfc82',
                ],
              ],
            },
            naf: {
              wnd: 7,
              points: [
                [
                  'f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9',
                  '388f7b0f632de8140fe337e62a37f3566500a99934c2231b6cb9fd7584b8e672',
                ],
                [
                  '2f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4',
                  'd8ac222636e5e3d6d4dba9dda6c9c426f788271bab0d6840dca87d3aa6ac62d6',
                ],
                [
                  '5cbdf0646e5db4eaa398f365f2ea7a0e3d419b7e0330e39ce92bddedcac4f9bc',
                  '6aebca40ba255960a3178d6d861a54dba813d0b813fde7b5a5082628087264da',
                ],
                [
                  'acd484e2f0c7f65309ad178a9f559abde09796974c57e714c35f110dfc27ccbe',
                  'cc338921b0a7d9fd64380971763b61e9add888a4375f8e0f05cc262ac64f9c37',
                ],
                [
                  '774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb',
                  'd984a032eb6b5e190243dd56d7b7b365372db1e2dff9d6a8301d74c9c953c61b',
                ],
                [
                  'f28773c2d975288bc7d1d205c3748651b075fbc6610e58cddeeddf8f19405aa8',
                  'ab0902e8d880a89758212eb65cdaf473a1a06da521fa91f29b5cb52db03ed81',
                ],
                [
                  'd7924d4f7d43ea965a465ae3095ff41131e5946f3c85f79e44adbcf8e27e080e',
                  '581e2872a86c72a683842ec228cc6defea40af2bd896d3a5c504dc9ff6a26b58',
                ],
                [
                  'defdea4cdb677750a420fee807eacf21eb9898ae79b9768766e4faa04a2d4a34',
                  '4211ab0694635168e997b0ead2a93daeced1f4a04a95c0f6cfb199f69e56eb77',
                ],
                [
                  '2b4ea0a797a443d293ef5cff444f4979f06acfebd7e86d277475656138385b6c',
                  '85e89bc037945d93b343083b5a1c86131a01f60c50269763b570c854e5c09b7a',
                ],
                [
                  '352bbf4a4cdd12564f93fa332ce333301d9ad40271f8107181340aef25be59d5',
                  '321eb4075348f534d59c18259dda3e1f4a1b3b2e71b1039c67bd3d8bcf81998c',
                ],
                [
                  '2fa2104d6b38d11b0230010559879124e42ab8dfeff5ff29dc9cdadd4ecacc3f',
                  '2de1068295dd865b64569335bd5dd80181d70ecfc882648423ba76b532b7d67',
                ],
                [
                  '9248279b09b4d68dab21a9b066edda83263c3d84e09572e269ca0cd7f5453714',
                  '73016f7bf234aade5d1aa71bdea2b1ff3fc0de2a887912ffe54a32ce97cb3402',
                ],
                [
                  'daed4f2be3a8bf278e70132fb0beb7522f570e144bf615c07e996d443dee8729',
                  'a69dce4a7d6c98e8d4a1aca87ef8d7003f83c230f3afa726ab40e52290be1c55',
                ],
                [
                  'c44d12c7065d812e8acf28d7cbb19f9011ecd9e9fdf281b0e6a3b5e87d22e7db',
                  '2119a460ce326cdc76c45926c982fdac0e106e861edf61c5a039063f0e0e6482',
                ],
                [
                  '6a245bf6dc698504c89a20cfded60853152b695336c28063b61c65cbd269e6b4',
                  'e022cf42c2bd4a708b3f5126f16a24ad8b33ba48d0423b6efd5e6348100d8a82',
                ],
                [
                  '1697ffa6fd9de627c077e3d2fe541084ce13300b0bec1146f95ae57f0d0bd6a5',
                  'b9c398f186806f5d27561506e4557433a2cf15009e498ae7adee9d63d01b2396',
                ],
                [
                  '605bdb019981718b986d0f07e834cb0d9deb8360ffb7f61df982345ef27a7479',
                  '2972d2de4f8d20681a78d93ec96fe23c26bfae84fb14db43b01e1e9056b8c49',
                ],
                [
                  '62d14dab4150bf497402fdc45a215e10dcb01c354959b10cfe31c7e9d87ff33d',
                  '80fc06bd8cc5b01098088a1950eed0db01aa132967ab472235f5642483b25eaf',
                ],
                [
                  '80c60ad0040f27dade5b4b06c408e56b2c50e9f56b9b8b425e555c2f86308b6f',
                  '1c38303f1cc5c30f26e66bad7fe72f70a65eed4cbe7024eb1aa01f56430bd57a',
                ],
                [
                  '7a9375ad6167ad54aa74c6348cc54d344cc5dc9487d847049d5eabb0fa03c8fb',
                  'd0e3fa9eca8726909559e0d79269046bdc59ea10c70ce2b02d499ec224dc7f7',
                ],
                [
                  'd528ecd9b696b54c907a9ed045447a79bb408ec39b68df504bb51f459bc3ffc9',
                  'eecf41253136e5f99966f21881fd656ebc4345405c520dbc063465b521409933',
                ],
                [
                  '49370a4b5f43412ea25f514e8ecdad05266115e4a7ecb1387231808f8b45963',
                  '758f3f41afd6ed428b3081b0512fd62a54c3f3afbb5b6764b653052a12949c9a',
                ],
                [
                  '77f230936ee88cbbd73df930d64702ef881d811e0e1498e2f1c13eb1fc345d74',
                  '958ef42a7886b6400a08266e9ba1b37896c95330d97077cbbe8eb3c7671c60d6',
                ],
                [
                  'f2dac991cc4ce4b9ea44887e5c7c0bce58c80074ab9d4dbaeb28531b7739f530',
                  'e0dedc9b3b2f8dad4da1f32dec2531df9eb5fbeb0598e4fd1a117dba703a3c37',
                ],
                [
                  '463b3d9f662621fb1b4be8fbbe2520125a216cdfc9dae3debcba4850c690d45b',
                  '5ed430d78c296c3543114306dd8622d7c622e27c970a1de31cb377b01af7307e',
                ],
                [
                  'f16f804244e46e2a09232d4aff3b59976b98fac14328a2d1a32496b49998f247',
                  'cedabd9b82203f7e13d206fcdf4e33d92a6c53c26e5cce26d6579962c4e31df6',
                ],
                [
                  'caf754272dc84563b0352b7a14311af55d245315ace27c65369e15f7151d41d1',
                  'cb474660ef35f5f2a41b643fa5e460575f4fa9b7962232a5c32f908318a04476',
                ],
                [
                  '2600ca4b282cb986f85d0f1709979d8b44a09c07cb86d7c124497bc86f082120',
                  '4119b88753c15bd6a693b03fcddbb45d5ac6be74ab5f0ef44b0be9475a7e4b40',
                ],
                [
                  '7635ca72d7e8432c338ec53cd12220bc01c48685e24f7dc8c602a7746998e435',
                  '91b649609489d613d1d5e590f78e6d74ecfc061d57048bad9e76f302c5b9c61',
                ],
                [
                  '754e3239f325570cdbbf4a87deee8a66b7f2b33479d468fbc1a50743bf56cc18',
                  '673fb86e5bda30fb3cd0ed304ea49a023ee33d0197a695d0c5d98093c536683',
                ],
                [
                  'e3e6bd1071a1e96aff57859c82d570f0330800661d1c952f9fe2694691d9b9e8',
                  '59c9e0bba394e76f40c0aa58379a3cb6a5a2283993e90c4167002af4920e37f5',
                ],
                [
                  '186b483d056a033826ae73d88f732985c4ccb1f32ba35f4b4cc47fdcf04aa6eb',
                  '3b952d32c67cf77e2e17446e204180ab21fb8090895138b4a4a797f86e80888b',
                ],
                [
                  'df9d70a6b9876ce544c98561f4be4f725442e6d2b737d9c91a8321724ce0963f',
                  '55eb2dafd84d6ccd5f862b785dc39d4ab157222720ef9da217b8c45cf2ba2417',
                ],
                [
                  '5edd5cc23c51e87a497ca815d5dce0f8ab52554f849ed8995de64c5f34ce7143',
                  'efae9c8dbc14130661e8cec030c89ad0c13c66c0d17a2905cdc706ab7399a868',
                ],
                [
                  '290798c2b6476830da12fe02287e9e777aa3fba1c355b17a722d362f84614fba',
                  'e38da76dcd440621988d00bcf79af25d5b29c094db2a23146d003afd41943e7a',
                ],
                [
                  'af3c423a95d9f5b3054754efa150ac39cd29552fe360257362dfdecef4053b45',
                  'f98a3fd831eb2b749a93b0e6f35cfb40c8cd5aa667a15581bc2feded498fd9c6',
                ],
                [
                  '766dbb24d134e745cccaa28c99bf274906bb66b26dcf98df8d2fed50d884249a',
                  '744b1152eacbe5e38dcc887980da38b897584a65fa06cedd2c924f97cbac5996',
                ],
                [
                  '59dbf46f8c94759ba21277c33784f41645f7b44f6c596a58ce92e666191abe3e',
                  'c534ad44175fbc300f4ea6ce648309a042ce739a7919798cd85e216c4a307f6e',
                ],
                [
                  'f13ada95103c4537305e691e74e9a4a8dd647e711a95e73cb62dc6018cfd87b8',
                  'e13817b44ee14de663bf4bc808341f326949e21a6a75c2570778419bdaf5733d',
                ],
                [
                  '7754b4fa0e8aced06d4167a2c59cca4cda1869c06ebadfb6488550015a88522c',
                  '30e93e864e669d82224b967c3020b8fa8d1e4e350b6cbcc537a48b57841163a2',
                ],
                [
                  '948dcadf5990e048aa3874d46abef9d701858f95de8041d2a6828c99e2262519',
                  'e491a42537f6e597d5d28a3224b1bc25df9154efbd2ef1d2cbba2cae5347d57e',
                ],
                [
                  '7962414450c76c1689c7b48f8202ec37fb224cf5ac0bfa1570328a8a3d7c77ab',
                  '100b610ec4ffb4760d5c1fc133ef6f6b12507a051f04ac5760afa5b29db83437',
                ],
                [
                  '3514087834964b54b15b160644d915485a16977225b8847bb0dd085137ec47ca',
                  'ef0afbb2056205448e1652c48e8127fc6039e77c15c2378b7e7d15a0de293311',
                ],
                [
                  'd3cc30ad6b483e4bc79ce2c9dd8bc54993e947eb8df787b442943d3f7b527eaf',
                  '8b378a22d827278d89c5e9be8f9508ae3c2ad46290358630afb34db04eede0a4',
                ],
                [
                  '1624d84780732860ce1c78fcbfefe08b2b29823db913f6493975ba0ff4847610',
                  '68651cf9b6da903e0914448c6cd9d4ca896878f5282be4c8cc06e2a404078575',
                ],
                [
                  '733ce80da955a8a26902c95633e62a985192474b5af207da6df7b4fd5fc61cd4',
                  'f5435a2bd2badf7d485a4d8b8db9fcce3e1ef8e0201e4578c54673bc1dc5ea1d',
                ],
                [
                  '15d9441254945064cf1a1c33bbd3b49f8966c5092171e699ef258dfab81c045c',
                  'd56eb30b69463e7234f5137b73b84177434800bacebfc685fc37bbe9efe4070d',
                ],
                [
                  'a1d0fcf2ec9de675b612136e5ce70d271c21417c9d2b8aaaac138599d0717940',
                  'edd77f50bcb5a3cab2e90737309667f2641462a54070f3d519212d39c197a629',
                ],
                [
                  'e22fbe15c0af8ccc5780c0735f84dbe9a790badee8245c06c7ca37331cb36980',
                  'a855babad5cd60c88b430a69f53a1a7a38289154964799be43d06d77d31da06',
                ],
                [
                  '311091dd9860e8e20ee13473c1155f5f69635e394704eaa74009452246cfa9b3',
                  '66db656f87d1f04fffd1f04788c06830871ec5a64feee685bd80f0b1286d8374',
                ],
                [
                  '34c1fd04d301be89b31c0442d3e6ac24883928b45a9340781867d4232ec2dbdf',
                  '9414685e97b1b5954bd46f730174136d57f1ceeb487443dc5321857ba73abee',
                ],
                [
                  'f219ea5d6b54701c1c14de5b557eb42a8d13f3abbcd08affcc2a5e6b049b8d63',
                  '4cb95957e83d40b0f73af4544cccf6b1f4b08d3c07b27fb8d8c2962a400766d1',
                ],
                [
                  'd7b8740f74a8fbaab1f683db8f45de26543a5490bca627087236912469a0b448',
                  'fa77968128d9c92ee1010f337ad4717eff15db5ed3c049b3411e0315eaa4593b',
                ],
                [
                  '32d31c222f8f6f0ef86f7c98d3a3335ead5bcd32abdd94289fe4d3091aa824bf',
                  '5f3032f5892156e39ccd3d7915b9e1da2e6dac9e6f26e961118d14b8462e1661',
                ],
                [
                  '7461f371914ab32671045a155d9831ea8793d77cd59592c4340f86cbc18347b5',
                  '8ec0ba238b96bec0cbdddcae0aa442542eee1ff50c986ea6b39847b3cc092ff6',
                ],
                [
                  'ee079adb1df1860074356a25aa38206a6d716b2c3e67453d287698bad7b2b2d6',
                  '8dc2412aafe3be5c4c5f37e0ecc5f9f6a446989af04c4e25ebaac479ec1c8c1e',
                ],
                [
                  '16ec93e447ec83f0467b18302ee620f7e65de331874c9dc72bfd8616ba9da6b5',
                  '5e4631150e62fb40d0e8c2a7ca5804a39d58186a50e497139626778e25b0674d',
                ],
                [
                  'eaa5f980c245f6f038978290afa70b6bd8855897f98b6aa485b96065d537bd99',
                  'f65f5d3e292c2e0819a528391c994624d784869d7e6ea67fb18041024edc07dc',
                ],
                [
                  '78c9407544ac132692ee1910a02439958ae04877151342ea96c4b6b35a49f51',
                  'f3e0319169eb9b85d5404795539a5e68fa1fbd583c064d2462b675f194a3ddb4',
                ],
                [
                  '494f4be219a1a77016dcd838431aea0001cdc8ae7a6fc688726578d9702857a5',
                  '42242a969283a5f339ba7f075e36ba2af925ce30d767ed6e55f4b031880d562c',
                ],
                [
                  'a598a8030da6d86c6bc7f2f5144ea549d28211ea58faa70ebf4c1e665c1fe9b5',
                  '204b5d6f84822c307e4b4a7140737aec23fc63b65b35f86a10026dbd2d864e6b',
                ],
                [
                  'c41916365abb2b5d09192f5f2dbeafec208f020f12570a184dbadc3e58595997',
                  '4f14351d0087efa49d245b328984989d5caf9450f34bfc0ed16e96b58fa9913',
                ],
                [
                  '841d6063a586fa475a724604da03bc5b92a2e0d2e0a36acfe4c73a5514742881',
                  '73867f59c0659e81904f9a1c7543698e62562d6744c169ce7a36de01a8d6154',
                ],
                [
                  '5e95bb399a6971d376026947f89bde2f282b33810928be4ded112ac4d70e20d5',
                  '39f23f366809085beebfc71181313775a99c9aed7d8ba38b161384c746012865',
                ],
                [
                  '36e4641a53948fd476c39f8a99fd974e5ec07564b5315d8bf99471bca0ef2f66',
                  'd2424b1b1abe4eb8164227b085c9aa9456ea13493fd563e06fd51cf5694c78fc',
                ],
                [
                  '336581ea7bfbbb290c191a2f507a41cf5643842170e914faeab27c2c579f726',
                  'ead12168595fe1be99252129b6e56b3391f7ab1410cd1e0ef3dcdcabd2fda224',
                ],
                [
                  '8ab89816dadfd6b6a1f2634fcf00ec8403781025ed6890c4849742706bd43ede',
                  '6fdcef09f2f6d0a044e654aef624136f503d459c3e89845858a47a9129cdd24e',
                ],
                [
                  '1e33f1a746c9c5778133344d9299fcaa20b0938e8acff2544bb40284b8c5fb94',
                  '60660257dd11b3aa9c8ed618d24edff2306d320f1d03010e33a7d2057f3b3b6',
                ],
                [
                  '85b7c1dcb3cec1b7ee7f30ded79dd20a0ed1f4cc18cbcfcfa410361fd8f08f31',
                  '3d98a9cdd026dd43f39048f25a8847f4fcafad1895d7a633c6fed3c35e999511',
                ],
                [
                  '29df9fbd8d9e46509275f4b125d6d45d7fbe9a3b878a7af872a2800661ac5f51',
                  'b4c4fe99c775a606e2d8862179139ffda61dc861c019e55cd2876eb2a27d84b',
                ],
                [
                  'a0b1cae06b0a847a3fea6e671aaf8adfdfe58ca2f768105c8082b2e449fce252',
                  'ae434102edde0958ec4b19d917a6a28e6b72da1834aff0e650f049503a296cf2',
                ],
                [
                  '4e8ceafb9b3e9a136dc7ff67e840295b499dfb3b2133e4ba113f2e4c0e121e5',
                  'cf2174118c8b6d7a4b48f6d534ce5c79422c086a63460502b827ce62a326683c',
                ],
                [
                  'd24a44e047e19b6f5afb81c7ca2f69080a5076689a010919f42725c2b789a33b',
                  '6fb8d5591b466f8fc63db50f1c0f1c69013f996887b8244d2cdec417afea8fa3',
                ],
                [
                  'ea01606a7a6c9cdd249fdfcfacb99584001edd28abbab77b5104e98e8e3b35d4',
                  '322af4908c7312b0cfbfe369f7a7b3cdb7d4494bc2823700cfd652188a3ea98d',
                ],
                [
                  'af8addbf2b661c8a6c6328655eb96651252007d8c5ea31be4ad196de8ce2131f',
                  '6749e67c029b85f52a034eafd096836b2520818680e26ac8f3dfbcdb71749700',
                ],
                [
                  'e3ae1974566ca06cc516d47e0fb165a674a3dabcfca15e722f0e3450f45889',
                  '2aeabe7e4531510116217f07bf4d07300de97e4874f81f533420a72eeb0bd6a4',
                ],
                [
                  '591ee355313d99721cf6993ffed1e3e301993ff3ed258802075ea8ced397e246',
                  'b0ea558a113c30bea60fc4775460c7901ff0b053d25ca2bdeee98f1a4be5d196',
                ],
                [
                  '11396d55fda54c49f19aa97318d8da61fa8584e47b084945077cf03255b52984',
                  '998c74a8cd45ac01289d5833a7beb4744ff536b01b257be4c5767bea93ea57a4',
                ],
                [
                  '3c5d2a1ba39c5a1790000738c9e0c40b8dcdfd5468754b6405540157e017aa7a',
                  'b2284279995a34e2f9d4de7396fc18b80f9b8b9fdd270f6661f79ca4c81bd257',
                ],
                [
                  'cc8704b8a60a0defa3a99a7299f2e9c3fbc395afb04ac078425ef8a1793cc030',
                  'bdd46039feed17881d1e0862db347f8cf395b74fc4bcdc4e940b74e3ac1f1b13',
                ],
                [
                  'c533e4f7ea8555aacd9777ac5cad29b97dd4defccc53ee7ea204119b2889b197',
                  '6f0a256bc5efdf429a2fb6242f1a43a2d9b925bb4a4b3a26bb8e0f45eb596096',
                ],
                [
                  'c14f8f2ccb27d6f109f6d08d03cc96a69ba8c34eec07bbcf566d48e33da6593',
                  'c359d6923bb398f7fd4473e16fe1c28475b740dd098075e6c0e8649113dc3a38',
                ],
                [
                  'a6cbc3046bc6a450bac24789fa17115a4c9739ed75f8f21ce441f72e0b90e6ef',
                  '21ae7f4680e889bb130619e2c0f95a360ceb573c70603139862afd617fa9b9f',
                ],
                [
                  '347d6d9a02c48927ebfb86c1359b1caf130a3c0267d11ce6344b39f99d43cc38',
                  '60ea7f61a353524d1c987f6ecec92f086d565ab687870cb12689ff1e31c74448',
                ],
                [
                  'da6545d2181db8d983f7dcb375ef5866d47c67b1bf31c8cf855ef7437b72656a',
                  '49b96715ab6878a79e78f07ce5680c5d6673051b4935bd897fea824b77dc208a',
                ],
                [
                  'c40747cc9d012cb1a13b8148309c6de7ec25d6945d657146b9d5994b8feb1111',
                  '5ca560753be2a12fc6de6caf2cb489565db936156b9514e1bb5e83037e0fa2d4',
                ],
                [
                  '4e42c8ec82c99798ccf3a610be870e78338c7f713348bd34c8203ef4037f3502',
                  '7571d74ee5e0fb92a7a8b33a07783341a5492144cc54bcc40a94473693606437',
                ],
                [
                  '3775ab7089bc6af823aba2e1af70b236d251cadb0c86743287522a1b3b0dedea',
                  'be52d107bcfa09d8bcb9736a828cfa7fac8db17bf7a76a2c42ad961409018cf7',
                ],
                [
                  'cee31cbf7e34ec379d94fb814d3d775ad954595d1314ba8846959e3e82f74e26',
                  '8fd64a14c06b589c26b947ae2bcf6bfa0149ef0be14ed4d80f448a01c43b1c6d',
                ],
                [
                  'b4f9eaea09b6917619f6ea6a4eb5464efddb58fd45b1ebefcdc1a01d08b47986',
                  '39e5c9925b5a54b07433a4f18c61726f8bb131c012ca542eb24a8ac07200682a',
                ],
                [
                  'd4263dfc3d2df923a0179a48966d30ce84e2515afc3dccc1b77907792ebcc60e',
                  '62dfaf07a0f78feb30e30d6295853ce189e127760ad6cf7fae164e122a208d54',
                ],
                [
                  '48457524820fa65a4f8d35eb6930857c0032acc0a4a2de422233eeda897612c4',
                  '25a748ab367979d98733c38a1fa1c2e7dc6cc07db2d60a9ae7a76aaa49bd0f77',
                ],
                [
                  'dfeeef1881101f2cb11644f3a2afdfc2045e19919152923f367a1767c11cceda',
                  'ecfb7056cf1de042f9420bab396793c0c390bde74b4bbdff16a83ae09a9a7517',
                ],
                [
                  '6d7ef6b17543f8373c573f44e1f389835d89bcbc6062ced36c82df83b8fae859',
                  'cd450ec335438986dfefa10c57fea9bcc521a0959b2d80bbf74b190dca712d10',
                ],
                [
                  'e75605d59102a5a2684500d3b991f2e3f3c88b93225547035af25af66e04541f',
                  'f5c54754a8f71ee540b9b48728473e314f729ac5308b06938360990e2bfad125',
                ],
                [
                  'eb98660f4c4dfaa06a2be453d5020bc99a0c2e60abe388457dd43fefb1ed620c',
                  '6cb9a8876d9cb8520609af3add26cd20a0a7cd8a9411131ce85f44100099223e',
                ],
                [
                  '13e87b027d8514d35939f2e6892b19922154596941888336dc3563e3b8dba942',
                  'fef5a3c68059a6dec5d624114bf1e91aac2b9da568d6abeb2570d55646b8adf1',
                ],
                [
                  'ee163026e9fd6fe017c38f06a5be6fc125424b371ce2708e7bf4491691e5764a',
                  '1acb250f255dd61c43d94ccc670d0f58f49ae3fa15b96623e5430da0ad6c62b2',
                ],
                [
                  'b268f5ef9ad51e4d78de3a750c2dc89b1e626d43505867999932e5db33af3d80',
                  '5f310d4b3c99b9ebb19f77d41c1dee018cf0d34fd4191614003e945a1216e423',
                ],
                [
                  'ff07f3118a9df035e9fad85eb6c7bfe42b02f01ca99ceea3bf7ffdba93c4750d',
                  '438136d603e858a3a5c440c38eccbaddc1d2942114e2eddd4740d098ced1f0d8',
                ],
                [
                  '8d8b9855c7c052a34146fd20ffb658bea4b9f69e0d825ebec16e8c3ce2b526a1',
                  'cdb559eedc2d79f926baf44fb84ea4d44bcf50fee51d7ceb30e2e7f463036758',
                ],
                [
                  '52db0b5384dfbf05bfa9d472d7ae26dfe4b851ceca91b1eba54263180da32b63',
                  'c3b997d050ee5d423ebaf66a6db9f57b3180c902875679de924b69d84a7b375',
                ],
                [
                  'e62f9490d3d51da6395efd24e80919cc7d0f29c3f3fa48c6fff543becbd43352',
                  '6d89ad7ba4876b0b22c2ca280c682862f342c8591f1daf5170e07bfd9ccafa7d',
                ],
                [
                  '7f30ea2476b399b4957509c88f77d0191afa2ff5cb7b14fd6d8e7d65aaab1193',
                  'ca5ef7d4b231c94c3b15389a5f6311e9daff7bb67b103e9880ef4bff637acaec',
                ],
                [
                  '5098ff1e1d9f14fb46a210fada6c903fef0fb7b4a1dd1d9ac60a0361800b7a00',
                  '9731141d81fc8f8084d37c6e7542006b3ee1b40d60dfe5362a5b132fd17ddc0',
                ],
                [
                  '32b78c7de9ee512a72895be6b9cbefa6e2f3c4ccce445c96b9f2c81e2778ad58',
                  'ee1849f513df71e32efc3896ee28260c73bb80547ae2275ba497237794c8753c',
                ],
                [
                  'e2cb74fddc8e9fbcd076eef2a7c72b0ce37d50f08269dfc074b581550547a4f7',
                  'd3aa2ed71c9dd2247a62df062736eb0baddea9e36122d2be8641abcb005cc4a4',
                ],
                [
                  '8438447566d4d7bedadc299496ab357426009a35f235cb141be0d99cd10ae3a8',
                  'c4e1020916980a4da5d01ac5e6ad330734ef0d7906631c4f2390426b2edd791f',
                ],
                [
                  '4162d488b89402039b584c6fc6c308870587d9c46f660b878ab65c82c711d67e',
                  '67163e903236289f776f22c25fb8a3afc1732f2b84b4e95dbda47ae5a0852649',
                ],
                [
                  '3fad3fa84caf0f34f0f89bfd2dcf54fc175d767aec3e50684f3ba4a4bf5f683d',
                  'cd1bc7cb6cc407bb2f0ca647c718a730cf71872e7d0d2a53fa20efcdfe61826',
                ],
                [
                  '674f2600a3007a00568c1a7ce05d0816c1fb84bf1370798f1c69532faeb1a86b',
                  '299d21f9413f33b3edf43b257004580b70db57da0b182259e09eecc69e0d38a5',
                ],
                [
                  'd32f4da54ade74abb81b815ad1fb3b263d82d6c692714bcff87d29bd5ee9f08f',
                  'f9429e738b8e53b968e99016c059707782e14f4535359d582fc416910b3eea87',
                ],
                [
                  '30e4e670435385556e593657135845d36fbb6931f72b08cb1ed954f1e3ce3ff6',
                  '462f9bce619898638499350113bbc9b10a878d35da70740dc695a559eb88db7b',
                ],
                [
                  'be2062003c51cc3004682904330e4dee7f3dcd10b01e580bf1971b04d4cad297',
                  '62188bc49d61e5428573d48a74e1c655b1c61090905682a0d5558ed72dccb9bc',
                ],
                [
                  '93144423ace3451ed29e0fb9ac2af211cb6e84a601df5993c419859fff5df04a',
                  '7c10dfb164c3425f5c71a3f9d7992038f1065224f72bb9d1d902a6d13037b47c',
                ],
                [
                  'b015f8044f5fcbdcf21ca26d6c34fb8197829205c7b7d2a7cb66418c157b112c',
                  'ab8c1e086d04e813744a655b2df8d5f83b3cdc6faa3088c1d3aea1454e3a1d5f',
                ],
                [
                  'd5e9e1da649d97d89e4868117a465a3a4f8a18de57a140d36b3f2af341a21b52',
                  '4cb04437f391ed73111a13cc1d4dd0db1693465c2240480d8955e8592f27447a',
                ],
                [
                  'd3ae41047dd7ca065dbf8ed77b992439983005cd72e16d6f996a5316d36966bb',
                  'bd1aeb21ad22ebb22a10f0303417c6d964f8cdd7df0aca614b10dc14d125ac46',
                ],
                [
                  '463e2763d885f958fc66cdd22800f0a487197d0a82e377b49f80af87c897b065',
                  'bfefacdb0e5d0fd7df3a311a94de062b26b80c61fbc97508b79992671ef7ca7f',
                ],
                [
                  '7985fdfd127c0567c6f53ec1bb63ec3158e597c40bfe747c83cddfc910641917',
                  '603c12daf3d9862ef2b25fe1de289aed24ed291e0ec6708703a5bd567f32ed03',
                ],
                [
                  '74a1ad6b5f76e39db2dd249410eac7f99e74c59cb83d2d0ed5ff1543da7703e9',
                  'cc6157ef18c9c63cd6193d83631bbea0093e0968942e8c33d5737fd790e0db08',
                ],
                [
                  '30682a50703375f602d416664ba19b7fc9bab42c72747463a71d0896b22f6da3',
                  '553e04f6b018b4fa6c8f39e7f311d3176290d0e0f19ca73f17714d9977a22ff8',
                ],
                [
                  '9e2158f0d7c0d5f26c3791efefa79597654e7a2b2464f52b1ee6c1347769ef57',
                  '712fcdd1b9053f09003a3481fa7762e9ffd7c8ef35a38509e2fbf2629008373',
                ],
                [
                  '176e26989a43c9cfeba4029c202538c28172e566e3c4fce7322857f3be327d66',
                  'ed8cc9d04b29eb877d270b4878dc43c19aefd31f4eee09ee7b47834c1fa4b1c3',
                ],
                [
                  '75d46efea3771e6e68abb89a13ad747ecf1892393dfc4f1b7004788c50374da8',
                  '9852390a99507679fd0b86fd2b39a868d7efc22151346e1a3ca4726586a6bed8',
                ],
                [
                  '809a20c67d64900ffb698c4c825f6d5f2310fb0451c869345b7319f645605721',
                  '9e994980d9917e22b76b061927fa04143d096ccc54963e6a5ebfa5f3f8e286c1',
                ],
                [
                  '1b38903a43f7f114ed4500b4eac7083fdefece1cf29c63528d563446f972c180',
                  '4036edc931a60ae889353f77fd53de4a2708b26b6f5da72ad3394119daf408f9',
                ],
              ],
            },
          }
        },
        19: (t, e, r) => {
          'use strict'
          var i = e,
            n = r(5612),
            o = r(1339),
            a = r(1984)
          ;(i.assert = o),
            (i.toArray = a.toArray),
            (i.zero2 = a.zero2),
            (i.toHex = a.toHex),
            (i.encode = a.encode),
            (i.getNAF = function (t, e, r) {
              var i = new Array(Math.max(t.bitLength(), r) + 1)
              i.fill(0)
              for (var n = 1 << (e + 1), o = t.clone(), a = 0; a < i.length; a++) {
                var s,
                  f = o.andln(n - 1)
                o.isOdd() ? ((s = f > (n >> 1) - 1 ? (n >> 1) - f : f), o.isubn(s)) : (s = 0), (i[a] = s), o.iushrn(1)
              }
              return i
            }),
            (i.getJSF = function (t, e) {
              var r = [[], []]
              ;(t = t.clone()), (e = e.clone())
              for (var i = 0, n = 0; t.cmpn(-i) > 0 || e.cmpn(-n) > 0; ) {
                var o,
                  a,
                  s,
                  f = (t.andln(3) + i) & 3,
                  h = (e.andln(3) + n) & 3
                3 === f && (f = -1),
                  3 === h && (h = -1),
                  (o = 0 == (1 & f) ? 0 : (3 != (s = (t.andln(7) + i) & 7) && 5 !== s) || 2 !== h ? f : -f),
                  r[0].push(o),
                  (a = 0 == (1 & h) ? 0 : (3 != (s = (e.andln(7) + n) & 7) && 5 !== s) || 2 !== f ? h : -h),
                  r[1].push(a),
                  2 * i === o + 1 && (i = 1 - i),
                  2 * n === a + 1 && (n = 1 - n),
                  t.iushrn(1),
                  e.iushrn(1)
              }
              return r
            }),
            (i.cachedProperty = function (t, e, r) {
              var i = '_' + e
              t.prototype[e] = function () {
                return void 0 !== this[i] ? this[i] : (this[i] = r.call(this))
              }
            }),
            (i.parseBytes = function (t) {
              return 'string' == typeof t ? i.toArray(t, 'hex') : t
            }),
            (i.intFromLE = function (t) {
              return new n(t, 'hex', 'le')
            })
        },
        3356: (t) => {
          'use strict'
          t.exports = { i8: '6.5.3' }
        },
        4525: (t) => {
          'use strict'
          var e,
            r = 'object' == typeof Reflect ? Reflect : null,
            i =
              r && 'function' == typeof r.apply
                ? r.apply
                : function (t, e, r) {
                    return Function.prototype.apply.call(t, e, r)
                  }
          e =
            r && 'function' == typeof r.ownKeys
              ? r.ownKeys
              : Object.getOwnPropertySymbols
              ? function (t) {
                  return Object.getOwnPropertyNames(t).concat(Object.getOwnPropertySymbols(t))
                }
              : function (t) {
                  return Object.getOwnPropertyNames(t)
                }
          var n =
            Number.isNaN ||
            function (t) {
              return t != t
            }
          function o() {
            o.init.call(this)
          }
          ;(t.exports = o),
            (t.exports.once = function (t, e) {
              return new Promise(function (r, i) {
                function n() {
                  void 0 !== o && t.removeListener('error', o), r([].slice.call(arguments))
                }
                var o
                'error' !== e &&
                  ((o = function (r) {
                    t.removeListener(e, n), i(r)
                  }),
                  t.once('error', o)),
                  t.once(e, n)
              })
            }),
            (o.EventEmitter = o),
            (o.prototype._events = void 0),
            (o.prototype._eventsCount = 0),
            (o.prototype._maxListeners = void 0)
          var a = 10
          function s(t) {
            if ('function' != typeof t)
              throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof t)
          }
          function f(t) {
            return void 0 === t._maxListeners ? o.defaultMaxListeners : t._maxListeners
          }
          function h(t, e, r, i) {
            var n, o, a, h
            if (
              (s(r),
              void 0 === (o = t._events)
                ? ((o = t._events = Object.create(null)), (t._eventsCount = 0))
                : (void 0 !== o.newListener && (t.emit('newListener', e, r.listener ? r.listener : r), (o = t._events)),
                  (a = o[e])),
              void 0 === a)
            )
              (a = o[e] = r), ++t._eventsCount
            else if (
              ('function' == typeof a ? (a = o[e] = i ? [r, a] : [a, r]) : i ? a.unshift(r) : a.push(r),
              (n = f(t)) > 0 && a.length > n && !a.warned)
            ) {
              a.warned = !0
              var c = new Error(
                'Possible EventEmitter memory leak detected. ' +
                  a.length +
                  ' ' +
                  String(e) +
                  ' listeners added. Use emitter.setMaxListeners() to increase limit',
              )
              ;(c.name = 'MaxListenersExceededWarning'),
                (c.emitter = t),
                (c.type = e),
                (c.count = a.length),
                (h = c),
                console && console.warn && console.warn(h)
            }
            return t
          }
          function c() {
            if (!this.fired)
              return (
                this.target.removeListener(this.type, this.wrapFn),
                (this.fired = !0),
                0 === arguments.length ? this.listener.call(this.target) : this.listener.apply(this.target, arguments)
              )
          }
          function u(t, e, r) {
            var i = { fired: !1, wrapFn: void 0, target: t, type: e, listener: r },
              n = c.bind(i)
            return (n.listener = r), (i.wrapFn = n), n
          }
          function d(t, e, r) {
            var i = t._events
            if (void 0 === i) return []
            var n = i[e]
            return void 0 === n
              ? []
              : 'function' == typeof n
              ? r
                ? [n.listener || n]
                : [n]
              : r
              ? (function (t) {
                  for (var e = new Array(t.length), r = 0; r < e.length; ++r) e[r] = t[r].listener || t[r]
                  return e
                })(n)
              : p(n, n.length)
          }
          function l(t) {
            var e = this._events
            if (void 0 !== e) {
              var r = e[t]
              if ('function' == typeof r) return 1
              if (void 0 !== r) return r.length
            }
            return 0
          }
          function p(t, e) {
            for (var r = new Array(e), i = 0; i < e; ++i) r[i] = t[i]
            return r
          }
          Object.defineProperty(o, 'defaultMaxListeners', {
            enumerable: !0,
            get: function () {
              return a
            },
            set: function (t) {
              if ('number' != typeof t || t < 0 || n(t))
                throw new RangeError(
                  'The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' +
                    t +
                    '.',
                )
              a = t
            },
          }),
            (o.init = function () {
              ;(void 0 !== this._events && this._events !== Object.getPrototypeOf(this)._events) ||
                ((this._events = Object.create(null)), (this._eventsCount = 0)),
                (this._maxListeners = this._maxListeners || void 0)
            }),
            (o.prototype.setMaxListeners = function (t) {
              if ('number' != typeof t || t < 0 || n(t))
                throw new RangeError(
                  'The value of "n" is out of range. It must be a non-negative number. Received ' + t + '.',
                )
              return (this._maxListeners = t), this
            }),
            (o.prototype.getMaxListeners = function () {
              return f(this)
            }),
            (o.prototype.emit = function (t) {
              for (var e = [], r = 1; r < arguments.length; r++) e.push(arguments[r])
              var n = 'error' === t,
                o = this._events
              if (void 0 !== o) n = n && void 0 === o.error
              else if (!n) return !1
              if (n) {
                var a
                if ((e.length > 0 && (a = e[0]), a instanceof Error)) throw a
                var s = new Error('Unhandled error.' + (a ? ' (' + a.message + ')' : ''))
                throw ((s.context = a), s)
              }
              var f = o[t]
              if (void 0 === f) return !1
              if ('function' == typeof f) i(f, this, e)
              else {
                var h = f.length,
                  c = p(f, h)
                for (r = 0; r < h; ++r) i(c[r], this, e)
              }
              return !0
            }),
            (o.prototype.addListener = function (t, e) {
              return h(this, t, e, !1)
            }),
            (o.prototype.on = o.prototype.addListener),
            (o.prototype.prependListener = function (t, e) {
              return h(this, t, e, !0)
            }),
            (o.prototype.once = function (t, e) {
              return s(e), this.on(t, u(this, t, e)), this
            }),
            (o.prototype.prependOnceListener = function (t, e) {
              return s(e), this.prependListener(t, u(this, t, e)), this
            }),
            (o.prototype.removeListener = function (t, e) {
              var r, i, n, o, a
              if ((s(e), void 0 === (i = this._events))) return this
              if (void 0 === (r = i[t])) return this
              if (r === e || r.listener === e)
                0 == --this._eventsCount
                  ? (this._events = Object.create(null))
                  : (delete i[t], i.removeListener && this.emit('removeListener', t, r.listener || e))
              else if ('function' != typeof r) {
                for (n = -1, o = r.length - 1; o >= 0; o--)
                  if (r[o] === e || r[o].listener === e) {
                    ;(a = r[o].listener), (n = o)
                    break
                  }
                if (n < 0) return this
                0 === n
                  ? r.shift()
                  : (function (t, e) {
                      for (; e + 1 < t.length; e++) t[e] = t[e + 1]
                      t.pop()
                    })(r, n),
                  1 === r.length && (i[t] = r[0]),
                  void 0 !== i.removeListener && this.emit('removeListener', t, a || e)
              }
              return this
            }),
            (o.prototype.off = o.prototype.removeListener),
            (o.prototype.removeAllListeners = function (t) {
              var e, r, i
              if (void 0 === (r = this._events)) return this
              if (void 0 === r.removeListener)
                return (
                  0 === arguments.length
                    ? ((this._events = Object.create(null)), (this._eventsCount = 0))
                    : void 0 !== r[t] &&
                      (0 == --this._eventsCount ? (this._events = Object.create(null)) : delete r[t]),
                  this
                )
              if (0 === arguments.length) {
                var n,
                  o = Object.keys(r)
                for (i = 0; i < o.length; ++i) 'removeListener' !== (n = o[i]) && this.removeAllListeners(n)
                return (
                  this.removeAllListeners('removeListener'),
                  (this._events = Object.create(null)),
                  (this._eventsCount = 0),
                  this
                )
              }
              if ('function' == typeof (e = r[t])) this.removeListener(t, e)
              else if (void 0 !== e) for (i = e.length - 1; i >= 0; i--) this.removeListener(t, e[i])
              return this
            }),
            (o.prototype.listeners = function (t) {
              return d(this, t, !0)
            }),
            (o.prototype.rawListeners = function (t) {
              return d(this, t, !1)
            }),
            (o.listenerCount = function (t, e) {
              return 'function' == typeof t.listenerCount ? t.listenerCount(e) : l.call(t, e)
            }),
            (o.prototype.listenerCount = l),
            (o.prototype.eventNames = function () {
              return this._eventsCount > 0 ? e(this._events) : []
            })
        },
        3014: (t, e, r) => {
          var i = r(8467).Buffer,
            n = r(2108)
          t.exports = function (t, e, r, o) {
            if (
              (i.isBuffer(t) || (t = i.from(t, 'binary')),
              e && (i.isBuffer(e) || (e = i.from(e, 'binary')), 8 !== e.length))
            )
              throw new RangeError('salt should be Buffer with 8 byte length')
            for (var a = r / 8, s = i.alloc(a), f = i.alloc(o || 0), h = i.alloc(0); a > 0 || o > 0; ) {
              var c = new n()
              c.update(h), c.update(t), e && c.update(e), (h = c.digest())
              var u = 0
              if (a > 0) {
                var d = s.length - a
                ;(u = Math.min(a, h.length)), h.copy(s, d, 0, u), (a -= u)
              }
              if (u < h.length && o > 0) {
                var l = f.length - o,
                  p = Math.min(o, h.length - u)
                h.copy(f, l, u, u + p), (o -= p)
              }
            }
            return h.fill(0), { key: s, iv: f }
          }
        },
        7127: (t, e, r) => {
          'use strict'
          var i = r(692).Buffer
          const { createHash: n, createHmac: o } = r(2498),
            a = {},
            s = (t) => {
              switch (t) {
                case 'sha256':
                  return 32
                case 'sha512':
                  return 64
                case 'sha224':
                  return 28
                case 'sha384':
                  return 48
                case 'sha3-256':
                  return 32
                case 'sha3-512':
                  return 64
                case 'sha3-224':
                  return 28
                case 'sha3-384':
                  return 48
                case 'blake2s256':
                  return 32
                case 'blake2b512':
                  return 64
                case 'sha1':
                  return 20
                case 'md5':
                  return 16
                default: {
                  let e = a[t]
                  return void 0 === e && ((e = n(t).digest().length), (a[t] = e)), e
                }
              }
            },
            f = (t, e, r, n) => {
              const a = i.isBuffer(r) ? r : i.from(r),
                s = n && n.length ? i.from(n) : i.alloc(e, 0)
              return o(t, s).update(a).digest()
            },
            h = (t, e, r, n, a) => {
              const s = i.from(a || ''),
                f = s.length,
                h = Math.ceil(n / e)
              if (h > 255) throw new Error(`OKM length ${n} is too long for ${t} hash`)
              const c = i.alloc(e * h + f + 1)
              for (let i = 1, n = 0, a = 0; i <= h; ++i)
                s.copy(c, a),
                  (c[a + f] = i),
                  o(t, r)
                    .update(c.slice(n, a + f + 1))
                    .digest()
                    .copy(c, a),
                  (n = a),
                  (a += e)
              return c.slice(0, n)
            }
          function c(t, e, { salt: r = '', info: i = '', hash: n = 'SHA-256' } = {}) {
            n = n.toLowerCase().replace('-', '')
            const o = s(n),
              a = f(n, o, t, r)
            return h(n, o, a, e, i)
          }
          Object.defineProperties(c, {
            hash_length: { configurable: !1, enumerable: !1, writable: !1, value: s },
            extract: { configurable: !1, enumerable: !1, writable: !1, value: f },
            expand: { configurable: !1, enumerable: !1, writable: !1, value: h },
          }),
            (t.exports = c)
        },
        6018: (t, e, r) => {
          'use strict'
          var i = r(8467).Buffer,
            n = r(1902).Transform
          function o(t) {
            n.call(this),
              (this._block = i.allocUnsafe(t)),
              (this._blockSize = t),
              (this._blockOffset = 0),
              (this._length = [0, 0, 0, 0]),
              (this._finalized = !1)
          }
          r(4603)(o, n),
            (o.prototype._transform = function (t, e, r) {
              var i = null
              try {
                this.update(t, e)
              } catch (t) {
                i = t
              }
              r(i)
            }),
            (o.prototype._flush = function (t) {
              var e = null
              try {
                this.push(this.digest())
              } catch (t) {
                e = t
              }
              t(e)
            }),
            (o.prototype.update = function (t, e) {
              if (
                ((function (t, e) {
                  if (!i.isBuffer(t) && 'string' != typeof t) throw new TypeError('Data must be a string or a buffer')
                })(t),
                this._finalized)
              )
                throw new Error('Digest already called')
              i.isBuffer(t) || (t = i.from(t, e))
              for (var r = this._block, n = 0; this._blockOffset + t.length - n >= this._blockSize; ) {
                for (var o = this._blockOffset; o < this._blockSize; ) r[o++] = t[n++]
                this._update(), (this._blockOffset = 0)
              }
              for (; n < t.length; ) r[this._blockOffset++] = t[n++]
              for (var a = 0, s = 8 * t.length; s > 0; ++a)
                (this._length[a] += s),
                  (s = (this._length[a] / 4294967296) | 0) > 0 && (this._length[a] -= 4294967296 * s)
              return this
            }),
            (o.prototype._update = function () {
              throw new Error('_update is not implemented')
            }),
            (o.prototype.digest = function (t) {
              if (this._finalized) throw new Error('Digest already called')
              this._finalized = !0
              var e = this._digest()
              void 0 !== t && (e = e.toString(t)), this._block.fill(0), (this._blockOffset = 0)
              for (var r = 0; r < 4; ++r) this._length[r] = 0
              return e
            }),
            (o.prototype._digest = function () {
              throw new Error('_digest is not implemented')
            }),
            (t.exports = o)
        },
        5582: (t, e, r) => {
          var i = e
          ;(i.utils = r(8631)),
            (i.common = r(8766)),
            (i.sha = r(6672)),
            (i.ripemd = r(427)),
            (i.hmac = r(7969)),
            (i.sha1 = i.sha.sha1),
            (i.sha256 = i.sha.sha256),
            (i.sha224 = i.sha.sha224),
            (i.sha384 = i.sha.sha384),
            (i.sha512 = i.sha.sha512),
            (i.ripemd160 = i.ripemd.ripemd160)
        },
        8766: (t, e, r) => {
          'use strict'
          var i = r(8631),
            n = r(1339)
          function o() {
            ;(this.pending = null),
              (this.pendingTotal = 0),
              (this.blockSize = this.constructor.blockSize),
              (this.outSize = this.constructor.outSize),
              (this.hmacStrength = this.constructor.hmacStrength),
              (this.padLength = this.constructor.padLength / 8),
              (this.endian = 'big'),
              (this._delta8 = this.blockSize / 8),
              (this._delta32 = this.blockSize / 32)
          }
          ;(e.BlockHash = o),
            (o.prototype.update = function (t, e) {
              if (
                ((t = i.toArray(t, e)),
                this.pending ? (this.pending = this.pending.concat(t)) : (this.pending = t),
                (this.pendingTotal += t.length),
                this.pending.length >= this._delta8)
              ) {
                var r = (t = this.pending).length % this._delta8
                ;(this.pending = t.slice(t.length - r, t.length)),
                  0 === this.pending.length && (this.pending = null),
                  (t = i.join32(t, 0, t.length - r, this.endian))
                for (var n = 0; n < t.length; n += this._delta32) this._update(t, n, n + this._delta32)
              }
              return this
            }),
            (o.prototype.digest = function (t) {
              return this.update(this._pad()), n(null === this.pending), this._digest(t)
            }),
            (o.prototype._pad = function () {
              var t = this.pendingTotal,
                e = this._delta8,
                r = e - ((t + this.padLength) % e),
                i = new Array(r + this.padLength)
              i[0] = 128
              for (var n = 1; n < r; n++) i[n] = 0
              if (((t <<= 3), 'big' === this.endian)) {
                for (var o = 8; o < this.padLength; o++) i[n++] = 0
                ;(i[n++] = 0),
                  (i[n++] = 0),
                  (i[n++] = 0),
                  (i[n++] = 0),
                  (i[n++] = (t >>> 24) & 255),
                  (i[n++] = (t >>> 16) & 255),
                  (i[n++] = (t >>> 8) & 255),
                  (i[n++] = 255 & t)
              } else
                for (
                  i[n++] = 255 & t,
                    i[n++] = (t >>> 8) & 255,
                    i[n++] = (t >>> 16) & 255,
                    i[n++] = (t >>> 24) & 255,
                    i[n++] = 0,
                    i[n++] = 0,
                    i[n++] = 0,
                    i[n++] = 0,
                    o = 8;
                  o < this.padLength;
                  o++
                )
                  i[n++] = 0
              return i
            })
        },
        7969: (t, e, r) => {
          'use strict'
          var i = r(8631),
            n = r(1339)
          function o(t, e, r) {
            if (!(this instanceof o)) return new o(t, e, r)
            ;(this.Hash = t),
              (this.blockSize = t.blockSize / 8),
              (this.outSize = t.outSize / 8),
              (this.inner = null),
              (this.outer = null),
              this._init(i.toArray(e, r))
          }
          ;(t.exports = o),
            (o.prototype._init = function (t) {
              t.length > this.blockSize && (t = new this.Hash().update(t).digest()), n(t.length <= this.blockSize)
              for (var e = t.length; e < this.blockSize; e++) t.push(0)
              for (e = 0; e < t.length; e++) t[e] ^= 54
              for (this.inner = new this.Hash().update(t), e = 0; e < t.length; e++) t[e] ^= 106
              this.outer = new this.Hash().update(t)
            }),
            (o.prototype.update = function (t, e) {
              return this.inner.update(t, e), this
            }),
            (o.prototype.digest = function (t) {
              return this.outer.update(this.inner.digest()), this.outer.digest(t)
            })
        },
        427: (t, e, r) => {
          'use strict'
          var i = r(8631),
            n = r(8766),
            o = i.rotl32,
            a = i.sum32,
            s = i.sum32_3,
            f = i.sum32_4,
            h = n.BlockHash
          function c() {
            if (!(this instanceof c)) return new c()
            h.call(this),
              (this.h = [1732584193, 4023233417, 2562383102, 271733878, 3285377520]),
              (this.endian = 'little')
          }
          function u(t, e, r, i) {
            return t <= 15
              ? e ^ r ^ i
              : t <= 31
              ? (e & r) | (~e & i)
              : t <= 47
              ? (e | ~r) ^ i
              : t <= 63
              ? (e & i) | (r & ~i)
              : e ^ (r | ~i)
          }
          function d(t) {
            return t <= 15 ? 0 : t <= 31 ? 1518500249 : t <= 47 ? 1859775393 : t <= 63 ? 2400959708 : 2840853838
          }
          function l(t) {
            return t <= 15 ? 1352829926 : t <= 31 ? 1548603684 : t <= 47 ? 1836072691 : t <= 63 ? 2053994217 : 0
          }
          i.inherits(c, h),
            (e.ripemd160 = c),
            (c.blockSize = 512),
            (c.outSize = 160),
            (c.hmacStrength = 192),
            (c.padLength = 64),
            (c.prototype._update = function (t, e) {
              for (
                var r = this.h[0],
                  i = this.h[1],
                  n = this.h[2],
                  h = this.h[3],
                  c = this.h[4],
                  g = r,
                  v = i,
                  _ = n,
                  w = h,
                  M = c,
                  S = 0;
                S < 80;
                S++
              ) {
                var E = a(o(f(r, u(S, i, n, h), t[p[S] + e], d(S)), m[S]), c)
                ;(r = c),
                  (c = h),
                  (h = o(n, 10)),
                  (n = i),
                  (i = E),
                  (E = a(o(f(g, u(79 - S, v, _, w), t[b[S] + e], l(S)), y[S]), M)),
                  (g = M),
                  (M = w),
                  (w = o(_, 10)),
                  (_ = v),
                  (v = E)
              }
              ;(E = s(this.h[1], n, w)),
                (this.h[1] = s(this.h[2], h, M)),
                (this.h[2] = s(this.h[3], c, g)),
                (this.h[3] = s(this.h[4], r, v)),
                (this.h[4] = s(this.h[0], i, _)),
                (this.h[0] = E)
            }),
            (c.prototype._digest = function (t) {
              return 'hex' === t ? i.toHex32(this.h, 'little') : i.split32(this.h, 'little')
            })
          var p = [
              0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11,
              8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5,
              6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
            ],
            b = [
              5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1,
              2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10,
              14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
            ],
            m = [
              11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7,
              13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6,
              8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6,
            ],
            y = [
              8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15,
              13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9,
              12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11,
            ]
        },
        6672: (t, e, r) => {
          'use strict'
          ;(e.sha1 = r(6114)), (e.sha224 = r(4853)), (e.sha256 = r(6586)), (e.sha384 = r(6474)), (e.sha512 = r(663))
        },
        6114: (t, e, r) => {
          'use strict'
          var i = r(8631),
            n = r(8766),
            o = r(1692),
            a = i.rotl32,
            s = i.sum32,
            f = i.sum32_5,
            h = o.ft_1,
            c = n.BlockHash,
            u = [1518500249, 1859775393, 2400959708, 3395469782]
          function d() {
            if (!(this instanceof d)) return new d()
            c.call(this),
              (this.h = [1732584193, 4023233417, 2562383102, 271733878, 3285377520]),
              (this.W = new Array(80))
          }
          i.inherits(d, c),
            (t.exports = d),
            (d.blockSize = 512),
            (d.outSize = 160),
            (d.hmacStrength = 80),
            (d.padLength = 64),
            (d.prototype._update = function (t, e) {
              for (var r = this.W, i = 0; i < 16; i++) r[i] = t[e + i]
              for (; i < r.length; i++) r[i] = a(r[i - 3] ^ r[i - 8] ^ r[i - 14] ^ r[i - 16], 1)
              var n = this.h[0],
                o = this.h[1],
                c = this.h[2],
                d = this.h[3],
                l = this.h[4]
              for (i = 0; i < r.length; i++) {
                var p = ~~(i / 20),
                  b = f(a(n, 5), h(p, o, c, d), l, r[i], u[p])
                ;(l = d), (d = c), (c = a(o, 30)), (o = n), (n = b)
              }
              ;(this.h[0] = s(this.h[0], n)),
                (this.h[1] = s(this.h[1], o)),
                (this.h[2] = s(this.h[2], c)),
                (this.h[3] = s(this.h[3], d)),
                (this.h[4] = s(this.h[4], l))
            }),
            (d.prototype._digest = function (t) {
              return 'hex' === t ? i.toHex32(this.h, 'big') : i.split32(this.h, 'big')
            })
        },
        4853: (t, e, r) => {
          'use strict'
          var i = r(8631),
            n = r(6586)
          function o() {
            if (!(this instanceof o)) return new o()
            n.call(this),
              (this.h = [3238371032, 914150663, 812702999, 4144912697, 4290775857, 1750603025, 1694076839, 3204075428])
          }
          i.inherits(o, n),
            (t.exports = o),
            (o.blockSize = 512),
            (o.outSize = 224),
            (o.hmacStrength = 192),
            (o.padLength = 64),
            (o.prototype._digest = function (t) {
              return 'hex' === t ? i.toHex32(this.h.slice(0, 7), 'big') : i.split32(this.h.slice(0, 7), 'big')
            })
        },
        6586: (t, e, r) => {
          'use strict'
          var i = r(8631),
            n = r(8766),
            o = r(1692),
            a = r(1339),
            s = i.sum32,
            f = i.sum32_4,
            h = i.sum32_5,
            c = o.ch32,
            u = o.maj32,
            d = o.s0_256,
            l = o.s1_256,
            p = o.g0_256,
            b = o.g1_256,
            m = n.BlockHash,
            y = [
              1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080,
              310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774,
              264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808,
              3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
              1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771,
              3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571,
              1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474,
              2756734187, 3204031479, 3329325298,
            ]
          function g() {
            if (!(this instanceof g)) return new g()
            m.call(this),
              (this.h = [
                1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225,
              ]),
              (this.k = y),
              (this.W = new Array(64))
          }
          i.inherits(g, m),
            (t.exports = g),
            (g.blockSize = 512),
            (g.outSize = 256),
            (g.hmacStrength = 192),
            (g.padLength = 64),
            (g.prototype._update = function (t, e) {
              for (var r = this.W, i = 0; i < 16; i++) r[i] = t[e + i]
              for (; i < r.length; i++) r[i] = f(b(r[i - 2]), r[i - 7], p(r[i - 15]), r[i - 16])
              var n = this.h[0],
                o = this.h[1],
                m = this.h[2],
                y = this.h[3],
                g = this.h[4],
                v = this.h[5],
                _ = this.h[6],
                w = this.h[7]
              for (a(this.k.length === r.length), i = 0; i < r.length; i++) {
                var M = h(w, l(g), c(g, v, _), this.k[i], r[i]),
                  S = s(d(n), u(n, o, m))
                ;(w = _), (_ = v), (v = g), (g = s(y, M)), (y = m), (m = o), (o = n), (n = s(M, S))
              }
              ;(this.h[0] = s(this.h[0], n)),
                (this.h[1] = s(this.h[1], o)),
                (this.h[2] = s(this.h[2], m)),
                (this.h[3] = s(this.h[3], y)),
                (this.h[4] = s(this.h[4], g)),
                (this.h[5] = s(this.h[5], v)),
                (this.h[6] = s(this.h[6], _)),
                (this.h[7] = s(this.h[7], w))
            }),
            (g.prototype._digest = function (t) {
              return 'hex' === t ? i.toHex32(this.h, 'big') : i.split32(this.h, 'big')
            })
        },
        6474: (t, e, r) => {
          'use strict'
          var i = r(8631),
            n = r(663)
          function o() {
            if (!(this instanceof o)) return new o()
            n.call(this),
              (this.h = [
                3418070365, 3238371032, 1654270250, 914150663, 2438529370, 812702999, 355462360, 4144912697, 1731405415,
                4290775857, 2394180231, 1750603025, 3675008525, 1694076839, 1203062813, 3204075428,
              ])
          }
          i.inherits(o, n),
            (t.exports = o),
            (o.blockSize = 1024),
            (o.outSize = 384),
            (o.hmacStrength = 192),
            (o.padLength = 128),
            (o.prototype._digest = function (t) {
              return 'hex' === t ? i.toHex32(this.h.slice(0, 12), 'big') : i.split32(this.h.slice(0, 12), 'big')
            })
        },
        663: (t, e, r) => {
          'use strict'
          var i = r(8631),
            n = r(8766),
            o = r(1339),
            a = i.rotr64_hi,
            s = i.rotr64_lo,
            f = i.shr64_hi,
            h = i.shr64_lo,
            c = i.sum64,
            u = i.sum64_hi,
            d = i.sum64_lo,
            l = i.sum64_4_hi,
            p = i.sum64_4_lo,
            b = i.sum64_5_hi,
            m = i.sum64_5_lo,
            y = n.BlockHash,
            g = [
              1116352408, 3609767458, 1899447441, 602891725, 3049323471, 3964484399, 3921009573, 2173295548, 961987163,
              4081628472, 1508970993, 3053834265, 2453635748, 2937671579, 2870763221, 3664609560, 3624381080,
              2734883394, 310598401, 1164996542, 607225278, 1323610764, 1426881987, 3590304994, 1925078388, 4068182383,
              2162078206, 991336113, 2614888103, 633803317, 3248222580, 3479774868, 3835390401, 2666613458, 4022224774,
              944711139, 264347078, 2341262773, 604807628, 2007800933, 770255983, 1495990901, 1249150122, 1856431235,
              1555081692, 3175218132, 1996064986, 2198950837, 2554220882, 3999719339, 2821834349, 766784016, 2952996808,
              2566594879, 3210313671, 3203337956, 3336571891, 1034457026, 3584528711, 2466948901, 113926993, 3758326383,
              338241895, 168717936, 666307205, 1188179964, 773529912, 1546045734, 1294757372, 1522805485, 1396182291,
              2643833823, 1695183700, 2343527390, 1986661051, 1014477480, 2177026350, 1206759142, 2456956037, 344077627,
              2730485921, 1290863460, 2820302411, 3158454273, 3259730800, 3505952657, 3345764771, 106217008, 3516065817,
              3606008344, 3600352804, 1432725776, 4094571909, 1467031594, 275423344, 851169720, 430227734, 3100823752,
              506948616, 1363258195, 659060556, 3750685593, 883997877, 3785050280, 958139571, 3318307427, 1322822218,
              3812723403, 1537002063, 2003034995, 1747873779, 3602036899, 1955562222, 1575990012, 2024104815,
              1125592928, 2227730452, 2716904306, 2361852424, 442776044, 2428436474, 593698344, 2756734187, 3733110249,
              3204031479, 2999351573, 3329325298, 3815920427, 3391569614, 3928383900, 3515267271, 566280711, 3940187606,
              3454069534, 4118630271, 4000239992, 116418474, 1914138554, 174292421, 2731055270, 289380356, 3203993006,
              460393269, 320620315, 685471733, 587496836, 852142971, 1086792851, 1017036298, 365543100, 1126000580,
              2618297676, 1288033470, 3409855158, 1501505948, 4234509866, 1607167915, 987167468, 1816402316, 1246189591,
            ]
          function v() {
            if (!(this instanceof v)) return new v()
            y.call(this),
              (this.h = [
                1779033703, 4089235720, 3144134277, 2227873595, 1013904242, 4271175723, 2773480762, 1595750129,
                1359893119, 2917565137, 2600822924, 725511199, 528734635, 4215389547, 1541459225, 327033209,
              ]),
              (this.k = g),
              (this.W = new Array(160))
          }
          function _(t, e, r, i, n) {
            var o = (t & r) ^ (~t & n)
            return o < 0 && (o += 4294967296), o
          }
          function w(t, e, r, i, n, o) {
            var a = (e & i) ^ (~e & o)
            return a < 0 && (a += 4294967296), a
          }
          function M(t, e, r, i, n) {
            var o = (t & r) ^ (t & n) ^ (r & n)
            return o < 0 && (o += 4294967296), o
          }
          function S(t, e, r, i, n, o) {
            var a = (e & i) ^ (e & o) ^ (i & o)
            return a < 0 && (a += 4294967296), a
          }
          function E(t, e) {
            var r = a(t, e, 28) ^ a(e, t, 2) ^ a(e, t, 7)
            return r < 0 && (r += 4294967296), r
          }
          function A(t, e) {
            var r = s(t, e, 28) ^ s(e, t, 2) ^ s(e, t, 7)
            return r < 0 && (r += 4294967296), r
          }
          function k(t, e) {
            var r = s(t, e, 14) ^ s(t, e, 18) ^ s(e, t, 9)
            return r < 0 && (r += 4294967296), r
          }
          function I(t, e) {
            var r = a(t, e, 1) ^ a(t, e, 8) ^ f(t, e, 7)
            return r < 0 && (r += 4294967296), r
          }
          function B(t, e) {
            var r = s(t, e, 1) ^ s(t, e, 8) ^ h(t, e, 7)
            return r < 0 && (r += 4294967296), r
          }
          function R(t, e) {
            var r = s(t, e, 19) ^ s(e, t, 29) ^ h(t, e, 6)
            return r < 0 && (r += 4294967296), r
          }
          i.inherits(v, y),
            (t.exports = v),
            (v.blockSize = 1024),
            (v.outSize = 512),
            (v.hmacStrength = 192),
            (v.padLength = 128),
            (v.prototype._prepareBlock = function (t, e) {
              for (var r = this.W, i = 0; i < 32; i++) r[i] = t[e + i]
              for (; i < r.length; i += 2) {
                var n =
                    ((m = r[i - 4]),
                    (y = r[i - 3]),
                    (g = void 0),
                    (g = a(m, y, 19) ^ a(y, m, 29) ^ f(m, y, 6)) < 0 && (g += 4294967296),
                    g),
                  o = R(r[i - 4], r[i - 3]),
                  s = r[i - 14],
                  h = r[i - 13],
                  c = I(r[i - 30], r[i - 29]),
                  u = B(r[i - 30], r[i - 29]),
                  d = r[i - 32],
                  b = r[i - 31]
                ;(r[i] = l(n, o, s, h, c, u, d, b)), (r[i + 1] = p(n, o, s, h, c, u, d, b))
              }
              var m, y, g
            }),
            (v.prototype._update = function (t, e) {
              this._prepareBlock(t, e)
              var r,
                i,
                n,
                s = this.W,
                f = this.h[0],
                h = this.h[1],
                l = this.h[2],
                p = this.h[3],
                y = this.h[4],
                g = this.h[5],
                v = this.h[6],
                I = this.h[7],
                B = this.h[8],
                R = this.h[9],
                x = this.h[10],
                T = this.h[11],
                L = this.h[12],
                C = this.h[13],
                P = this.h[14],
                O = this.h[15]
              o(this.k.length === s.length)
              for (var N = 0; N < s.length; N += 2) {
                var U = P,
                  D = O,
                  j =
                    ((n = void 0),
                    (n = a((r = B), (i = R), 14) ^ a(r, i, 18) ^ a(i, r, 9)) < 0 && (n += 4294967296),
                    n),
                  q = k(B, R),
                  z = _(B, 0, x, 0, L),
                  K = w(0, R, 0, T, 0, C),
                  F = this.k[N],
                  H = this.k[N + 1],
                  V = s[N],
                  W = s[N + 1],
                  Y = b(U, D, j, q, z, K, F, H, V, W),
                  G = m(U, D, j, q, z, K, F, H, V, W)
                ;(U = E(f, h)), (D = A(f, h)), (j = M(f, 0, l, 0, y)), (q = S(0, h, 0, p, 0, g))
                var Z = u(U, D, j, q),
                  X = d(U, D, j, q)
                ;(P = L),
                  (O = C),
                  (L = x),
                  (C = T),
                  (x = B),
                  (T = R),
                  (B = u(v, I, Y, G)),
                  (R = d(I, I, Y, G)),
                  (v = y),
                  (I = g),
                  (y = l),
                  (g = p),
                  (l = f),
                  (p = h),
                  (f = u(Y, G, Z, X)),
                  (h = d(Y, G, Z, X))
              }
              c(this.h, 0, f, h),
                c(this.h, 2, l, p),
                c(this.h, 4, y, g),
                c(this.h, 6, v, I),
                c(this.h, 8, B, R),
                c(this.h, 10, x, T),
                c(this.h, 12, L, C),
                c(this.h, 14, P, O)
            }),
            (v.prototype._digest = function (t) {
              return 'hex' === t ? i.toHex32(this.h, 'big') : i.split32(this.h, 'big')
            })
        },
        1692: (t, e, r) => {
          'use strict'
          var i = r(8631).rotr32
          function n(t, e, r) {
            return (t & e) ^ (~t & r)
          }
          function o(t, e, r) {
            return (t & e) ^ (t & r) ^ (e & r)
          }
          function a(t, e, r) {
            return t ^ e ^ r
          }
          ;(e.ft_1 = function (t, e, r, i) {
            return 0 === t ? n(e, r, i) : 1 === t || 3 === t ? a(e, r, i) : 2 === t ? o(e, r, i) : void 0
          }),
            (e.ch32 = n),
            (e.maj32 = o),
            (e.p32 = a),
            (e.s0_256 = function (t) {
              return i(t, 2) ^ i(t, 13) ^ i(t, 22)
            }),
            (e.s1_256 = function (t) {
              return i(t, 6) ^ i(t, 11) ^ i(t, 25)
            }),
            (e.g0_256 = function (t) {
              return i(t, 7) ^ i(t, 18) ^ (t >>> 3)
            }),
            (e.g1_256 = function (t) {
              return i(t, 17) ^ i(t, 19) ^ (t >>> 10)
            })
        },
        8631: (t, e, r) => {
          'use strict'
          var i = r(1339),
            n = r(4603)
          function o(t, e) {
            return (
              55296 == (64512 & t.charCodeAt(e)) &&
              !(e < 0 || e + 1 >= t.length) &&
              56320 == (64512 & t.charCodeAt(e + 1))
            )
          }
          function a(t) {
            return ((t >>> 24) | ((t >>> 8) & 65280) | ((t << 8) & 16711680) | ((255 & t) << 24)) >>> 0
          }
          function s(t) {
            return 1 === t.length ? '0' + t : t
          }
          function f(t) {
            return 7 === t.length
              ? '0' + t
              : 6 === t.length
              ? '00' + t
              : 5 === t.length
              ? '000' + t
              : 4 === t.length
              ? '0000' + t
              : 3 === t.length
              ? '00000' + t
              : 2 === t.length
              ? '000000' + t
              : 1 === t.length
              ? '0000000' + t
              : t
          }
          ;(e.inherits = n),
            (e.toArray = function (t, e) {
              if (Array.isArray(t)) return t.slice()
              if (!t) return []
              var r = []
              if ('string' == typeof t)
                if (e) {
                  if ('hex' === e)
                    for (
                      (t = t.replace(/[^a-z0-9]+/gi, '')).length % 2 != 0 && (t = '0' + t), n = 0;
                      n < t.length;
                      n += 2
                    )
                      r.push(parseInt(t[n] + t[n + 1], 16))
                } else
                  for (var i = 0, n = 0; n < t.length; n++) {
                    var a = t.charCodeAt(n)
                    a < 128
                      ? (r[i++] = a)
                      : a < 2048
                      ? ((r[i++] = (a >> 6) | 192), (r[i++] = (63 & a) | 128))
                      : o(t, n)
                      ? ((a = 65536 + ((1023 & a) << 10) + (1023 & t.charCodeAt(++n))),
                        (r[i++] = (a >> 18) | 240),
                        (r[i++] = ((a >> 12) & 63) | 128),
                        (r[i++] = ((a >> 6) & 63) | 128),
                        (r[i++] = (63 & a) | 128))
                      : ((r[i++] = (a >> 12) | 224), (r[i++] = ((a >> 6) & 63) | 128), (r[i++] = (63 & a) | 128))
                  }
              else for (n = 0; n < t.length; n++) r[n] = 0 | t[n]
              return r
            }),
            (e.toHex = function (t) {
              for (var e = '', r = 0; r < t.length; r++) e += s(t[r].toString(16))
              return e
            }),
            (e.htonl = a),
            (e.toHex32 = function (t, e) {
              for (var r = '', i = 0; i < t.length; i++) {
                var n = t[i]
                'little' === e && (n = a(n)), (r += f(n.toString(16)))
              }
              return r
            }),
            (e.zero2 = s),
            (e.zero8 = f),
            (e.join32 = function (t, e, r, n) {
              var o = r - e
              i(o % 4 == 0)
              for (var a = new Array(o / 4), s = 0, f = e; s < a.length; s++, f += 4) {
                var h
                ;(h =
                  'big' === n
                    ? (t[f] << 24) | (t[f + 1] << 16) | (t[f + 2] << 8) | t[f + 3]
                    : (t[f + 3] << 24) | (t[f + 2] << 16) | (t[f + 1] << 8) | t[f]),
                  (a[s] = h >>> 0)
              }
              return a
            }),
            (e.split32 = function (t, e) {
              for (var r = new Array(4 * t.length), i = 0, n = 0; i < t.length; i++, n += 4) {
                var o = t[i]
                'big' === e
                  ? ((r[n] = o >>> 24),
                    (r[n + 1] = (o >>> 16) & 255),
                    (r[n + 2] = (o >>> 8) & 255),
                    (r[n + 3] = 255 & o))
                  : ((r[n + 3] = o >>> 24),
                    (r[n + 2] = (o >>> 16) & 255),
                    (r[n + 1] = (o >>> 8) & 255),
                    (r[n] = 255 & o))
              }
              return r
            }),
            (e.rotr32 = function (t, e) {
              return (t >>> e) | (t << (32 - e))
            }),
            (e.rotl32 = function (t, e) {
              return (t << e) | (t >>> (32 - e))
            }),
            (e.sum32 = function (t, e) {
              return (t + e) >>> 0
            }),
            (e.sum32_3 = function (t, e, r) {
              return (t + e + r) >>> 0
            }),
            (e.sum32_4 = function (t, e, r, i) {
              return (t + e + r + i) >>> 0
            }),
            (e.sum32_5 = function (t, e, r, i, n) {
              return (t + e + r + i + n) >>> 0
            }),
            (e.sum64 = function (t, e, r, i) {
              var n = t[e],
                o = (i + t[e + 1]) >>> 0,
                a = (o < i ? 1 : 0) + r + n
              ;(t[e] = a >>> 0), (t[e + 1] = o)
            }),
            (e.sum64_hi = function (t, e, r, i) {
              return (((e + i) >>> 0 < e ? 1 : 0) + t + r) >>> 0
            }),
            (e.sum64_lo = function (t, e, r, i) {
              return (e + i) >>> 0
            }),
            (e.sum64_4_hi = function (t, e, r, i, n, o, a, s) {
              var f = 0,
                h = e
              return (
                (f += (h = (h + i) >>> 0) < e ? 1 : 0),
                (f += (h = (h + o) >>> 0) < o ? 1 : 0),
                (t + r + n + a + (f += (h = (h + s) >>> 0) < s ? 1 : 0)) >>> 0
              )
            }),
            (e.sum64_4_lo = function (t, e, r, i, n, o, a, s) {
              return (e + i + o + s) >>> 0
            }),
            (e.sum64_5_hi = function (t, e, r, i, n, o, a, s, f, h) {
              var c = 0,
                u = e
              return (
                (c += (u = (u + i) >>> 0) < e ? 1 : 0),
                (c += (u = (u + o) >>> 0) < o ? 1 : 0),
                (c += (u = (u + s) >>> 0) < s ? 1 : 0),
                (t + r + n + a + f + (c += (u = (u + h) >>> 0) < h ? 1 : 0)) >>> 0
              )
            }),
            (e.sum64_5_lo = function (t, e, r, i, n, o, a, s, f, h) {
              return (e + i + o + s + h) >>> 0
            }),
            (e.rotr64_hi = function (t, e, r) {
              return ((e << (32 - r)) | (t >>> r)) >>> 0
            }),
            (e.rotr64_lo = function (t, e, r) {
              return ((t << (32 - r)) | (e >>> r)) >>> 0
            }),
            (e.shr64_hi = function (t, e, r) {
              return t >>> r
            }),
            (e.shr64_lo = function (t, e, r) {
              return ((t << (32 - r)) | (e >>> r)) >>> 0
            })
        },
        4227: (t, e, r) => {
          'use strict'
          var i = r(5582),
            n = r(1984),
            o = r(1339)
          function a(t) {
            if (!(this instanceof a)) return new a(t)
            ;(this.hash = t.hash),
              (this.predResist = !!t.predResist),
              (this.outLen = this.hash.outSize),
              (this.minEntropy = t.minEntropy || this.hash.hmacStrength),
              (this._reseed = null),
              (this.reseedInterval = null),
              (this.K = null),
              (this.V = null)
            var e = n.toArray(t.entropy, t.entropyEnc || 'hex'),
              r = n.toArray(t.nonce, t.nonceEnc || 'hex'),
              i = n.toArray(t.pers, t.persEnc || 'hex')
            o(e.length >= this.minEntropy / 8, 'Not enough entropy. Minimum is: ' + this.minEntropy + ' bits'),
              this._init(e, r, i)
          }
          ;(t.exports = a),
            (a.prototype._init = function (t, e, r) {
              var i = t.concat(e).concat(r)
              ;(this.K = new Array(this.outLen / 8)), (this.V = new Array(this.outLen / 8))
              for (var n = 0; n < this.V.length; n++) (this.K[n] = 0), (this.V[n] = 1)
              this._update(i), (this._reseed = 1), (this.reseedInterval = 281474976710656)
            }),
            (a.prototype._hmac = function () {
              return new i.hmac(this.hash, this.K)
            }),
            (a.prototype._update = function (t) {
              var e = this._hmac().update(this.V).update([0])
              t && (e = e.update(t)),
                (this.K = e.digest()),
                (this.V = this._hmac().update(this.V).digest()),
                t &&
                  ((this.K = this._hmac().update(this.V).update([1]).update(t).digest()),
                  (this.V = this._hmac().update(this.V).digest()))
            }),
            (a.prototype.reseed = function (t, e, r, i) {
              'string' != typeof e && ((i = r), (r = e), (e = null)),
                (t = n.toArray(t, e)),
                (r = n.toArray(r, i)),
                o(t.length >= this.minEntropy / 8, 'Not enough entropy. Minimum is: ' + this.minEntropy + ' bits'),
                this._update(t.concat(r || [])),
                (this._reseed = 1)
            }),
            (a.prototype.generate = function (t, e, r, i) {
              if (this._reseed > this.reseedInterval) throw new Error('Reseed is required')
              'string' != typeof e && ((i = r), (r = e), (e = null)),
                r && ((r = n.toArray(r, i || 'hex')), this._update(r))
              for (var o = []; o.length < t; ) (this.V = this._hmac().update(this.V).digest()), (o = o.concat(this.V))
              var a = o.slice(0, t)
              return this._update(r), this._reseed++, n.encode(a, e)
            })
        },
        7467: (t, e) => {
          ;(e.read = function (t, e, r, i, n) {
            var o,
              a,
              s = 8 * n - i - 1,
              f = (1 << s) - 1,
              h = f >> 1,
              c = -7,
              u = r ? n - 1 : 0,
              d = r ? -1 : 1,
              l = t[e + u]
            for (u += d, o = l & ((1 << -c) - 1), l >>= -c, c += s; c > 0; o = 256 * o + t[e + u], u += d, c -= 8);
            for (a = o & ((1 << -c) - 1), o >>= -c, c += i; c > 0; a = 256 * a + t[e + u], u += d, c -= 8);
            if (0 === o) o = 1 - h
            else {
              if (o === f) return a ? NaN : (1 / 0) * (l ? -1 : 1)
              ;(a += Math.pow(2, i)), (o -= h)
            }
            return (l ? -1 : 1) * a * Math.pow(2, o - i)
          }),
            (e.write = function (t, e, r, i, n, o) {
              var a,
                s,
                f,
                h = 8 * o - n - 1,
                c = (1 << h) - 1,
                u = c >> 1,
                d = 23 === n ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
                l = i ? 0 : o - 1,
                p = i ? 1 : -1,
                b = e < 0 || (0 === e && 1 / e < 0) ? 1 : 0
              for (
                e = Math.abs(e),
                  isNaN(e) || e === 1 / 0
                    ? ((s = isNaN(e) ? 1 : 0), (a = c))
                    : ((a = Math.floor(Math.log(e) / Math.LN2)),
                      e * (f = Math.pow(2, -a)) < 1 && (a--, (f *= 2)),
                      (e += a + u >= 1 ? d / f : d * Math.pow(2, 1 - u)) * f >= 2 && (a++, (f /= 2)),
                      a + u >= c
                        ? ((s = 0), (a = c))
                        : a + u >= 1
                        ? ((s = (e * f - 1) * Math.pow(2, n)), (a += u))
                        : ((s = e * Math.pow(2, u - 1) * Math.pow(2, n)), (a = 0)));
                n >= 8;
                t[r + l] = 255 & s, l += p, s /= 256, n -= 8
              );
              for (a = (a << n) | s, h += n; h > 0; t[r + l] = 255 & a, l += p, a /= 256, h -= 8);
              t[r + l - p] |= 128 * b
            })
        },
        4603: (t) => {
          'function' == typeof Object.create
            ? (t.exports = function (t, e) {
                e &&
                  ((t.super_ = e),
                  (t.prototype = Object.create(e.prototype, {
                    constructor: { value: t, enumerable: !1, writable: !0, configurable: !0 },
                  })))
              })
            : (t.exports = function (t, e) {
                if (e) {
                  t.super_ = e
                  var r = function () {}
                  ;(r.prototype = e.prototype), (t.prototype = new r()), (t.prototype.constructor = t)
                }
              })
        },
        2108: (t, e, r) => {
          'use strict'
          var i = r(4603),
            n = r(6018),
            o = r(8467).Buffer,
            a = new Array(16)
          function s() {
            n.call(this, 64),
              (this._a = 1732584193),
              (this._b = 4023233417),
              (this._c = 2562383102),
              (this._d = 271733878)
          }
          function f(t, e) {
            return (t << e) | (t >>> (32 - e))
          }
          function h(t, e, r, i, n, o, a) {
            return (f((t + ((e & r) | (~e & i)) + n + o) | 0, a) + e) | 0
          }
          function c(t, e, r, i, n, o, a) {
            return (f((t + ((e & i) | (r & ~i)) + n + o) | 0, a) + e) | 0
          }
          function u(t, e, r, i, n, o, a) {
            return (f((t + (e ^ r ^ i) + n + o) | 0, a) + e) | 0
          }
          function d(t, e, r, i, n, o, a) {
            return (f((t + (r ^ (e | ~i)) + n + o) | 0, a) + e) | 0
          }
          i(s, n),
            (s.prototype._update = function () {
              for (var t = a, e = 0; e < 16; ++e) t[e] = this._block.readInt32LE(4 * e)
              var r = this._a,
                i = this._b,
                n = this._c,
                o = this._d
              ;(r = h(r, i, n, o, t[0], 3614090360, 7)),
                (o = h(o, r, i, n, t[1], 3905402710, 12)),
                (n = h(n, o, r, i, t[2], 606105819, 17)),
                (i = h(i, n, o, r, t[3], 3250441966, 22)),
                (r = h(r, i, n, o, t[4], 4118548399, 7)),
                (o = h(o, r, i, n, t[5], 1200080426, 12)),
                (n = h(n, o, r, i, t[6], 2821735955, 17)),
                (i = h(i, n, o, r, t[7], 4249261313, 22)),
                (r = h(r, i, n, o, t[8], 1770035416, 7)),
                (o = h(o, r, i, n, t[9], 2336552879, 12)),
                (n = h(n, o, r, i, t[10], 4294925233, 17)),
                (i = h(i, n, o, r, t[11], 2304563134, 22)),
                (r = h(r, i, n, o, t[12], 1804603682, 7)),
                (o = h(o, r, i, n, t[13], 4254626195, 12)),
                (n = h(n, o, r, i, t[14], 2792965006, 17)),
                (r = c(r, (i = h(i, n, o, r, t[15], 1236535329, 22)), n, o, t[1], 4129170786, 5)),
                (o = c(o, r, i, n, t[6], 3225465664, 9)),
                (n = c(n, o, r, i, t[11], 643717713, 14)),
                (i = c(i, n, o, r, t[0], 3921069994, 20)),
                (r = c(r, i, n, o, t[5], 3593408605, 5)),
                (o = c(o, r, i, n, t[10], 38016083, 9)),
                (n = c(n, o, r, i, t[15], 3634488961, 14)),
                (i = c(i, n, o, r, t[4], 3889429448, 20)),
                (r = c(r, i, n, o, t[9], 568446438, 5)),
                (o = c(o, r, i, n, t[14], 3275163606, 9)),
                (n = c(n, o, r, i, t[3], 4107603335, 14)),
                (i = c(i, n, o, r, t[8], 1163531501, 20)),
                (r = c(r, i, n, o, t[13], 2850285829, 5)),
                (o = c(o, r, i, n, t[2], 4243563512, 9)),
                (n = c(n, o, r, i, t[7], 1735328473, 14)),
                (r = u(r, (i = c(i, n, o, r, t[12], 2368359562, 20)), n, o, t[5], 4294588738, 4)),
                (o = u(o, r, i, n, t[8], 2272392833, 11)),
                (n = u(n, o, r, i, t[11], 1839030562, 16)),
                (i = u(i, n, o, r, t[14], 4259657740, 23)),
                (r = u(r, i, n, o, t[1], 2763975236, 4)),
                (o = u(o, r, i, n, t[4], 1272893353, 11)),
                (n = u(n, o, r, i, t[7], 4139469664, 16)),
                (i = u(i, n, o, r, t[10], 3200236656, 23)),
                (r = u(r, i, n, o, t[13], 681279174, 4)),
                (o = u(o, r, i, n, t[0], 3936430074, 11)),
                (n = u(n, o, r, i, t[3], 3572445317, 16)),
                (i = u(i, n, o, r, t[6], 76029189, 23)),
                (r = u(r, i, n, o, t[9], 3654602809, 4)),
                (o = u(o, r, i, n, t[12], 3873151461, 11)),
                (n = u(n, o, r, i, t[15], 530742520, 16)),
                (r = d(r, (i = u(i, n, o, r, t[2], 3299628645, 23)), n, o, t[0], 4096336452, 6)),
                (o = d(o, r, i, n, t[7], 1126891415, 10)),
                (n = d(n, o, r, i, t[14], 2878612391, 15)),
                (i = d(i, n, o, r, t[5], 4237533241, 21)),
                (r = d(r, i, n, o, t[12], 1700485571, 6)),
                (o = d(o, r, i, n, t[3], 2399980690, 10)),
                (n = d(n, o, r, i, t[10], 4293915773, 15)),
                (i = d(i, n, o, r, t[1], 2240044497, 21)),
                (r = d(r, i, n, o, t[8], 1873313359, 6)),
                (o = d(o, r, i, n, t[15], 4264355552, 10)),
                (n = d(n, o, r, i, t[6], 2734768916, 15)),
                (i = d(i, n, o, r, t[13], 1309151649, 21)),
                (r = d(r, i, n, o, t[4], 4149444226, 6)),
                (o = d(o, r, i, n, t[11], 3174756917, 10)),
                (n = d(n, o, r, i, t[2], 718787259, 15)),
                (i = d(i, n, o, r, t[9], 3951481745, 21)),
                (this._a = (this._a + r) | 0),
                (this._b = (this._b + i) | 0),
                (this._c = (this._c + n) | 0),
                (this._d = (this._d + o) | 0)
            }),
            (s.prototype._digest = function () {
              ;(this._block[this._blockOffset++] = 128),
                this._blockOffset > 56 &&
                  (this._block.fill(0, this._blockOffset, 64), this._update(), (this._blockOffset = 0)),
                this._block.fill(0, this._blockOffset, 56),
                this._block.writeUInt32LE(this._length[0], 56),
                this._block.writeUInt32LE(this._length[1], 60),
                this._update()
              var t = o.allocUnsafe(16)
              return (
                t.writeInt32LE(this._a, 0),
                t.writeInt32LE(this._b, 4),
                t.writeInt32LE(this._c, 8),
                t.writeInt32LE(this._d, 12),
                t
              )
            }),
            (t.exports = s)
        },
        9409: (t, e, r) => {
          var i = r(5612),
            n = r(5229)
          function o(t) {
            this.rand = t || new n.Rand()
          }
          ;(t.exports = o),
            (o.create = function (t) {
              return new o(t)
            }),
            (o.prototype._randbelow = function (t) {
              var e = t.bitLength(),
                r = Math.ceil(e / 8)
              do {
                var n = new i(this.rand.generate(r))
              } while (n.cmp(t) >= 0)
              return n
            }),
            (o.prototype._randrange = function (t, e) {
              var r = e.sub(t)
              return t.add(this._randbelow(r))
            }),
            (o.prototype.test = function (t, e, r) {
              var n = t.bitLength(),
                o = i.mont(t),
                a = new i(1).toRed(o)
              e || (e = Math.max(1, (n / 48) | 0))
              for (var s = t.subn(1), f = 0; !s.testn(f); f++);
              for (var h = t.shrn(f), c = s.toRed(o); e > 0; e--) {
                var u = this._randrange(new i(2), s)
                r && r(u)
                var d = u.toRed(o).redPow(h)
                if (0 !== d.cmp(a) && 0 !== d.cmp(c)) {
                  for (var l = 1; l < f; l++) {
                    if (0 === (d = d.redSqr()).cmp(a)) return !1
                    if (0 === d.cmp(c)) break
                  }
                  if (l === f) return !1
                }
              }
              return !0
            }),
            (o.prototype.getDivisor = function (t, e) {
              var r = t.bitLength(),
                n = i.mont(t),
                o = new i(1).toRed(n)
              e || (e = Math.max(1, (r / 48) | 0))
              for (var a = t.subn(1), s = 0; !a.testn(s); s++);
              for (var f = t.shrn(s), h = a.toRed(n); e > 0; e--) {
                var c = this._randrange(new i(2), a),
                  u = t.gcd(c)
                if (0 !== u.cmpn(1)) return u
                var d = c.toRed(n).redPow(f)
                if (0 !== d.cmp(o) && 0 !== d.cmp(h)) {
                  for (var l = 1; l < s; l++) {
                    if (0 === (d = d.redSqr()).cmp(o)) return d.fromRed().subn(1).gcd(t)
                    if (0 === d.cmp(h)) break
                  }
                  if (l === s) return (d = d.redSqr()).fromRed().subn(1).gcd(t)
                }
              }
              return !1
            })
        },
        1339: (t) => {
          function e(t, e) {
            if (!t) throw new Error(e || 'Assertion failed')
          }
          ;(t.exports = e),
            (e.equal = function (t, e, r) {
              if (t != e) throw new Error(r || 'Assertion failed: ' + t + ' != ' + e)
            })
        },
        1984: (t, e) => {
          'use strict'
          var r = e
          function i(t) {
            return 1 === t.length ? '0' + t : t
          }
          function n(t) {
            for (var e = '', r = 0; r < t.length; r++) e += i(t[r].toString(16))
            return e
          }
          ;(r.toArray = function (t, e) {
            if (Array.isArray(t)) return t.slice()
            if (!t) return []
            var r = []
            if ('string' != typeof t) {
              for (var i = 0; i < t.length; i++) r[i] = 0 | t[i]
              return r
            }
            if ('hex' === e)
              for ((t = t.replace(/[^a-z0-9]+/gi, '')).length % 2 != 0 && (t = '0' + t), i = 0; i < t.length; i += 2)
                r.push(parseInt(t[i] + t[i + 1], 16))
            else
              for (i = 0; i < t.length; i++) {
                var n = t.charCodeAt(i),
                  o = n >> 8,
                  a = 255 & n
                o ? r.push(o, a) : r.push(a)
              }
            return r
          }),
            (r.zero2 = i),
            (r.toHex = n),
            (r.encode = function (t, e) {
              return 'hex' === e ? n(t) : t
            })
        },
        6366: (t) => {
          'use strict'
          t.exports = JSON.parse(
            '{"2.16.840.1.101.3.4.1.1":"aes-128-ecb","2.16.840.1.101.3.4.1.2":"aes-128-cbc","2.16.840.1.101.3.4.1.3":"aes-128-ofb","2.16.840.1.101.3.4.1.4":"aes-128-cfb","2.16.840.1.101.3.4.1.21":"aes-192-ecb","2.16.840.1.101.3.4.1.22":"aes-192-cbc","2.16.840.1.101.3.4.1.23":"aes-192-ofb","2.16.840.1.101.3.4.1.24":"aes-192-cfb","2.16.840.1.101.3.4.1.41":"aes-256-ecb","2.16.840.1.101.3.4.1.42":"aes-256-cbc","2.16.840.1.101.3.4.1.43":"aes-256-ofb","2.16.840.1.101.3.4.1.44":"aes-256-cfb"}',
          )
        },
        9868: (t, e, r) => {
          'use strict'
          var i = r(2937)
          e.certificate = r(5684)
          var n = i.define('RSAPrivateKey', function () {
            this.seq().obj(
              this.key('version').int(),
              this.key('modulus').int(),
              this.key('publicExponent').int(),
              this.key('privateExponent').int(),
              this.key('prime1').int(),
              this.key('prime2').int(),
              this.key('exponent1').int(),
              this.key('exponent2').int(),
              this.key('coefficient').int(),
            )
          })
          e.RSAPrivateKey = n
          var o = i.define('RSAPublicKey', function () {
            this.seq().obj(this.key('modulus').int(), this.key('publicExponent').int())
          })
          e.RSAPublicKey = o
          var a = i.define('SubjectPublicKeyInfo', function () {
            this.seq().obj(this.key('algorithm').use(s), this.key('subjectPublicKey').bitstr())
          })
          e.PublicKey = a
          var s = i.define('AlgorithmIdentifier', function () {
              this.seq().obj(
                this.key('algorithm').objid(),
                this.key('none').null_().optional(),
                this.key('curve').objid().optional(),
                this.key('params').seq().obj(this.key('p').int(), this.key('q').int(), this.key('g').int()).optional(),
              )
            }),
            f = i.define('PrivateKeyInfo', function () {
              this.seq().obj(
                this.key('version').int(),
                this.key('algorithm').use(s),
                this.key('subjectPrivateKey').octstr(),
              )
            })
          e.PrivateKey = f
          var h = i.define('EncryptedPrivateKeyInfo', function () {
            this.seq().obj(
              this.key('algorithm')
                .seq()
                .obj(
                  this.key('id').objid(),
                  this.key('decrypt')
                    .seq()
                    .obj(
                      this.key('kde')
                        .seq()
                        .obj(
                          this.key('id').objid(),
                          this.key('kdeparams').seq().obj(this.key('salt').octstr(), this.key('iters').int()),
                        ),
                      this.key('cipher').seq().obj(this.key('algo').objid(), this.key('iv').octstr()),
                    ),
                ),
              this.key('subjectPrivateKey').octstr(),
            )
          })
          e.EncryptedPrivateKey = h
          var c = i.define('DSAPrivateKey', function () {
            this.seq().obj(
              this.key('version').int(),
              this.key('p').int(),
              this.key('q').int(),
              this.key('g').int(),
              this.key('pub_key').int(),
              this.key('priv_key').int(),
            )
          })
          ;(e.DSAPrivateKey = c),
            (e.DSAparam = i.define('DSAparam', function () {
              this.int()
            }))
          var u = i.define('ECPrivateKey', function () {
            this.seq().obj(
              this.key('version').int(),
              this.key('privateKey').octstr(),
              this.key('parameters').optional().explicit(0).use(d),
              this.key('publicKey').optional().explicit(1).bitstr(),
            )
          })
          e.ECPrivateKey = u
          var d = i.define('ECParameters', function () {
            this.choice({ namedCurve: this.objid() })
          })
          e.signature = i.define('signature', function () {
            this.seq().obj(this.key('r').int(), this.key('s').int())
          })
        },
        5684: (t, e, r) => {
          'use strict'
          var i = r(2937),
            n = i.define('Time', function () {
              this.choice({ utcTime: this.utctime(), generalTime: this.gentime() })
            }),
            o = i.define('AttributeTypeValue', function () {
              this.seq().obj(this.key('type').objid(), this.key('value').any())
            }),
            a = i.define('AlgorithmIdentifier', function () {
              this.seq().obj(
                this.key('algorithm').objid(),
                this.key('parameters').optional(),
                this.key('curve').objid().optional(),
              )
            }),
            s = i.define('SubjectPublicKeyInfo', function () {
              this.seq().obj(this.key('algorithm').use(a), this.key('subjectPublicKey').bitstr())
            }),
            f = i.define('RelativeDistinguishedName', function () {
              this.setof(o)
            }),
            h = i.define('RDNSequence', function () {
              this.seqof(f)
            }),
            c = i.define('Name', function () {
              this.choice({ rdnSequence: this.use(h) })
            }),
            u = i.define('Validity', function () {
              this.seq().obj(this.key('notBefore').use(n), this.key('notAfter').use(n))
            }),
            d = i.define('Extension', function () {
              this.seq().obj(
                this.key('extnID').objid(),
                this.key('critical').bool().def(!1),
                this.key('extnValue').octstr(),
              )
            }),
            l = i.define('TBSCertificate', function () {
              this.seq().obj(
                this.key('version').explicit(0).int().optional(),
                this.key('serialNumber').int(),
                this.key('signature').use(a),
                this.key('issuer').use(c),
                this.key('validity').use(u),
                this.key('subject').use(c),
                this.key('subjectPublicKeyInfo').use(s),
                this.key('issuerUniqueID').implicit(1).bitstr().optional(),
                this.key('subjectUniqueID').implicit(2).bitstr().optional(),
                this.key('extensions').explicit(3).seqof(d).optional(),
              )
            }),
            p = i.define('X509Certificate', function () {
              this.seq().obj(
                this.key('tbsCertificate').use(l),
                this.key('signatureAlgorithm').use(a),
                this.key('signatureValue').bitstr(),
              )
            })
          t.exports = p
        },
        5732: (t, e, r) => {
          var i =
              /Proc-Type: 4,ENCRYPTED[\n\r]+DEK-Info: AES-((?:128)|(?:192)|(?:256))-CBC,([0-9A-H]+)[\n\r]+([0-9A-z\n\r+/=]+)[\n\r]+/m,
            n = /^-----BEGIN ((?:.*? KEY)|CERTIFICATE)-----/m,
            o = /^-----BEGIN ((?:.*? KEY)|CERTIFICATE)-----([0-9A-z\n\r+/=]+)-----END \1-----$/m,
            a = r(3014),
            s = r(8860),
            f = r(8467).Buffer
          t.exports = function (t, e) {
            var r,
              h = t.toString(),
              c = h.match(i)
            if (c) {
              var u = 'aes' + c[1],
                d = f.from(c[2], 'hex'),
                l = f.from(c[3].replace(/[\r\n]/g, ''), 'base64'),
                p = a(e, d.slice(0, 8), parseInt(c[1], 10)).key,
                b = [],
                m = s.createDecipheriv(u, p, d)
              b.push(m.update(l)), b.push(m.final()), (r = f.concat(b))
            } else {
              var y = h.match(o)
              r = f.from(y[2].replace(/[\r\n]/g, ''), 'base64')
            }
            return { tag: h.match(n)[1], data: r }
          }
        },
        9558: (t, e, r) => {
          var i = r(9868),
            n = r(6366),
            o = r(5732),
            a = r(8860),
            s = r(2769),
            f = r(8467).Buffer
          function h(t) {
            var e
            'object' != typeof t || f.isBuffer(t) || ((e = t.passphrase), (t = t.key)),
              'string' == typeof t && (t = f.from(t))
            var r,
              h,
              c = o(t, e),
              u = c.tag,
              d = c.data
            switch (u) {
              case 'CERTIFICATE':
                h = i.certificate.decode(d, 'der').tbsCertificate.subjectPublicKeyInfo
              case 'PUBLIC KEY':
                switch ((h || (h = i.PublicKey.decode(d, 'der')), (r = h.algorithm.algorithm.join('.')))) {
                  case '1.2.840.113549.1.1.1':
                    return i.RSAPublicKey.decode(h.subjectPublicKey.data, 'der')
                  case '1.2.840.10045.2.1':
                    return (h.subjectPrivateKey = h.subjectPublicKey), { type: 'ec', data: h }
                  case '1.2.840.10040.4.1':
                    return (
                      (h.algorithm.params.pub_key = i.DSAparam.decode(h.subjectPublicKey.data, 'der')),
                      { type: 'dsa', data: h.algorithm.params }
                    )
                  default:
                    throw new Error('unknown key id ' + r)
                }
              case 'ENCRYPTED PRIVATE KEY':
                d = (function (t, e) {
                  var r = t.algorithm.decrypt.kde.kdeparams.salt,
                    i = parseInt(t.algorithm.decrypt.kde.kdeparams.iters.toString(), 10),
                    o = n[t.algorithm.decrypt.cipher.algo.join('.')],
                    h = t.algorithm.decrypt.cipher.iv,
                    c = t.subjectPrivateKey,
                    u = parseInt(o.split('-')[1], 10) / 8,
                    d = s.pbkdf2Sync(e, r, i, u, 'sha1'),
                    l = a.createDecipheriv(o, d, h),
                    p = []
                  return p.push(l.update(c)), p.push(l.final()), f.concat(p)
                })((d = i.EncryptedPrivateKey.decode(d, 'der')), e)
              case 'PRIVATE KEY':
                switch ((r = (h = i.PrivateKey.decode(d, 'der')).algorithm.algorithm.join('.'))) {
                  case '1.2.840.113549.1.1.1':
                    return i.RSAPrivateKey.decode(h.subjectPrivateKey, 'der')
                  case '1.2.840.10045.2.1':
                    return {
                      curve: h.algorithm.curve,
                      privateKey: i.ECPrivateKey.decode(h.subjectPrivateKey, 'der').privateKey,
                    }
                  case '1.2.840.10040.4.1':
                    return (
                      (h.algorithm.params.priv_key = i.DSAparam.decode(h.subjectPrivateKey, 'der')),
                      { type: 'dsa', params: h.algorithm.params }
                    )
                  default:
                    throw new Error('unknown key id ' + r)
                }
              case 'RSA PUBLIC KEY':
                return i.RSAPublicKey.decode(d, 'der')
              case 'RSA PRIVATE KEY':
                return i.RSAPrivateKey.decode(d, 'der')
              case 'DSA PRIVATE KEY':
                return { type: 'dsa', params: i.DSAPrivateKey.decode(d, 'der') }
              case 'EC PRIVATE KEY':
                return { curve: (d = i.ECPrivateKey.decode(d, 'der')).parameters.value, privateKey: d.privateKey }
              default:
                throw new Error('unknown key type ' + u)
            }
          }
          ;(t.exports = h), (h.signature = i.signature)
        },
        2769: (t, e, r) => {
          ;(e.pbkdf2 = r(8557)), (e.pbkdf2Sync = r(2994))
        },
        8557: (t, e, r) => {
          var i,
            n = r(7671),
            o = r(8467).Buffer,
            a = r(2890),
            s = r(8559),
            f = r(2994),
            h = r(5424),
            c = r.g.crypto && r.g.crypto.subtle,
            u = {
              sha: 'SHA-1',
              'sha-1': 'SHA-1',
              sha1: 'SHA-1',
              sha256: 'SHA-256',
              'sha-256': 'SHA-256',
              sha384: 'SHA-384',
              'sha-384': 'SHA-384',
              'sha-512': 'SHA-512',
              sha512: 'SHA-512',
            },
            d = []
          function l(t, e, r, i, n) {
            return c
              .importKey('raw', t, { name: 'PBKDF2' }, !1, ['deriveBits'])
              .then(function (t) {
                return c.deriveBits({ name: 'PBKDF2', salt: e, iterations: r, hash: { name: n } }, t, i << 3)
              })
              .then(function (t) {
                return o.from(t)
              })
          }
          t.exports = function (t, e, p, b, m, y) {
            'function' == typeof m && ((y = m), (m = void 0))
            var g = u[(m = m || 'sha1').toLowerCase()]
            if (!g || 'function' != typeof r.g.Promise)
              return n.nextTick(function () {
                var r
                try {
                  r = f(t, e, p, b, m)
                } catch (t) {
                  return y(t)
                }
                y(null, r)
              })
            if ((a(p, b), (t = h(t, s, 'Password')), (e = h(e, s, 'Salt')), 'function' != typeof y))
              throw new Error('No callback provided to pbkdf2')
            !(function (t, e) {
              t.then(
                function (t) {
                  n.nextTick(function () {
                    e(null, t)
                  })
                },
                function (t) {
                  n.nextTick(function () {
                    e(t)
                  })
                },
              )
            })(
              (function (t) {
                if (r.g.process && !r.g.process.browser) return Promise.resolve(!1)
                if (!c || !c.importKey || !c.deriveBits) return Promise.resolve(!1)
                if (void 0 !== d[t]) return d[t]
                var e = l((i = i || o.alloc(8)), i, 10, 128, t)
                  .then(function () {
                    return !0
                  })
                  .catch(function () {
                    return !1
                  })
                return (d[t] = e), e
              })(g).then(function (r) {
                return r ? l(t, e, p, b, g) : f(t, e, p, b, m)
              }),
              y,
            )
          }
        },
        8559: (t, e, r) => {
          var i,
            n = r(7671)
          ;(i = n.browser
            ? 'utf-8'
            : n.version
            ? parseInt(n.version.split('.')[0].slice(1), 10) >= 6
              ? 'utf-8'
              : 'binary'
            : 'utf-8'),
            (t.exports = i)
        },
        2890: (t) => {
          var e = Math.pow(2, 30) - 1
          t.exports = function (t, r) {
            if ('number' != typeof t) throw new TypeError('Iterations not a number')
            if (t < 0) throw new TypeError('Bad iterations')
            if ('number' != typeof r) throw new TypeError('Key length not a number')
            if (r < 0 || r > e || r != r) throw new TypeError('Bad key length')
          }
        },
        2994: (t, e, r) => {
          var i = r(5298),
            n = r(2997),
            o = r(8927),
            a = r(8467).Buffer,
            s = r(2890),
            f = r(8559),
            h = r(5424),
            c = a.alloc(128),
            u = { md5: 16, sha1: 20, sha224: 28, sha256: 32, sha384: 48, sha512: 64, rmd160: 20, ripemd160: 20 }
          function d(t, e, r) {
            var s = (function (t) {
                return 'rmd160' === t || 'ripemd160' === t
                  ? function (t) {
                      return new n().update(t).digest()
                    }
                  : 'md5' === t
                  ? i
                  : function (e) {
                      return o(t).update(e).digest()
                    }
              })(t),
              f = 'sha512' === t || 'sha384' === t ? 128 : 64
            e.length > f ? (e = s(e)) : e.length < f && (e = a.concat([e, c], f))
            for (var h = a.allocUnsafe(f + u[t]), d = a.allocUnsafe(f + u[t]), l = 0; l < f; l++)
              (h[l] = 54 ^ e[l]), (d[l] = 92 ^ e[l])
            var p = a.allocUnsafe(f + r + 4)
            h.copy(p, 0, 0, f),
              (this.ipad1 = p),
              (this.ipad2 = h),
              (this.opad = d),
              (this.alg = t),
              (this.blocksize = f),
              (this.hash = s),
              (this.size = u[t])
          }
          ;(d.prototype.run = function (t, e) {
            return t.copy(e, this.blocksize), this.hash(e).copy(this.opad, this.blocksize), this.hash(this.opad)
          }),
            (t.exports = function (t, e, r, i, n) {
              s(r, i)
              var o = new d((n = n || 'sha1'), (t = h(t, f, 'Password')), (e = h(e, f, 'Salt')).length),
                c = a.allocUnsafe(i),
                l = a.allocUnsafe(e.length + 4)
              e.copy(l, 0, 0, e.length)
              for (var p = 0, b = u[n], m = Math.ceil(i / b), y = 1; y <= m; y++) {
                l.writeUInt32BE(y, e.length)
                for (var g = o.run(l, o.ipad1), v = g, _ = 1; _ < r; _++) {
                  v = o.run(v, o.ipad2)
                  for (var w = 0; w < b; w++) g[w] ^= v[w]
                }
                g.copy(c, p), (p += b)
              }
              return c
            })
        },
        5424: (t, e, r) => {
          var i = r(8467).Buffer
          t.exports = function (t, e, r) {
            if (i.isBuffer(t)) return t
            if ('string' == typeof t) return i.from(t, e)
            if (ArrayBuffer.isView(t)) return i.from(t.buffer)
            throw new TypeError(r + ' must be a string, a Buffer, a typed array or a DataView')
          }
        },
        7671: (t) => {
          var e,
            r,
            i = (t.exports = {})
          function n() {
            throw new Error('setTimeout has not been defined')
          }
          function o() {
            throw new Error('clearTimeout has not been defined')
          }
          function a(t) {
            if (e === setTimeout) return setTimeout(t, 0)
            if ((e === n || !e) && setTimeout) return (e = setTimeout), setTimeout(t, 0)
            try {
              return e(t, 0)
            } catch (r) {
              try {
                return e.call(null, t, 0)
              } catch (r) {
                return e.call(this, t, 0)
              }
            }
          }
          !(function () {
            try {
              e = 'function' == typeof setTimeout ? setTimeout : n
            } catch (t) {
              e = n
            }
            try {
              r = 'function' == typeof clearTimeout ? clearTimeout : o
            } catch (t) {
              r = o
            }
          })()
          var s,
            f = [],
            h = !1,
            c = -1
          function u() {
            h && s && ((h = !1), s.length ? (f = s.concat(f)) : (c = -1), f.length && d())
          }
          function d() {
            if (!h) {
              var t = a(u)
              h = !0
              for (var e = f.length; e; ) {
                for (s = f, f = []; ++c < e; ) s && s[c].run()
                ;(c = -1), (e = f.length)
              }
              ;(s = null),
                (h = !1),
                (function (t) {
                  if (r === clearTimeout) return clearTimeout(t)
                  if ((r === o || !r) && clearTimeout) return (r = clearTimeout), clearTimeout(t)
                  try {
                    r(t)
                  } catch (e) {
                    try {
                      return r.call(null, t)
                    } catch (e) {
                      return r.call(this, t)
                    }
                  }
                })(t)
            }
          }
          function l(t, e) {
            ;(this.fun = t), (this.array = e)
          }
          function p() {}
          ;(i.nextTick = function (t) {
            var e = new Array(arguments.length - 1)
            if (arguments.length > 1) for (var r = 1; r < arguments.length; r++) e[r - 1] = arguments[r]
            f.push(new l(t, e)), 1 !== f.length || h || a(d)
          }),
            (l.prototype.run = function () {
              this.fun.apply(null, this.array)
            }),
            (i.title = 'browser'),
            (i.browser = !0),
            (i.env = {}),
            (i.argv = []),
            (i.version = ''),
            (i.versions = {}),
            (i.on = p),
            (i.addListener = p),
            (i.once = p),
            (i.off = p),
            (i.removeListener = p),
            (i.removeAllListeners = p),
            (i.emit = p),
            (i.prependListener = p),
            (i.prependOnceListener = p),
            (i.listeners = function (t) {
              return []
            }),
            (i.binding = function (t) {
              throw new Error('process.binding is not supported')
            }),
            (i.cwd = function () {
              return '/'
            }),
            (i.chdir = function (t) {
              throw new Error('process.chdir is not supported')
            }),
            (i.umask = function () {
              return 0
            })
        },
        970: (t, e, r) => {
          ;(e.publicEncrypt = r(568)),
            (e.privateDecrypt = r(284)),
            (e.privateEncrypt = function (t, r) {
              return e.publicEncrypt(t, r, !0)
            }),
            (e.publicDecrypt = function (t, r) {
              return e.privateDecrypt(t, r, !0)
            })
        },
        8005: (t, e, r) => {
          var i = r(3987),
            n = r(8467).Buffer
          function o(t) {
            var e = n.allocUnsafe(4)
            return e.writeUInt32BE(t, 0), e
          }
          t.exports = function (t, e) {
            for (var r, a = n.alloc(0), s = 0; a.length < e; )
              (r = o(s++)), (a = n.concat([a, i('sha1').update(t).update(r).digest()]))
            return a.slice(0, e)
          }
        },
        284: (t, e, r) => {
          var i = r(9558),
            n = r(8005),
            o = r(7454),
            a = r(5612),
            s = r(213),
            f = r(3987),
            h = r(6870),
            c = r(8467).Buffer
          t.exports = function (t, e, r) {
            var u
            u = t.padding ? t.padding : r ? 1 : 4
            var d,
              l = i(t),
              p = l.modulus.byteLength()
            if (e.length > p || new a(e).cmp(l.modulus) >= 0) throw new Error('decryption error')
            d = r ? h(new a(e), l) : s(e, l)
            var b = c.alloc(p - d.length)
            if (((d = c.concat([b, d], p)), 4 === u))
              return (function (t, e) {
                var r = t.modulus.byteLength(),
                  i = f('sha1').update(c.alloc(0)).digest(),
                  a = i.length
                if (0 !== e[0]) throw new Error('decryption error')
                var s = e.slice(1, a + 1),
                  h = e.slice(a + 1),
                  u = o(s, n(h, a)),
                  d = o(h, n(u, r - a - 1))
                if (
                  (function (t, e) {
                    ;(t = c.from(t)), (e = c.from(e))
                    var r = 0,
                      i = t.length
                    t.length !== e.length && (r++, (i = Math.min(t.length, e.length)))
                    for (var n = -1; ++n < i; ) r += t[n] ^ e[n]
                    return r
                  })(i, d.slice(0, a))
                )
                  throw new Error('decryption error')
                for (var l = a; 0 === d[l]; ) l++
                if (1 !== d[l++]) throw new Error('decryption error')
                return d.slice(l)
              })(l, d)
            if (1 === u)
              return (function (t, e, r) {
                for (var i = e.slice(0, 2), n = 2, o = 0; 0 !== e[n++]; )
                  if (n >= e.length) {
                    o++
                    break
                  }
                var a = e.slice(2, n - 1)
                if (
                  ((('0002' !== i.toString('hex') && !r) || ('0001' !== i.toString('hex') && r)) && o++,
                  a.length < 8 && o++,
                  o)
                )
                  throw new Error('decryption error')
                return e.slice(n)
              })(0, d, r)
            if (3 === u) return d
            throw new Error('unknown padding')
          }
        },
        568: (t, e, r) => {
          var i = r(9558),
            n = r(8244),
            o = r(3987),
            a = r(8005),
            s = r(7454),
            f = r(5612),
            h = r(6870),
            c = r(213),
            u = r(8467).Buffer
          t.exports = function (t, e, r) {
            var d
            d = t.padding ? t.padding : r ? 1 : 4
            var l,
              p = i(t)
            if (4 === d)
              l = (function (t, e) {
                var r = t.modulus.byteLength(),
                  i = e.length,
                  h = o('sha1').update(u.alloc(0)).digest(),
                  c = h.length,
                  d = 2 * c
                if (i > r - d - 2) throw new Error('message too long')
                var l = u.alloc(r - i - d - 2),
                  p = r - c - 1,
                  b = n(c),
                  m = s(u.concat([h, l, u.alloc(1, 1), e], p), a(b, p)),
                  y = s(b, a(m, c))
                return new f(u.concat([u.alloc(1), y, m], r))
              })(p, e)
            else if (1 === d)
              l = (function (t, e, r) {
                var i,
                  o = e.length,
                  a = t.modulus.byteLength()
                if (o > a - 11) throw new Error('message too long')
                return (
                  (i = r
                    ? u.alloc(a - o - 3, 255)
                    : (function (t) {
                        for (var e, r = u.allocUnsafe(t), i = 0, o = n(2 * t), a = 0; i < t; )
                          a === o.length && ((o = n(2 * t)), (a = 0)), (e = o[a++]) && (r[i++] = e)
                        return r
                      })(a - o - 3)),
                  new f(u.concat([u.from([0, r ? 1 : 2]), i, u.alloc(1), e], a))
                )
              })(p, e, r)
            else {
              if (3 !== d) throw new Error('unknown padding')
              if ((l = new f(e)).cmp(p.modulus) >= 0) throw new Error('data too long for modulus')
            }
            return r ? c(l, p) : h(l, p)
          }
        },
        6870: (t, e, r) => {
          var i = r(5612),
            n = r(8467).Buffer
          t.exports = function (t, e) {
            return n.from(t.toRed(i.mont(e.modulus)).redPow(new i(e.publicExponent)).fromRed().toArray())
          }
        },
        7454: (t) => {
          t.exports = function (t, e) {
            for (var r = t.length, i = -1; ++i < r; ) t[i] ^= e[i]
            return t
          }
        },
        8244: (t, e, r) => {
          'use strict'
          var i = r(7671),
            n = 65536,
            o = r(8467).Buffer,
            a = r.g.crypto || r.g.msCrypto
          a && a.getRandomValues
            ? (t.exports = function (t, e) {
                if (t > 4294967295) throw new RangeError('requested too many random bytes')
                var r = o.allocUnsafe(t)
                if (t > 0)
                  if (t > n) for (var s = 0; s < t; s += n) a.getRandomValues(r.slice(s, s + n))
                  else a.getRandomValues(r)
                return 'function' == typeof e
                  ? i.nextTick(function () {
                      e(null, r)
                    })
                  : r
              })
            : (t.exports = function () {
                throw new Error(
                  'Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11',
                )
              })
        },
        8156: (t, e, r) => {
          'use strict'
          var i = r(7671)
          function n() {
            throw new Error(
              'secure random number generation not supported by this browser\nuse chrome, FireFox or Internet Explorer 11',
            )
          }
          var o = r(8467),
            a = r(8244),
            s = o.Buffer,
            f = o.kMaxLength,
            h = r.g.crypto || r.g.msCrypto,
            c = Math.pow(2, 32) - 1
          function u(t, e) {
            if ('number' != typeof t || t != t) throw new TypeError('offset must be a number')
            if (t > c || t < 0) throw new TypeError('offset must be a uint32')
            if (t > f || t > e) throw new RangeError('offset out of range')
          }
          function d(t, e, r) {
            if ('number' != typeof t || t != t) throw new TypeError('size must be a number')
            if (t > c || t < 0) throw new TypeError('size must be a uint32')
            if (t + e > r || t > f) throw new RangeError('buffer too small')
          }
          function l(t, e, r, n) {
            if (i.browser) {
              var o = t.buffer,
                s = new Uint8Array(o, e, r)
              return (
                h.getRandomValues(s),
                n
                  ? void i.nextTick(function () {
                      n(null, t)
                    })
                  : t
              )
            }
            if (!n) return a(r).copy(t, e), t
            a(r, function (r, i) {
              if (r) return n(r)
              i.copy(t, e), n(null, t)
            })
          }
          ;(h && h.getRandomValues) || !i.browser
            ? ((e.randomFill = function (t, e, i, n) {
                if (!(s.isBuffer(t) || t instanceof r.g.Uint8Array))
                  throw new TypeError('"buf" argument must be a Buffer or Uint8Array')
                if ('function' == typeof e) (n = e), (e = 0), (i = t.length)
                else if ('function' == typeof i) (n = i), (i = t.length - e)
                else if ('function' != typeof n) throw new TypeError('"cb" argument must be a function')
                return u(e, t.length), d(i, e, t.length), l(t, e, i, n)
              }),
              (e.randomFillSync = function (t, e, i) {
                if ((void 0 === e && (e = 0), !(s.isBuffer(t) || t instanceof r.g.Uint8Array)))
                  throw new TypeError('"buf" argument must be a Buffer or Uint8Array')
                return u(e, t.length), void 0 === i && (i = t.length - e), d(i, e, t.length), l(t, e, i)
              }))
            : ((e.randomFill = n), (e.randomFillSync = n))
        },
        1686: (t) => {
          'use strict'
          var e = {}
          function r(t, r, i) {
            i || (i = Error)
            var n = (function (t) {
              var e, i
              function n(e, i, n) {
                return (
                  t.call(
                    this,
                    (function (t, e, i) {
                      return 'string' == typeof r ? r : r(t, e, i)
                    })(e, i, n),
                  ) || this
                )
              }
              return (
                (i = t),
                ((e = n).prototype = Object.create(i.prototype)),
                (e.prototype.constructor = e),
                (e.__proto__ = i),
                n
              )
            })(i)
            ;(n.prototype.name = i.name), (n.prototype.code = t), (e[t] = n)
          }
          function i(t, e) {
            if (Array.isArray(t)) {
              var r = t.length
              return (
                (t = t.map(function (t) {
                  return String(t)
                })),
                r > 2
                  ? 'one of '.concat(e, ' ').concat(t.slice(0, r - 1).join(', '), ', or ') + t[r - 1]
                  : 2 === r
                  ? 'one of '.concat(e, ' ').concat(t[0], ' or ').concat(t[1])
                  : 'of '.concat(e, ' ').concat(t[0])
              )
            }
            return 'of '.concat(e, ' ').concat(String(t))
          }
          r(
            'ERR_INVALID_OPT_VALUE',
            function (t, e) {
              return 'The value "' + e + '" is invalid for option "' + t + '"'
            },
            TypeError,
          ),
            r(
              'ERR_INVALID_ARG_TYPE',
              function (t, e, r) {
                var n, o, a, s, f
                if (
                  ('string' == typeof e && ((o = 'not '), e.substr(0, o.length) === o)
                    ? ((n = 'must not be'), (e = e.replace(/^not /, '')))
                    : (n = 'must be'),
                  (function (t, e, r) {
                    return (void 0 === r || r > t.length) && (r = t.length), t.substring(r - e.length, r) === e
                  })(t, ' argument'))
                )
                  a = 'The '.concat(t, ' ').concat(n, ' ').concat(i(e, 'type'))
                else {
                  var h =
                    ('number' != typeof f && (f = 0),
                    f + '.'.length > (s = t).length || -1 === s.indexOf('.', f) ? 'argument' : 'property')
                  a = 'The "'.concat(t, '" ').concat(h, ' ').concat(n, ' ').concat(i(e, 'type'))
                }
                return a + '. Received type '.concat(typeof r)
              },
              TypeError,
            ),
            r('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF'),
            r('ERR_METHOD_NOT_IMPLEMENTED', function (t) {
              return 'The ' + t + ' method is not implemented'
            }),
            r('ERR_STREAM_PREMATURE_CLOSE', 'Premature close'),
            r('ERR_STREAM_DESTROYED', function (t) {
              return 'Cannot call ' + t + ' after a stream was destroyed'
            }),
            r('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times'),
            r('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable'),
            r('ERR_STREAM_WRITE_AFTER_END', 'write after end'),
            r('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError),
            r(
              'ERR_UNKNOWN_ENCODING',
              function (t) {
                return 'Unknown encoding: ' + t
              },
              TypeError,
            ),
            r('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event'),
            (t.exports.q = e)
        },
        8600: (t, e, r) => {
          'use strict'
          var i = r(7671),
            n =
              Object.keys ||
              function (t) {
                var e = []
                for (var r in t) e.push(r)
                return e
              }
          t.exports = c
          var o = r(9723),
            a = r(349)
          r(4603)(c, o)
          for (var s = n(a.prototype), f = 0; f < s.length; f++) {
            var h = s[f]
            c.prototype[h] || (c.prototype[h] = a.prototype[h])
          }
          function c(t) {
            if (!(this instanceof c)) return new c(t)
            o.call(this, t),
              a.call(this, t),
              (this.allowHalfOpen = !0),
              t &&
                (!1 === t.readable && (this.readable = !1),
                !1 === t.writable && (this.writable = !1),
                !1 === t.allowHalfOpen && ((this.allowHalfOpen = !1), this.once('end', u)))
          }
          function u() {
            this._writableState.ended || i.nextTick(d, this)
          }
          function d(t) {
            t.end()
          }
          Object.defineProperty(c.prototype, 'writableHighWaterMark', {
            enumerable: !1,
            get: function () {
              return this._writableState.highWaterMark
            },
          }),
            Object.defineProperty(c.prototype, 'writableBuffer', {
              enumerable: !1,
              get: function () {
                return this._writableState && this._writableState.getBuffer()
              },
            }),
            Object.defineProperty(c.prototype, 'writableLength', {
              enumerable: !1,
              get: function () {
                return this._writableState.length
              },
            }),
            Object.defineProperty(c.prototype, 'destroyed', {
              enumerable: !1,
              get: function () {
                return (
                  void 0 !== this._readableState &&
                  void 0 !== this._writableState &&
                  this._readableState.destroyed &&
                  this._writableState.destroyed
                )
              },
              set: function (t) {
                void 0 !== this._readableState &&
                  void 0 !== this._writableState &&
                  ((this._readableState.destroyed = t), (this._writableState.destroyed = t))
              },
            })
        },
        9795: (t, e, r) => {
          'use strict'
          t.exports = n
          var i = r(7756)
          function n(t) {
            if (!(this instanceof n)) return new n(t)
            i.call(this, t)
          }
          r(4603)(n, i),
            (n.prototype._transform = function (t, e, r) {
              r(null, t)
            })
        },
        9723: (t, e, r) => {
          'use strict'
          var i,
            n = r(7671)
          ;(t.exports = A), (A.ReadableState = E), r(4525).EventEmitter
          var o,
            a = function (t, e) {
              return t.listeners(e).length
            },
            s = r(2670),
            f = r(692).Buffer,
            h = r.g.Uint8Array || function () {},
            c = r(1758)
          o = c && c.debuglog ? c.debuglog('stream') : function () {}
          var u,
            d,
            l,
            p = r(1748),
            b = r(528),
            m = r(814).getHighWaterMark,
            y = r(1686).q,
            g = y.ERR_INVALID_ARG_TYPE,
            v = y.ERR_STREAM_PUSH_AFTER_EOF,
            _ = y.ERR_METHOD_NOT_IMPLEMENTED,
            w = y.ERR_STREAM_UNSHIFT_AFTER_END_EVENT
          r(4603)(A, s)
          var M = b.errorOrDestroy,
            S = ['error', 'close', 'destroy', 'pause', 'resume']
          function E(t, e, n) {
            ;(i = i || r(8600)),
              (t = t || {}),
              'boolean' != typeof n && (n = e instanceof i),
              (this.objectMode = !!t.objectMode),
              n && (this.objectMode = this.objectMode || !!t.readableObjectMode),
              (this.highWaterMark = m(this, t, 'readableHighWaterMark', n)),
              (this.buffer = new p()),
              (this.length = 0),
              (this.pipes = null),
              (this.pipesCount = 0),
              (this.flowing = null),
              (this.ended = !1),
              (this.endEmitted = !1),
              (this.reading = !1),
              (this.sync = !0),
              (this.needReadable = !1),
              (this.emittedReadable = !1),
              (this.readableListening = !1),
              (this.resumeScheduled = !1),
              (this.paused = !0),
              (this.emitClose = !1 !== t.emitClose),
              (this.autoDestroy = !!t.autoDestroy),
              (this.destroyed = !1),
              (this.defaultEncoding = t.defaultEncoding || 'utf8'),
              (this.awaitDrain = 0),
              (this.readingMore = !1),
              (this.decoder = null),
              (this.encoding = null),
              t.encoding && (u || (u = r(8154).s), (this.decoder = new u(t.encoding)), (this.encoding = t.encoding))
          }
          function A(t) {
            if (((i = i || r(8600)), !(this instanceof A))) return new A(t)
            var e = this instanceof i
            ;(this._readableState = new E(t, this, e)),
              (this.readable = !0),
              t &&
                ('function' == typeof t.read && (this._read = t.read),
                'function' == typeof t.destroy && (this._destroy = t.destroy)),
              s.call(this)
          }
          function k(t, e, r, i, n) {
            o('readableAddChunk', e)
            var a,
              s = t._readableState
            if (null === e)
              (s.reading = !1),
                (function (t, e) {
                  if ((o('onEofChunk'), !e.ended)) {
                    if (e.decoder) {
                      var r = e.decoder.end()
                      r && r.length && (e.buffer.push(r), (e.length += e.objectMode ? 1 : r.length))
                    }
                    ;(e.ended = !0),
                      e.sync ? x(t) : ((e.needReadable = !1), e.emittedReadable || ((e.emittedReadable = !0), T(t)))
                  }
                })(t, s)
            else if (
              (n ||
                (a = (function (t, e) {
                  var r, i
                  return (
                    (i = e),
                    f.isBuffer(i) ||
                      i instanceof h ||
                      'string' == typeof e ||
                      void 0 === e ||
                      t.objectMode ||
                      (r = new g('chunk', ['string', 'Buffer', 'Uint8Array'], e)),
                    r
                  )
                })(s, e)),
              a)
            )
              M(t, a)
            else if (s.objectMode || (e && e.length > 0))
              if (
                ('string' == typeof e ||
                  s.objectMode ||
                  Object.getPrototypeOf(e) === f.prototype ||
                  (e = (function (t) {
                    return f.from(t)
                  })(e)),
                i)
              )
                s.endEmitted ? M(t, new w()) : I(t, s, e, !0)
              else if (s.ended) M(t, new v())
              else {
                if (s.destroyed) return !1
                ;(s.reading = !1),
                  s.decoder && !r
                    ? ((e = s.decoder.write(e)), s.objectMode || 0 !== e.length ? I(t, s, e, !1) : L(t, s))
                    : I(t, s, e, !1)
              }
            else i || ((s.reading = !1), L(t, s))
            return !s.ended && (s.length < s.highWaterMark || 0 === s.length)
          }
          function I(t, e, r, i) {
            e.flowing && 0 === e.length && !e.sync
              ? ((e.awaitDrain = 0), t.emit('data', r))
              : ((e.length += e.objectMode ? 1 : r.length),
                i ? e.buffer.unshift(r) : e.buffer.push(r),
                e.needReadable && x(t)),
              L(t, e)
          }
          Object.defineProperty(A.prototype, 'destroyed', {
            enumerable: !1,
            get: function () {
              return void 0 !== this._readableState && this._readableState.destroyed
            },
            set: function (t) {
              this._readableState && (this._readableState.destroyed = t)
            },
          }),
            (A.prototype.destroy = b.destroy),
            (A.prototype._undestroy = b.undestroy),
            (A.prototype._destroy = function (t, e) {
              e(t)
            }),
            (A.prototype.push = function (t, e) {
              var r,
                i = this._readableState
              return (
                i.objectMode
                  ? (r = !0)
                  : 'string' == typeof t &&
                    ((e = e || i.defaultEncoding) !== i.encoding && ((t = f.from(t, e)), (e = '')), (r = !0)),
                k(this, t, e, !1, r)
              )
            }),
            (A.prototype.unshift = function (t) {
              return k(this, t, null, !0, !1)
            }),
            (A.prototype.isPaused = function () {
              return !1 === this._readableState.flowing
            }),
            (A.prototype.setEncoding = function (t) {
              u || (u = r(8154).s)
              var e = new u(t)
              ;(this._readableState.decoder = e), (this._readableState.encoding = this._readableState.decoder.encoding)
              for (var i = this._readableState.buffer.head, n = ''; null !== i; ) (n += e.write(i.data)), (i = i.next)
              return (
                this._readableState.buffer.clear(),
                '' !== n && this._readableState.buffer.push(n),
                (this._readableState.length = n.length),
                this
              )
            })
          var B = 1073741824
          function R(t, e) {
            return t <= 0 || (0 === e.length && e.ended)
              ? 0
              : e.objectMode
              ? 1
              : t != t
              ? e.flowing && e.length
                ? e.buffer.head.data.length
                : e.length
              : (t > e.highWaterMark &&
                  (e.highWaterMark = (function (t) {
                    return (
                      t >= B
                        ? (t = B)
                        : (t--, (t |= t >>> 1), (t |= t >>> 2), (t |= t >>> 4), (t |= t >>> 8), (t |= t >>> 16), t++),
                      t
                    )
                  })(t)),
                t <= e.length ? t : e.ended ? e.length : ((e.needReadable = !0), 0))
          }
          function x(t) {
            var e = t._readableState
            o('emitReadable', e.needReadable, e.emittedReadable),
              (e.needReadable = !1),
              e.emittedReadable || (o('emitReadable', e.flowing), (e.emittedReadable = !0), n.nextTick(T, t))
          }
          function T(t) {
            var e = t._readableState
            o('emitReadable_', e.destroyed, e.length, e.ended),
              e.destroyed || (!e.length && !e.ended) || (t.emit('readable'), (e.emittedReadable = !1)),
              (e.needReadable = !e.flowing && !e.ended && e.length <= e.highWaterMark),
              U(t)
          }
          function L(t, e) {
            e.readingMore || ((e.readingMore = !0), n.nextTick(C, t, e))
          }
          function C(t, e) {
            for (; !e.reading && !e.ended && (e.length < e.highWaterMark || (e.flowing && 0 === e.length)); ) {
              var r = e.length
              if ((o('maybeReadMore read 0'), t.read(0), r === e.length)) break
            }
            e.readingMore = !1
          }
          function P(t) {
            var e = t._readableState
            ;(e.readableListening = t.listenerCount('readable') > 0),
              e.resumeScheduled && !e.paused ? (e.flowing = !0) : t.listenerCount('data') > 0 && t.resume()
          }
          function O(t) {
            o('readable nexttick read 0'), t.read(0)
          }
          function N(t, e) {
            o('resume', e.reading),
              e.reading || t.read(0),
              (e.resumeScheduled = !1),
              t.emit('resume'),
              U(t),
              e.flowing && !e.reading && t.read(0)
          }
          function U(t) {
            var e = t._readableState
            for (o('flow', e.flowing); e.flowing && null !== t.read(); );
          }
          function D(t, e) {
            return 0 === e.length
              ? null
              : (e.objectMode
                  ? (r = e.buffer.shift())
                  : !t || t >= e.length
                  ? ((r = e.decoder
                      ? e.buffer.join('')
                      : 1 === e.buffer.length
                      ? e.buffer.first()
                      : e.buffer.concat(e.length)),
                    e.buffer.clear())
                  : (r = e.buffer.consume(t, e.decoder)),
                r)
            var r
          }
          function j(t) {
            var e = t._readableState
            o('endReadable', e.endEmitted), e.endEmitted || ((e.ended = !0), n.nextTick(q, e, t))
          }
          function q(t, e) {
            if (
              (o('endReadableNT', t.endEmitted, t.length),
              !t.endEmitted && 0 === t.length && ((t.endEmitted = !0), (e.readable = !1), e.emit('end'), t.autoDestroy))
            ) {
              var r = e._writableState
              ;(!r || (r.autoDestroy && r.finished)) && e.destroy()
            }
          }
          function z(t, e) {
            for (var r = 0, i = t.length; r < i; r++) if (t[r] === e) return r
            return -1
          }
          ;(A.prototype.read = function (t) {
            o('read', t), (t = parseInt(t, 10))
            var e = this._readableState,
              r = t
            if (
              (0 !== t && (e.emittedReadable = !1),
              0 === t &&
                e.needReadable &&
                ((0 !== e.highWaterMark ? e.length >= e.highWaterMark : e.length > 0) || e.ended))
            )
              return o('read: emitReadable', e.length, e.ended), 0 === e.length && e.ended ? j(this) : x(this), null
            if (0 === (t = R(t, e)) && e.ended) return 0 === e.length && j(this), null
            var i,
              n = e.needReadable
            return (
              o('need readable', n),
              (0 === e.length || e.length - t < e.highWaterMark) && o('length less than watermark', (n = !0)),
              e.ended || e.reading
                ? o('reading or ended', (n = !1))
                : n &&
                  (o('do read'),
                  (e.reading = !0),
                  (e.sync = !0),
                  0 === e.length && (e.needReadable = !0),
                  this._read(e.highWaterMark),
                  (e.sync = !1),
                  e.reading || (t = R(r, e))),
              null === (i = t > 0 ? D(t, e) : null)
                ? ((e.needReadable = e.length <= e.highWaterMark), (t = 0))
                : ((e.length -= t), (e.awaitDrain = 0)),
              0 === e.length && (e.ended || (e.needReadable = !0), r !== t && e.ended && j(this)),
              null !== i && this.emit('data', i),
              i
            )
          }),
            (A.prototype._read = function (t) {
              M(this, new _('_read()'))
            }),
            (A.prototype.pipe = function (t, e) {
              var r = this,
                i = this._readableState
              switch (i.pipesCount) {
                case 0:
                  i.pipes = t
                  break
                case 1:
                  i.pipes = [i.pipes, t]
                  break
                default:
                  i.pipes.push(t)
              }
              ;(i.pipesCount += 1), o('pipe count=%d opts=%j', i.pipesCount, e)
              var s = (e && !1 === e.end) || t === n.stdout || t === n.stderr ? b : f
              function f() {
                o('onend'), t.end()
              }
              i.endEmitted ? n.nextTick(s) : r.once('end', s),
                t.on('unpipe', function e(n, a) {
                  o('onunpipe'),
                    n === r &&
                      a &&
                      !1 === a.hasUnpiped &&
                      ((a.hasUnpiped = !0),
                      o('cleanup'),
                      t.removeListener('close', l),
                      t.removeListener('finish', p),
                      t.removeListener('drain', h),
                      t.removeListener('error', d),
                      t.removeListener('unpipe', e),
                      r.removeListener('end', f),
                      r.removeListener('end', b),
                      r.removeListener('data', u),
                      (c = !0),
                      !i.awaitDrain || (t._writableState && !t._writableState.needDrain) || h())
                })
              var h = (function (t) {
                return function () {
                  var e = t._readableState
                  o('pipeOnDrain', e.awaitDrain),
                    e.awaitDrain && e.awaitDrain--,
                    0 === e.awaitDrain && a(t, 'data') && ((e.flowing = !0), U(t))
                }
              })(r)
              t.on('drain', h)
              var c = !1
              function u(e) {
                o('ondata')
                var n = t.write(e)
                o('dest.write', n),
                  !1 === n &&
                    (((1 === i.pipesCount && i.pipes === t) || (i.pipesCount > 1 && -1 !== z(i.pipes, t))) &&
                      !c &&
                      (o('false write response, pause', i.awaitDrain), i.awaitDrain++),
                    r.pause())
              }
              function d(e) {
                o('onerror', e), b(), t.removeListener('error', d), 0 === a(t, 'error') && M(t, e)
              }
              function l() {
                t.removeListener('finish', p), b()
              }
              function p() {
                o('onfinish'), t.removeListener('close', l), b()
              }
              function b() {
                o('unpipe'), r.unpipe(t)
              }
              return (
                r.on('data', u),
                (function (t, e, r) {
                  if ('function' == typeof t.prependListener) return t.prependListener(e, r)
                  t._events && t._events.error
                    ? Array.isArray(t._events.error)
                      ? t._events.error.unshift(r)
                      : (t._events.error = [r, t._events.error])
                    : t.on(e, r)
                })(t, 'error', d),
                t.once('close', l),
                t.once('finish', p),
                t.emit('pipe', r),
                i.flowing || (o('pipe resume'), r.resume()),
                t
              )
            }),
            (A.prototype.unpipe = function (t) {
              var e = this._readableState,
                r = { hasUnpiped: !1 }
              if (0 === e.pipesCount) return this
              if (1 === e.pipesCount)
                return (
                  (t && t !== e.pipes) ||
                    (t || (t = e.pipes),
                    (e.pipes = null),
                    (e.pipesCount = 0),
                    (e.flowing = !1),
                    t && t.emit('unpipe', this, r)),
                  this
                )
              if (!t) {
                var i = e.pipes,
                  n = e.pipesCount
                ;(e.pipes = null), (e.pipesCount = 0), (e.flowing = !1)
                for (var o = 0; o < n; o++) i[o].emit('unpipe', this, { hasUnpiped: !1 })
                return this
              }
              var a = z(e.pipes, t)
              return (
                -1 === a ||
                  (e.pipes.splice(a, 1),
                  (e.pipesCount -= 1),
                  1 === e.pipesCount && (e.pipes = e.pipes[0]),
                  t.emit('unpipe', this, r)),
                this
              )
            }),
            (A.prototype.on = function (t, e) {
              var r = s.prototype.on.call(this, t, e),
                i = this._readableState
              return (
                'data' === t
                  ? ((i.readableListening = this.listenerCount('readable') > 0), !1 !== i.flowing && this.resume())
                  : 'readable' === t &&
                    (i.endEmitted ||
                      i.readableListening ||
                      ((i.readableListening = i.needReadable = !0),
                      (i.flowing = !1),
                      (i.emittedReadable = !1),
                      o('on readable', i.length, i.reading),
                      i.length ? x(this) : i.reading || n.nextTick(O, this))),
                r
              )
            }),
            (A.prototype.addListener = A.prototype.on),
            (A.prototype.removeListener = function (t, e) {
              var r = s.prototype.removeListener.call(this, t, e)
              return 'readable' === t && n.nextTick(P, this), r
            }),
            (A.prototype.removeAllListeners = function (t) {
              var e = s.prototype.removeAllListeners.apply(this, arguments)
              return ('readable' !== t && void 0 !== t) || n.nextTick(P, this), e
            }),
            (A.prototype.resume = function () {
              var t = this._readableState
              return (
                t.flowing ||
                  (o('resume'),
                  (t.flowing = !t.readableListening),
                  (function (t, e) {
                    e.resumeScheduled || ((e.resumeScheduled = !0), n.nextTick(N, t, e))
                  })(this, t)),
                (t.paused = !1),
                this
              )
            }),
            (A.prototype.pause = function () {
              return (
                o('call pause flowing=%j', this._readableState.flowing),
                !1 !== this._readableState.flowing &&
                  (o('pause'), (this._readableState.flowing = !1), this.emit('pause')),
                (this._readableState.paused = !0),
                this
              )
            }),
            (A.prototype.wrap = function (t) {
              var e = this,
                r = this._readableState,
                i = !1
              for (var n in (t.on('end', function () {
                if ((o('wrapped end'), r.decoder && !r.ended)) {
                  var t = r.decoder.end()
                  t && t.length && e.push(t)
                }
                e.push(null)
              }),
              t.on('data', function (n) {
                o('wrapped data'),
                  r.decoder && (n = r.decoder.write(n)),
                  (r.objectMode && null == n) ||
                    ((r.objectMode || (n && n.length)) && (e.push(n) || ((i = !0), t.pause())))
              }),
              t))
                void 0 === this[n] &&
                  'function' == typeof t[n] &&
                  (this[n] = (function (e) {
                    return function () {
                      return t[e].apply(t, arguments)
                    }
                  })(n))
              for (var a = 0; a < S.length; a++) t.on(S[a], this.emit.bind(this, S[a]))
              return (
                (this._read = function (e) {
                  o('wrapped _read', e), i && ((i = !1), t.resume())
                }),
                this
              )
            }),
            'function' == typeof Symbol &&
              (A.prototype[Symbol.asyncIterator] = function () {
                return void 0 === d && (d = r(3951)), d(this)
              }),
            Object.defineProperty(A.prototype, 'readableHighWaterMark', {
              enumerable: !1,
              get: function () {
                return this._readableState.highWaterMark
              },
            }),
            Object.defineProperty(A.prototype, 'readableBuffer', {
              enumerable: !1,
              get: function () {
                return this._readableState && this._readableState.buffer
              },
            }),
            Object.defineProperty(A.prototype, 'readableFlowing', {
              enumerable: !1,
              get: function () {
                return this._readableState.flowing
              },
              set: function (t) {
                this._readableState && (this._readableState.flowing = t)
              },
            }),
            (A._fromList = D),
            Object.defineProperty(A.prototype, 'readableLength', {
              enumerable: !1,
              get: function () {
                return this._readableState.length
              },
            }),
            'function' == typeof Symbol &&
              (A.from = function (t, e) {
                return void 0 === l && (l = r(3730)), l(A, t, e)
              })
        },
        7756: (t, e, r) => {
          'use strict'
          t.exports = c
          var i = r(1686).q,
            n = i.ERR_METHOD_NOT_IMPLEMENTED,
            o = i.ERR_MULTIPLE_CALLBACK,
            a = i.ERR_TRANSFORM_ALREADY_TRANSFORMING,
            s = i.ERR_TRANSFORM_WITH_LENGTH_0,
            f = r(8600)
          function h(t, e) {
            var r = this._transformState
            r.transforming = !1
            var i = r.writecb
            if (null === i) return this.emit('error', new o())
            ;(r.writechunk = null), (r.writecb = null), null != e && this.push(e), i(t)
            var n = this._readableState
            ;(n.reading = !1), (n.needReadable || n.length < n.highWaterMark) && this._read(n.highWaterMark)
          }
          function c(t) {
            if (!(this instanceof c)) return new c(t)
            f.call(this, t),
              (this._transformState = {
                afterTransform: h.bind(this),
                needTransform: !1,
                transforming: !1,
                writecb: null,
                writechunk: null,
                writeencoding: null,
              }),
              (this._readableState.needReadable = !0),
              (this._readableState.sync = !1),
              t &&
                ('function' == typeof t.transform && (this._transform = t.transform),
                'function' == typeof t.flush && (this._flush = t.flush)),
              this.on('prefinish', u)
          }
          function u() {
            var t = this
            'function' != typeof this._flush || this._readableState.destroyed
              ? d(this, null, null)
              : this._flush(function (e, r) {
                  d(t, e, r)
                })
          }
          function d(t, e, r) {
            if (e) return t.emit('error', e)
            if ((null != r && t.push(r), t._writableState.length)) throw new s()
            if (t._transformState.transforming) throw new a()
            return t.push(null)
          }
          r(4603)(c, f),
            (c.prototype.push = function (t, e) {
              return (this._transformState.needTransform = !1), f.prototype.push.call(this, t, e)
            }),
            (c.prototype._transform = function (t, e, r) {
              r(new n('_transform()'))
            }),
            (c.prototype._write = function (t, e, r) {
              var i = this._transformState
              if (((i.writecb = r), (i.writechunk = t), (i.writeencoding = e), !i.transforming)) {
                var n = this._readableState
                ;(i.needTransform || n.needReadable || n.length < n.highWaterMark) && this._read(n.highWaterMark)
              }
            }),
            (c.prototype._read = function (t) {
              var e = this._transformState
              null === e.writechunk || e.transforming
                ? (e.needTransform = !0)
                : ((e.transforming = !0), this._transform(e.writechunk, e.writeencoding, e.afterTransform))
            }),
            (c.prototype._destroy = function (t, e) {
              f.prototype._destroy.call(this, t, function (t) {
                e(t)
              })
            })
        },
        349: (t, e, r) => {
          'use strict'
          var i,
            n = r(7671)
          function o(t) {
            var e = this
            ;(this.next = null),
              (this.entry = null),
              (this.finish = function () {
                !(function (t, e, r) {
                  var i = t.entry
                  for (t.entry = null; i; ) {
                    var n = i.callback
                    e.pendingcb--, n(undefined), (i = i.next)
                  }
                  e.corkedRequestsFree.next = t
                })(e, t)
              })
          }
          ;(t.exports = A), (A.WritableState = E)
          var a,
            s = { deprecate: r(5091) },
            f = r(2670),
            h = r(692).Buffer,
            c = r.g.Uint8Array || function () {},
            u = r(528),
            d = r(814).getHighWaterMark,
            l = r(1686).q,
            p = l.ERR_INVALID_ARG_TYPE,
            b = l.ERR_METHOD_NOT_IMPLEMENTED,
            m = l.ERR_MULTIPLE_CALLBACK,
            y = l.ERR_STREAM_CANNOT_PIPE,
            g = l.ERR_STREAM_DESTROYED,
            v = l.ERR_STREAM_NULL_VALUES,
            _ = l.ERR_STREAM_WRITE_AFTER_END,
            w = l.ERR_UNKNOWN_ENCODING,
            M = u.errorOrDestroy
          function S() {}
          function E(t, e, a) {
            ;(i = i || r(8600)),
              (t = t || {}),
              'boolean' != typeof a && (a = e instanceof i),
              (this.objectMode = !!t.objectMode),
              a && (this.objectMode = this.objectMode || !!t.writableObjectMode),
              (this.highWaterMark = d(this, t, 'writableHighWaterMark', a)),
              (this.finalCalled = !1),
              (this.needDrain = !1),
              (this.ending = !1),
              (this.ended = !1),
              (this.finished = !1),
              (this.destroyed = !1)
            var s = !1 === t.decodeStrings
            ;(this.decodeStrings = !s),
              (this.defaultEncoding = t.defaultEncoding || 'utf8'),
              (this.length = 0),
              (this.writing = !1),
              (this.corked = 0),
              (this.sync = !0),
              (this.bufferProcessing = !1),
              (this.onwrite = function (t) {
                !(function (t, e) {
                  var r = t._writableState,
                    i = r.sync,
                    o = r.writecb
                  if ('function' != typeof o) throw new m()
                  if (
                    ((function (t) {
                      ;(t.writing = !1), (t.writecb = null), (t.length -= t.writelen), (t.writelen = 0)
                    })(r),
                    e)
                  )
                    !(function (t, e, r, i, o) {
                      --e.pendingcb,
                        r
                          ? (n.nextTick(o, i), n.nextTick(T, t, e), (t._writableState.errorEmitted = !0), M(t, i))
                          : (o(i), (t._writableState.errorEmitted = !0), M(t, i), T(t, e))
                    })(t, r, i, e, o)
                  else {
                    var a = R(r) || t.destroyed
                    a || r.corked || r.bufferProcessing || !r.bufferedRequest || B(t, r),
                      i ? n.nextTick(I, t, r, a, o) : I(t, r, a, o)
                  }
                })(e, t)
              }),
              (this.writecb = null),
              (this.writelen = 0),
              (this.bufferedRequest = null),
              (this.lastBufferedRequest = null),
              (this.pendingcb = 0),
              (this.prefinished = !1),
              (this.errorEmitted = !1),
              (this.emitClose = !1 !== t.emitClose),
              (this.autoDestroy = !!t.autoDestroy),
              (this.bufferedRequestCount = 0),
              (this.corkedRequestsFree = new o(this))
          }
          function A(t) {
            var e = this instanceof (i = i || r(8600))
            if (!e && !a.call(A, this)) return new A(t)
            ;(this._writableState = new E(t, this, e)),
              (this.writable = !0),
              t &&
                ('function' == typeof t.write && (this._write = t.write),
                'function' == typeof t.writev && (this._writev = t.writev),
                'function' == typeof t.destroy && (this._destroy = t.destroy),
                'function' == typeof t.final && (this._final = t.final)),
              f.call(this)
          }
          function k(t, e, r, i, n, o, a) {
            ;(e.writelen = i),
              (e.writecb = a),
              (e.writing = !0),
              (e.sync = !0),
              e.destroyed ? e.onwrite(new g('write')) : r ? t._writev(n, e.onwrite) : t._write(n, o, e.onwrite),
              (e.sync = !1)
          }
          function I(t, e, r, i) {
            r ||
              (function (t, e) {
                0 === e.length && e.needDrain && ((e.needDrain = !1), t.emit('drain'))
              })(t, e),
              e.pendingcb--,
              i(),
              T(t, e)
          }
          function B(t, e) {
            e.bufferProcessing = !0
            var r = e.bufferedRequest
            if (t._writev && r && r.next) {
              var i = e.bufferedRequestCount,
                n = new Array(i),
                a = e.corkedRequestsFree
              a.entry = r
              for (var s = 0, f = !0; r; ) (n[s] = r), r.isBuf || (f = !1), (r = r.next), (s += 1)
              ;(n.allBuffers = f),
                k(t, e, !0, e.length, n, '', a.finish),
                e.pendingcb++,
                (e.lastBufferedRequest = null),
                a.next ? ((e.corkedRequestsFree = a.next), (a.next = null)) : (e.corkedRequestsFree = new o(e)),
                (e.bufferedRequestCount = 0)
            } else {
              for (; r; ) {
                var h = r.chunk,
                  c = r.encoding,
                  u = r.callback
                if (
                  (k(t, e, !1, e.objectMode ? 1 : h.length, h, c, u), (r = r.next), e.bufferedRequestCount--, e.writing)
                )
                  break
              }
              null === r && (e.lastBufferedRequest = null)
            }
            ;(e.bufferedRequest = r), (e.bufferProcessing = !1)
          }
          function R(t) {
            return t.ending && 0 === t.length && null === t.bufferedRequest && !t.finished && !t.writing
          }
          function x(t, e) {
            t._final(function (r) {
              e.pendingcb--, r && M(t, r), (e.prefinished = !0), t.emit('prefinish'), T(t, e)
            })
          }
          function T(t, e) {
            var r = R(e)
            if (
              r &&
              ((function (t, e) {
                e.prefinished ||
                  e.finalCalled ||
                  ('function' != typeof t._final || e.destroyed
                    ? ((e.prefinished = !0), t.emit('prefinish'))
                    : (e.pendingcb++, (e.finalCalled = !0), n.nextTick(x, t, e)))
              })(t, e),
              0 === e.pendingcb && ((e.finished = !0), t.emit('finish'), e.autoDestroy))
            ) {
              var i = t._readableState
              ;(!i || (i.autoDestroy && i.endEmitted)) && t.destroy()
            }
            return r
          }
          r(4603)(A, f),
            (E.prototype.getBuffer = function () {
              for (var t = this.bufferedRequest, e = []; t; ) e.push(t), (t = t.next)
              return e
            }),
            (function () {
              try {
                Object.defineProperty(E.prototype, 'buffer', {
                  get: s.deprecate(
                    function () {
                      return this.getBuffer()
                    },
                    '_writableState.buffer is deprecated. Use _writableState.getBuffer instead.',
                    'DEP0003',
                  ),
                })
              } catch (t) {}
            })(),
            'function' == typeof Symbol &&
            Symbol.hasInstance &&
            'function' == typeof Function.prototype[Symbol.hasInstance]
              ? ((a = Function.prototype[Symbol.hasInstance]),
                Object.defineProperty(A, Symbol.hasInstance, {
                  value: function (t) {
                    return !!a.call(this, t) || (this === A && t && t._writableState instanceof E)
                  },
                }))
              : (a = function (t) {
                  return t instanceof this
                }),
            (A.prototype.pipe = function () {
              M(this, new y())
            }),
            (A.prototype.write = function (t, e, r) {
              var i,
                o = this._writableState,
                a = !1,
                s = !o.objectMode && ((i = t), h.isBuffer(i) || i instanceof c)
              return (
                s &&
                  !h.isBuffer(t) &&
                  (t = (function (t) {
                    return h.from(t)
                  })(t)),
                'function' == typeof e && ((r = e), (e = null)),
                s ? (e = 'buffer') : e || (e = o.defaultEncoding),
                'function' != typeof r && (r = S),
                o.ending
                  ? (function (t, e) {
                      var r = new _()
                      M(t, r), n.nextTick(e, r)
                    })(this, r)
                  : (s ||
                      (function (t, e, r, i) {
                        var o
                        return (
                          null === r
                            ? (o = new v())
                            : 'string' == typeof r || e.objectMode || (o = new p('chunk', ['string', 'Buffer'], r)),
                          !o || (M(t, o), n.nextTick(i, o), !1)
                        )
                      })(this, o, t, r)) &&
                    (o.pendingcb++,
                    (a = (function (t, e, r, i, n, o) {
                      if (!r) {
                        var a = (function (t, e, r) {
                          return t.objectMode || !1 === t.decodeStrings || 'string' != typeof e || (e = h.from(e, r)), e
                        })(e, i, n)
                        i !== a && ((r = !0), (n = 'buffer'), (i = a))
                      }
                      var s = e.objectMode ? 1 : i.length
                      e.length += s
                      var f = e.length < e.highWaterMark
                      if ((f || (e.needDrain = !0), e.writing || e.corked)) {
                        var c = e.lastBufferedRequest
                        ;(e.lastBufferedRequest = { chunk: i, encoding: n, isBuf: r, callback: o, next: null }),
                          c ? (c.next = e.lastBufferedRequest) : (e.bufferedRequest = e.lastBufferedRequest),
                          (e.bufferedRequestCount += 1)
                      } else k(t, e, !1, s, i, n, o)
                      return f
                    })(this, o, s, t, e, r))),
                a
              )
            }),
            (A.prototype.cork = function () {
              this._writableState.corked++
            }),
            (A.prototype.uncork = function () {
              var t = this._writableState
              t.corked && (t.corked--, t.writing || t.corked || t.bufferProcessing || !t.bufferedRequest || B(this, t))
            }),
            (A.prototype.setDefaultEncoding = function (t) {
              if (
                ('string' == typeof t && (t = t.toLowerCase()),
                !(
                  [
                    'hex',
                    'utf8',
                    'utf-8',
                    'ascii',
                    'binary',
                    'base64',
                    'ucs2',
                    'ucs-2',
                    'utf16le',
                    'utf-16le',
                    'raw',
                  ].indexOf((t + '').toLowerCase()) > -1
                ))
              )
                throw new w(t)
              return (this._writableState.defaultEncoding = t), this
            }),
            Object.defineProperty(A.prototype, 'writableBuffer', {
              enumerable: !1,
              get: function () {
                return this._writableState && this._writableState.getBuffer()
              },
            }),
            Object.defineProperty(A.prototype, 'writableHighWaterMark', {
              enumerable: !1,
              get: function () {
                return this._writableState.highWaterMark
              },
            }),
            (A.prototype._write = function (t, e, r) {
              r(new b('_write()'))
            }),
            (A.prototype._writev = null),
            (A.prototype.end = function (t, e, r) {
              var i = this._writableState
              return (
                'function' == typeof t
                  ? ((r = t), (t = null), (e = null))
                  : 'function' == typeof e && ((r = e), (e = null)),
                null != t && this.write(t, e),
                i.corked && ((i.corked = 1), this.uncork()),
                i.ending ||
                  (function (t, e, r) {
                    ;(e.ending = !0),
                      T(t, e),
                      r && (e.finished ? n.nextTick(r) : t.once('finish', r)),
                      (e.ended = !0),
                      (t.writable = !1)
                  })(this, i, r),
                this
              )
            }),
            Object.defineProperty(A.prototype, 'writableLength', {
              enumerable: !1,
              get: function () {
                return this._writableState.length
              },
            }),
            Object.defineProperty(A.prototype, 'destroyed', {
              enumerable: !1,
              get: function () {
                return void 0 !== this._writableState && this._writableState.destroyed
              },
              set: function (t) {
                this._writableState && (this._writableState.destroyed = t)
              },
            }),
            (A.prototype.destroy = u.destroy),
            (A.prototype._undestroy = u.undestroy),
            (A.prototype._destroy = function (t, e) {
              e(t)
            })
        },
        3951: (t, e, r) => {
          'use strict'
          var i,
            n = r(7671)
          function o(t, e, r) {
            return (
              e in t
                ? Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 })
                : (t[e] = r),
              t
            )
          }
          var a = r(6583),
            s = Symbol('lastResolve'),
            f = Symbol('lastReject'),
            h = Symbol('error'),
            c = Symbol('ended'),
            u = Symbol('lastPromise'),
            d = Symbol('handlePromise'),
            l = Symbol('stream')
          function p(t, e) {
            return { value: t, done: e }
          }
          function b(t) {
            var e = t[s]
            if (null !== e) {
              var r = t[l].read()
              null !== r && ((t[u] = null), (t[s] = null), (t[f] = null), e(p(r, !1)))
            }
          }
          function m(t) {
            n.nextTick(b, t)
          }
          var y = Object.getPrototypeOf(function () {}),
            g = Object.setPrototypeOf(
              (o(
                (i = {
                  get stream() {
                    return this[l]
                  },
                  next: function () {
                    var t = this,
                      e = this[h]
                    if (null !== e) return Promise.reject(e)
                    if (this[c]) return Promise.resolve(p(void 0, !0))
                    if (this[l].destroyed)
                      return new Promise(function (e, r) {
                        n.nextTick(function () {
                          t[h] ? r(t[h]) : e(p(void 0, !0))
                        })
                      })
                    var r,
                      i = this[u]
                    if (i)
                      r = new Promise(
                        (function (t, e) {
                          return function (r, i) {
                            t.then(function () {
                              e[c] ? r(p(void 0, !0)) : e[d](r, i)
                            }, i)
                          }
                        })(i, this),
                      )
                    else {
                      var o = this[l].read()
                      if (null !== o) return Promise.resolve(p(o, !1))
                      r = new Promise(this[d])
                    }
                    return (this[u] = r), r
                  },
                }),
                Symbol.asyncIterator,
                function () {
                  return this
                },
              ),
              o(i, 'return', function () {
                var t = this
                return new Promise(function (e, r) {
                  t[l].destroy(null, function (t) {
                    t ? r(t) : e(p(void 0, !0))
                  })
                })
              }),
              i),
              y,
            )
          t.exports = function (t) {
            var e,
              r = Object.create(
                g,
                (o((e = {}), l, { value: t, writable: !0 }),
                o(e, s, { value: null, writable: !0 }),
                o(e, f, { value: null, writable: !0 }),
                o(e, h, { value: null, writable: !0 }),
                o(e, c, { value: t._readableState.endEmitted, writable: !0 }),
                o(e, d, {
                  value: function (t, e) {
                    var i = r[l].read()
                    i ? ((r[u] = null), (r[s] = null), (r[f] = null), t(p(i, !1))) : ((r[s] = t), (r[f] = e))
                  },
                  writable: !0,
                }),
                e),
              )
            return (
              (r[u] = null),
              a(t, function (t) {
                if (t && 'ERR_STREAM_PREMATURE_CLOSE' !== t.code) {
                  var e = r[f]
                  return null !== e && ((r[u] = null), (r[s] = null), (r[f] = null), e(t)), void (r[h] = t)
                }
                var i = r[s]
                null !== i && ((r[u] = null), (r[s] = null), (r[f] = null), i(p(void 0, !0))), (r[c] = !0)
              }),
              t.on('readable', m.bind(null, r)),
              r
            )
          }
        },
        1748: (t, e, r) => {
          'use strict'
          function i(t, e) {
            var r = Object.keys(t)
            if (Object.getOwnPropertySymbols) {
              var i = Object.getOwnPropertySymbols(t)
              e &&
                (i = i.filter(function (e) {
                  return Object.getOwnPropertyDescriptor(t, e).enumerable
                })),
                r.push.apply(r, i)
            }
            return r
          }
          function n(t, e, r) {
            return (
              e in t
                ? Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 })
                : (t[e] = r),
              t
            )
          }
          function o(t, e) {
            for (var r = 0; r < e.length; r++) {
              var i = e[r]
              ;(i.enumerable = i.enumerable || !1),
                (i.configurable = !0),
                'value' in i && (i.writable = !0),
                Object.defineProperty(t, i.key, i)
            }
          }
          var a = r(692).Buffer,
            s = r(1758).inspect,
            f = (s && s.custom) || 'inspect'
          t.exports = (function () {
            function t() {
              !(function (t, e) {
                if (!(t instanceof e)) throw new TypeError('Cannot call a class as a function')
              })(this, t),
                (this.head = null),
                (this.tail = null),
                (this.length = 0)
            }
            var e, r
            return (
              (e = t),
              (r = [
                {
                  key: 'push',
                  value: function (t) {
                    var e = { data: t, next: null }
                    this.length > 0 ? (this.tail.next = e) : (this.head = e), (this.tail = e), ++this.length
                  },
                },
                {
                  key: 'unshift',
                  value: function (t) {
                    var e = { data: t, next: this.head }
                    0 === this.length && (this.tail = e), (this.head = e), ++this.length
                  },
                },
                {
                  key: 'shift',
                  value: function () {
                    if (0 !== this.length) {
                      var t = this.head.data
                      return (
                        1 === this.length ? (this.head = this.tail = null) : (this.head = this.head.next),
                        --this.length,
                        t
                      )
                    }
                  },
                },
                {
                  key: 'clear',
                  value: function () {
                    ;(this.head = this.tail = null), (this.length = 0)
                  },
                },
                {
                  key: 'join',
                  value: function (t) {
                    if (0 === this.length) return ''
                    for (var e = this.head, r = '' + e.data; (e = e.next); ) r += t + e.data
                    return r
                  },
                },
                {
                  key: 'concat',
                  value: function (t) {
                    if (0 === this.length) return a.alloc(0)
                    for (var e, r, i, n = a.allocUnsafe(t >>> 0), o = this.head, s = 0; o; )
                      (e = o.data), (r = n), (i = s), a.prototype.copy.call(e, r, i), (s += o.data.length), (o = o.next)
                    return n
                  },
                },
                {
                  key: 'consume',
                  value: function (t, e) {
                    var r
                    return (
                      t < this.head.data.length
                        ? ((r = this.head.data.slice(0, t)), (this.head.data = this.head.data.slice(t)))
                        : (r =
                            t === this.head.data.length ? this.shift() : e ? this._getString(t) : this._getBuffer(t)),
                      r
                    )
                  },
                },
                {
                  key: 'first',
                  value: function () {
                    return this.head.data
                  },
                },
                {
                  key: '_getString',
                  value: function (t) {
                    var e = this.head,
                      r = 1,
                      i = e.data
                    for (t -= i.length; (e = e.next); ) {
                      var n = e.data,
                        o = t > n.length ? n.length : t
                      if ((o === n.length ? (i += n) : (i += n.slice(0, t)), 0 == (t -= o))) {
                        o === n.length
                          ? (++r, e.next ? (this.head = e.next) : (this.head = this.tail = null))
                          : ((this.head = e), (e.data = n.slice(o)))
                        break
                      }
                      ++r
                    }
                    return (this.length -= r), i
                  },
                },
                {
                  key: '_getBuffer',
                  value: function (t) {
                    var e = a.allocUnsafe(t),
                      r = this.head,
                      i = 1
                    for (r.data.copy(e), t -= r.data.length; (r = r.next); ) {
                      var n = r.data,
                        o = t > n.length ? n.length : t
                      if ((n.copy(e, e.length - t, 0, o), 0 == (t -= o))) {
                        o === n.length
                          ? (++i, r.next ? (this.head = r.next) : (this.head = this.tail = null))
                          : ((this.head = r), (r.data = n.slice(o)))
                        break
                      }
                      ++i
                    }
                    return (this.length -= i), e
                  },
                },
                {
                  key: f,
                  value: function (t, e) {
                    return s(
                      this,
                      (function (t) {
                        for (var e = 1; e < arguments.length; e++) {
                          var r = null != arguments[e] ? arguments[e] : {}
                          e % 2
                            ? i(Object(r), !0).forEach(function (e) {
                                n(t, e, r[e])
                              })
                            : Object.getOwnPropertyDescriptors
                            ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r))
                            : i(Object(r)).forEach(function (e) {
                                Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(r, e))
                              })
                        }
                        return t
                      })({}, e, { depth: 0, customInspect: !1 }),
                    )
                  },
                },
              ]) && o(e.prototype, r),
              t
            )
          })()
        },
        528: (t, e, r) => {
          'use strict'
          var i = r(7671)
          function n(t, e) {
            a(t, e), o(t)
          }
          function o(t) {
            ;(t._writableState && !t._writableState.emitClose) ||
              (t._readableState && !t._readableState.emitClose) ||
              t.emit('close')
          }
          function a(t, e) {
            t.emit('error', e)
          }
          t.exports = {
            destroy: function (t, e) {
              var r = this,
                s = this._readableState && this._readableState.destroyed,
                f = this._writableState && this._writableState.destroyed
              return s || f
                ? (e
                    ? e(t)
                    : t &&
                      (this._writableState
                        ? this._writableState.errorEmitted ||
                          ((this._writableState.errorEmitted = !0), i.nextTick(a, this, t))
                        : i.nextTick(a, this, t)),
                  this)
                : (this._readableState && (this._readableState.destroyed = !0),
                  this._writableState && (this._writableState.destroyed = !0),
                  this._destroy(t || null, function (t) {
                    !e && t
                      ? r._writableState
                        ? r._writableState.errorEmitted
                          ? i.nextTick(o, r)
                          : ((r._writableState.errorEmitted = !0), i.nextTick(n, r, t))
                        : i.nextTick(n, r, t)
                      : e
                      ? (i.nextTick(o, r), e(t))
                      : i.nextTick(o, r)
                  }),
                  this)
            },
            undestroy: function () {
              this._readableState &&
                ((this._readableState.destroyed = !1),
                (this._readableState.reading = !1),
                (this._readableState.ended = !1),
                (this._readableState.endEmitted = !1)),
                this._writableState &&
                  ((this._writableState.destroyed = !1),
                  (this._writableState.ended = !1),
                  (this._writableState.ending = !1),
                  (this._writableState.finalCalled = !1),
                  (this._writableState.prefinished = !1),
                  (this._writableState.finished = !1),
                  (this._writableState.errorEmitted = !1))
            },
            errorOrDestroy: function (t, e) {
              var r = t._readableState,
                i = t._writableState
              ;(r && r.autoDestroy) || (i && i.autoDestroy) ? t.destroy(e) : t.emit('error', e)
            },
          }
        },
        6583: (t, e, r) => {
          'use strict'
          var i = r(1686).q.ERR_STREAM_PREMATURE_CLOSE
          function n() {}
          t.exports = function t(e, r, o) {
            if ('function' == typeof r) return t(e, null, r)
            r || (r = {}),
              (o = (function (t) {
                var e = !1
                return function () {
                  if (!e) {
                    e = !0
                    for (var r = arguments.length, i = new Array(r), n = 0; n < r; n++) i[n] = arguments[n]
                    t.apply(this, i)
                  }
                }
              })(o || n))
            var a = r.readable || (!1 !== r.readable && e.readable),
              s = r.writable || (!1 !== r.writable && e.writable),
              f = function () {
                e.writable || c()
              },
              h = e._writableState && e._writableState.finished,
              c = function () {
                ;(s = !1), (h = !0), a || o.call(e)
              },
              u = e._readableState && e._readableState.endEmitted,
              d = function () {
                ;(a = !1), (u = !0), s || o.call(e)
              },
              l = function (t) {
                o.call(e, t)
              },
              p = function () {
                var t
                return a && !u
                  ? ((e._readableState && e._readableState.ended) || (t = new i()), o.call(e, t))
                  : s && !h
                  ? ((e._writableState && e._writableState.ended) || (t = new i()), o.call(e, t))
                  : void 0
              },
              b = function () {
                e.req.on('finish', c)
              }
            return (
              (function (t) {
                return t.setHeader && 'function' == typeof t.abort
              })(e)
                ? (e.on('complete', c), e.on('abort', p), e.req ? b() : e.on('request', b))
                : s && !e._writableState && (e.on('end', f), e.on('close', f)),
              e.on('end', d),
              e.on('finish', c),
              !1 !== r.error && e.on('error', l),
              e.on('close', p),
              function () {
                e.removeListener('complete', c),
                  e.removeListener('abort', p),
                  e.removeListener('request', b),
                  e.req && e.req.removeListener('finish', c),
                  e.removeListener('end', f),
                  e.removeListener('close', f),
                  e.removeListener('finish', c),
                  e.removeListener('end', d),
                  e.removeListener('error', l),
                  e.removeListener('close', p)
              }
            )
          }
        },
        3730: (t) => {
          t.exports = function () {
            throw new Error('Readable.from is not available in the browser')
          }
        },
        5924: (t, e, r) => {
          'use strict'
          var i,
            n = r(1686).q,
            o = n.ERR_MISSING_ARGS,
            a = n.ERR_STREAM_DESTROYED
          function s(t) {
            if (t) throw t
          }
          function f(t, e, n, o) {
            o = (function (t) {
              var e = !1
              return function () {
                e || ((e = !0), t.apply(void 0, arguments))
              }
            })(o)
            var s = !1
            t.on('close', function () {
              s = !0
            }),
              void 0 === i && (i = r(6583)),
              i(t, { readable: e, writable: n }, function (t) {
                if (t) return o(t)
                ;(s = !0), o()
              })
            var f = !1
            return function (e) {
              if (!s && !f)
                return (
                  (f = !0),
                  (function (t) {
                    return t.setHeader && 'function' == typeof t.abort
                  })(t)
                    ? t.abort()
                    : 'function' == typeof t.destroy
                    ? t.destroy()
                    : void o(e || new a('pipe'))
                )
            }
          }
          function h(t) {
            t()
          }
          function c(t, e) {
            return t.pipe(e)
          }
          function u(t) {
            return t.length ? ('function' != typeof t[t.length - 1] ? s : t.pop()) : s
          }
          t.exports = function () {
            for (var t = arguments.length, e = new Array(t), r = 0; r < t; r++) e[r] = arguments[r]
            var i,
              n = u(e)
            if ((Array.isArray(e[0]) && (e = e[0]), e.length < 2)) throw new o('streams')
            var a = e.map(function (t, r) {
              var o = r < e.length - 1
              return f(t, o, r > 0, function (t) {
                i || (i = t), t && a.forEach(h), o || (a.forEach(h), n(i))
              })
            })
            return e.reduce(c)
          }
        },
        814: (t, e, r) => {
          'use strict'
          var i = r(1686).q.ERR_INVALID_OPT_VALUE
          t.exports = {
            getHighWaterMark: function (t, e, r, n) {
              var o = (function (t, e, r) {
                return null != t.highWaterMark ? t.highWaterMark : e ? t[r] : null
              })(e, n, r)
              if (null != o) {
                if (!isFinite(o) || Math.floor(o) !== o || o < 0) throw new i(n ? r : 'highWaterMark', o)
                return Math.floor(o)
              }
              return t.objectMode ? 16 : 16384
            },
          }
        },
        2670: (t, e, r) => {
          t.exports = r(4525).EventEmitter
        },
        1902: (t, e, r) => {
          ;((e = t.exports = r(9723)).Stream = e),
            (e.Readable = e),
            (e.Writable = r(349)),
            (e.Duplex = r(8600)),
            (e.Transform = r(7756)),
            (e.PassThrough = r(9795)),
            (e.finished = r(6583)),
            (e.pipeline = r(5924))
        },
        2997: (t, e, r) => {
          'use strict'
          var i = r(692).Buffer,
            n = r(4603),
            o = r(6018),
            a = new Array(16),
            s = [
              0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11,
              8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5,
              6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
            ],
            f = [
              5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1,
              2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10,
              14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
            ],
            h = [
              11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7,
              13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6,
              8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6,
            ],
            c = [
              8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15,
              13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9,
              12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11,
            ],
            u = [0, 1518500249, 1859775393, 2400959708, 2840853838],
            d = [1352829926, 1548603684, 1836072691, 2053994217, 0]
          function l() {
            o.call(this, 64),
              (this._a = 1732584193),
              (this._b = 4023233417),
              (this._c = 2562383102),
              (this._d = 271733878),
              (this._e = 3285377520)
          }
          function p(t, e) {
            return (t << e) | (t >>> (32 - e))
          }
          function b(t, e, r, i, n, o, a, s) {
            return (p((t + (e ^ r ^ i) + o + a) | 0, s) + n) | 0
          }
          function m(t, e, r, i, n, o, a, s) {
            return (p((t + ((e & r) | (~e & i)) + o + a) | 0, s) + n) | 0
          }
          function y(t, e, r, i, n, o, a, s) {
            return (p((t + ((e | ~r) ^ i) + o + a) | 0, s) + n) | 0
          }
          function g(t, e, r, i, n, o, a, s) {
            return (p((t + ((e & i) | (r & ~i)) + o + a) | 0, s) + n) | 0
          }
          function v(t, e, r, i, n, o, a, s) {
            return (p((t + (e ^ (r | ~i)) + o + a) | 0, s) + n) | 0
          }
          n(l, o),
            (l.prototype._update = function () {
              for (var t = a, e = 0; e < 16; ++e) t[e] = this._block.readInt32LE(4 * e)
              for (
                var r = 0 | this._a,
                  i = 0 | this._b,
                  n = 0 | this._c,
                  o = 0 | this._d,
                  l = 0 | this._e,
                  _ = 0 | this._a,
                  w = 0 | this._b,
                  M = 0 | this._c,
                  S = 0 | this._d,
                  E = 0 | this._e,
                  A = 0;
                A < 80;
                A += 1
              ) {
                var k, I
                A < 16
                  ? ((k = b(r, i, n, o, l, t[s[A]], u[0], h[A])), (I = v(_, w, M, S, E, t[f[A]], d[0], c[A])))
                  : A < 32
                  ? ((k = m(r, i, n, o, l, t[s[A]], u[1], h[A])), (I = g(_, w, M, S, E, t[f[A]], d[1], c[A])))
                  : A < 48
                  ? ((k = y(r, i, n, o, l, t[s[A]], u[2], h[A])), (I = y(_, w, M, S, E, t[f[A]], d[2], c[A])))
                  : A < 64
                  ? ((k = g(r, i, n, o, l, t[s[A]], u[3], h[A])), (I = m(_, w, M, S, E, t[f[A]], d[3], c[A])))
                  : ((k = v(r, i, n, o, l, t[s[A]], u[4], h[A])), (I = b(_, w, M, S, E, t[f[A]], d[4], c[A]))),
                  (r = l),
                  (l = o),
                  (o = p(n, 10)),
                  (n = i),
                  (i = k),
                  (_ = E),
                  (E = S),
                  (S = p(M, 10)),
                  (M = w),
                  (w = I)
              }
              var B = (this._b + n + S) | 0
              ;(this._b = (this._c + o + E) | 0),
                (this._c = (this._d + l + _) | 0),
                (this._d = (this._e + r + w) | 0),
                (this._e = (this._a + i + M) | 0),
                (this._a = B)
            }),
            (l.prototype._digest = function () {
              ;(this._block[this._blockOffset++] = 128),
                this._blockOffset > 56 &&
                  (this._block.fill(0, this._blockOffset, 64), this._update(), (this._blockOffset = 0)),
                this._block.fill(0, this._blockOffset, 56),
                this._block.writeUInt32LE(this._length[0], 56),
                this._block.writeUInt32LE(this._length[1], 60),
                this._update()
              var t = i.alloc ? i.alloc(20) : new i(20)
              return (
                t.writeInt32LE(this._a, 0),
                t.writeInt32LE(this._b, 4),
                t.writeInt32LE(this._c, 8),
                t.writeInt32LE(this._d, 12),
                t.writeInt32LE(this._e, 16),
                t
              )
            }),
            (t.exports = l)
        },
        8467: (t, e, r) => {
          var i = r(692),
            n = i.Buffer
          function o(t, e) {
            for (var r in t) e[r] = t[r]
          }
          function a(t, e, r) {
            return n(t, e, r)
          }
          n.from && n.alloc && n.allocUnsafe && n.allocUnsafeSlow ? (t.exports = i) : (o(i, e), (e.Buffer = a)),
            (a.prototype = Object.create(n.prototype)),
            o(n, a),
            (a.from = function (t, e, r) {
              if ('number' == typeof t) throw new TypeError('Argument must not be a number')
              return n(t, e, r)
            }),
            (a.alloc = function (t, e, r) {
              if ('number' != typeof t) throw new TypeError('Argument must be a number')
              var i = n(t)
              return void 0 !== e ? ('string' == typeof r ? i.fill(e, r) : i.fill(e)) : i.fill(0), i
            }),
            (a.allocUnsafe = function (t) {
              if ('number' != typeof t) throw new TypeError('Argument must be a number')
              return n(t)
            }),
            (a.allocUnsafeSlow = function (t) {
              if ('number' != typeof t) throw new TypeError('Argument must be a number')
              return i.SlowBuffer(t)
            })
        },
        6209: (t, e, r) => {
          'use strict'
          var i,
            n = r(7671),
            o = r(692),
            a = o.Buffer,
            s = {}
          for (i in o) o.hasOwnProperty(i) && 'SlowBuffer' !== i && 'Buffer' !== i && (s[i] = o[i])
          var f = (s.Buffer = {})
          for (i in a) a.hasOwnProperty(i) && 'allocUnsafe' !== i && 'allocUnsafeSlow' !== i && (f[i] = a[i])
          if (
            ((s.Buffer.prototype = a.prototype),
            (f.from && f.from !== Uint8Array.from) ||
              (f.from = function (t, e, r) {
                if ('number' == typeof t)
                  throw new TypeError('The "value" argument must not be of type number. Received type ' + typeof t)
                if (t && void 0 === t.length)
                  throw new TypeError(
                    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ' +
                      typeof t,
                  )
                return a(t, e, r)
              }),
            f.alloc ||
              (f.alloc = function (t, e, r) {
                if ('number' != typeof t)
                  throw new TypeError('The "size" argument must be of type number. Received type ' + typeof t)
                if (t < 0 || t >= 2 * (1 << 30))
                  throw new RangeError('The value "' + t + '" is invalid for option "size"')
                var i = a(t)
                return e && 0 !== e.length ? ('string' == typeof r ? i.fill(e, r) : i.fill(e)) : i.fill(0), i
              }),
            !s.kStringMaxLength)
          )
            try {
              s.kStringMaxLength = n.binding('buffer').kStringMaxLength
            } catch (t) {}
          s.constants ||
            ((s.constants = { MAX_LENGTH: s.kMaxLength }),
            s.kStringMaxLength && (s.constants.MAX_STRING_LENGTH = s.kStringMaxLength)),
            (t.exports = s)
        },
        51: (t, e, r) => {
          'use strict'
          t.exports = r(793)
        },
        793: (t, e, r) => {
          'use strict'
          var i = r(8467).Buffer,
            n = r(3987),
            o = r(7898),
            a = r(7264).ec,
            s = r(6031),
            f = new a('p256'),
            h = f.curve
          function c(t) {
            var e = t[0]
            switch (e) {
              case 2:
              case 3:
                return 33 !== t.length
                  ? null
                  : (function (t, e) {
                      var r = new o(e)
                      if (r.cmp(h.p) >= 0) return null
                      var i = (r = r.toRed(h.red)).redSqr().redIMul(r).redIAdd(h.b).redSqrt()
                      return (3 === t) !== i.isOdd() && (i = i.redNeg()), f.keyPair({ pub: { x: r, y: i } })
                    })(e, t.slice(1, 33))
              case 4:
              case 6:
              case 7:
                return 65 !== t.length
                  ? null
                  : (function (t, e, r) {
                      var i = new o(e),
                        n = new o(r),
                        a = new o(e)
                      if (i.cmp(h.p) >= 0 || n.cmp(h.p) >= 0) return null
                      if (
                        ((i = i.toRed(h.red)),
                        (n = n.toRed(h.red)),
                        (a = a.toRed(h.red)),
                        (6 === t || 7 === t) && n.isOdd() !== (7 === t))
                      )
                        return null
                      var s = i.redSqr().redIMul(i).redIAdd(i.redIMul(h.a))
                      return n.redSqr().redISub(s.redIAdd(h.b)).isZero() ? f.keyPair({ pub: { x: a, y: n } }) : null
                    })(e, t.slice(1, 33), t.slice(33, 65))
              default:
                return null
            }
          }
          ;(e.privateKeyVerify = function (t) {
            var e = new o(t)
            return e.cmp(h.n) < 0 && !e.isZero()
          }),
            (e.privateKeyExport = function (t, e) {
              var r = new o(t)
              if (r.cmp(h.n) >= 0 || r.isZero()) throw new Error(s.EC_PRIVATE_KEY_EXPORT_DER_FAIL)
              return i.from(f.keyFromPrivate(t).getPublic(e, !0))
            }),
            (e.privateKeyNegate = function (t) {
              var e = new o(t)
              return e.isZero() ? i.alloc(32) : h.n.sub(e).umod(h.n).toArrayLike(i, 'be', 32)
            }),
            (e.privateKeyModInverse = function (t) {
              var e = new o(t)
              if (e.cmp(h.n) >= 0 || e.isZero()) throw new Error(s.EC_PRIVATE_KEY_RANGE_INVALID)
              return e.invm(h.n).toArrayLike(i, 'be', 32)
            }),
            (e.privateKeyTweakAdd = function (t, e) {
              var r = new o(e)
              if (r.cmp(h.n) >= 0) throw new Error(s.EC_PRIVATE_KEY_TWEAK_ADD_FAIL)
              if ((r.iadd(new o(t)), r.cmp(h.n) >= 0 && r.isub(h.n), r.isZero()))
                throw new Error(s.EC_PRIVATE_KEY_TWEAK_ADD_FAIL)
              return r.toArrayLike(i, 'be', 32)
            }),
            (e.privateKeyTweakMul = function (t, e) {
              var r = new o(e)
              if (r.cmp(h.n) >= 0 || r.isZero()) throw new Error(s.EC_PRIVATE_KEY_TWEAK_MUL_FAIL)
              return r.imul(new o(t)), r.cmp(h.n) && (r = r.umod(h.n)), r.toArrayLike(i, 'be', 32)
            }),
            (e.publicKeyCreate = function (t, e) {
              var r = new o(t)
              if (r.cmp(h.n) >= 0 || r.isZero()) throw new Error(s.EC_PUBLIC_KEY_CREATE_FAIL)
              return i.from(f.keyFromPrivate(t).getPublic(e, !0))
            }),
            (e.publicKeyConvert = function (t, e) {
              var r = c(t)
              if (null === r) throw new Error(s.EC_PUBLIC_KEY_PARSE_FAIL)
              return i.from(r.getPublic(e, !0))
            }),
            (e.publicKeyVerify = function (t) {
              return null !== c(t)
            }),
            (e.publicKeyTweakAdd = function (t, e, r) {
              var n = c(t)
              if (null === n) throw new Error(s.EC_PUBLIC_KEY_PARSE_FAIL)
              if ((e = new o(e)).cmp(h.n) >= 0) throw new Error(s.EC_PUBLIC_KEY_TWEAK_ADD_FAIL)
              return i.from(h.g.mul(e).add(n.pub).encode(!0, r))
            }),
            (e.publicKeyTweakMul = function (t, e, r) {
              var n = c(t)
              if (null === n) throw new Error(s.EC_PUBLIC_KEY_PARSE_FAIL)
              if ((e = new o(e)).cmp(h.n) >= 0 || e.isZero()) throw new Error(s.EC_PUBLIC_KEY_TWEAK_MUL_FAIL)
              return i.from(n.pub.mul(e).encode(!0, r))
            }),
            (e.publicKeyCombine = function (t, e) {
              for (var r = new Array(t.length), n = 0; n < t.length; ++n)
                if (((r[n] = c(t[n])), null === r[n])) throw new Error(s.EC_PUBLIC_KEY_PARSE_FAIL)
              for (var o = r[0].pub, a = 1; a < r.length; ++a) o = o.add(r[a].pub)
              if (o.isInfinity()) throw new Error(s.EC_PUBLIC_KEY_COMBINE_FAIL)
              return i.from(o.encode(!0, e))
            }),
            (e.signatureNormalize = function (t) {
              var e = new o(t.slice(0, 32)),
                r = new o(t.slice(32, 64))
              if (e.cmp(h.n) >= 0 || r.cmp(h.n) >= 0) throw new Error(s.ECDSA_SIGNATURE_PARSE_FAIL)
              var n = i.from(t)
              return 1 === r.cmp(f.nh) && h.n.sub(r).toArrayLike(i, 'be', 32).copy(n, 32), n
            }),
            (e.signatureExport = function (t) {
              var e = t.slice(0, 32),
                r = t.slice(32, 64)
              if (new o(e).cmp(h.n) >= 0 || new o(r).cmp(h.n) >= 0) throw new Error(s.ECDSA_SIGNATURE_PARSE_FAIL)
              return { r: e, s: r }
            }),
            (e.signatureImport = function (t) {
              var e = new o(t.r)
              e.cmp(h.n) >= 0 && (e = new o(0))
              var r = new o(t.s)
              return (
                r.cmp(h.n) >= 0 && (r = new o(0)), i.concat([e.toArrayLike(i, 'be', 32), r.toArrayLike(i, 'be', 32)])
              )
            }),
            (e.sign = function (t, e, r, n) {
              if ('function' == typeof r) {
                var a = r
                r = function (r) {
                  var f = a(t, e, null, n, r)
                  if (!i.isBuffer(f) || 32 !== f.length) throw new Error(s.ECDSA_SIGN_FAIL)
                  return new o(f)
                }
              }
              var c = new o(e)
              if (c.cmp(h.n) >= 0 || c.isZero()) throw new Error(s.ECDSA_SIGN_FAIL)
              var u = f.sign(t, e, { canonical: !0, k: r, pers: n })
              return {
                signature: i.concat([u.r.toArrayLike(i, 'be', 32), u.s.toArrayLike(i, 'be', 32)]),
                recovery: u.recoveryParam,
              }
            }),
            (e.verify = function (t, e, r) {
              var i = { r: e.slice(0, 32), s: e.slice(32, 64) },
                n = new o(i.r),
                a = new o(i.s)
              if (n.cmp(h.n) >= 0 || a.cmp(h.n) >= 0) throw new Error(s.ECDSA_SIGNATURE_PARSE_FAIL)
              if (1 === a.cmp(f.nh) || n.isZero() || a.isZero()) return !1
              var u = c(r)
              if (null === u) throw new Error(s.EC_PUBLIC_KEY_PARSE_FAIL)
              return f.verify(t, i, { x: u.pub.x, y: u.pub.y })
            }),
            (e.recover = function (t, e, r, n) {
              var a = { r: e.slice(0, 32), s: e.slice(32, 64) },
                c = new o(a.r),
                u = new o(a.s)
              if (c.cmp(h.n) >= 0 || u.cmp(h.n) >= 0) throw new Error(s.ECDSA_SIGNATURE_PARSE_FAIL)
              try {
                if (c.isZero() || u.isZero()) throw new Error()
                var d = f.recoverPubKey(t, a, r)
                return i.from(d.encode(!0, n))
              } catch (t) {
                throw new Error(s.ECDSA_RECOVER_FAIL)
              }
            }),
            (e.ecdh = function (t, r) {
              var i = e.ecdhUnsafe(t, r, !0)
              return n('sha256').update(i).digest()
            }),
            (e.ecdhUnsafe = function (t, e, r) {
              var n = c(t)
              if (null === n) throw new Error(s.EC_PUBLIC_KEY_PARSE_FAIL)
              var a = new o(e)
              if (a.cmp(h.n) >= 0 || a.isZero()) throw new Error(s.ECDH_FAIL)
              return i.from(n.pub.mul(a).encode(!0, r))
            })
        },
        6031: (t) => {
          'use strict'
          t.exports = JSON.parse(
            '{"COMPRESSED_TYPE_INVALID":"compressed should be a boolean","EC_PRIVATE_KEY_TYPE_INVALID":"private key should be a Buffer","EC_PRIVATE_KEY_LENGTH_INVALID":"private key length is invalid","EC_PRIVATE_KEY_RANGE_INVALID":"private key range is invalid","EC_PRIVATE_KEY_TWEAK_ADD_FAIL":"tweak out of range or resulting private key is invalid","EC_PRIVATE_KEY_TWEAK_MUL_FAIL":"tweak out of range","EC_PRIVATE_KEY_EXPORT_DER_FAIL":"couldn\'t export to DER format","EC_PRIVATE_KEY_IMPORT_DER_FAIL":"couldn\'t import from DER format","EC_PUBLIC_KEYS_TYPE_INVALID":"public keys should be an Array","EC_PUBLIC_KEYS_LENGTH_INVALID":"public keys Array should have at least 1 element","EC_PUBLIC_KEY_TYPE_INVALID":"public key should be a Buffer","EC_PUBLIC_KEY_LENGTH_INVALID":"public key length is invalid","EC_PUBLIC_KEY_PARSE_FAIL":"the public key could not be parsed or is invalid","EC_PUBLIC_KEY_CREATE_FAIL":"private was invalid, try again","EC_PUBLIC_KEY_TWEAK_ADD_FAIL":"tweak out of range or resulting public key is invalid","EC_PUBLIC_KEY_TWEAK_MUL_FAIL":"tweak out of range","EC_PUBLIC_KEY_COMBINE_FAIL":"the sum of the public keys is not valid","ECDH_FAIL":"scalar was invalid (zero or overflow)","ECDSA_SIGNATURE_TYPE_INVALID":"signature should be a Buffer","ECDSA_SIGNATURE_LENGTH_INVALID":"signature length is invalid","ECDSA_SIGNATURE_PARSE_FAIL":"couldn\'t parse signature","ECDSA_SIGNATURE_PARSE_DER_FAIL":"couldn\'t parse DER signature","ECDSA_SIGNATURE_SERIALIZE_DER_FAIL":"couldn\'t serialize signature to DER format","ECDSA_SIGN_FAIL":"nonce generation function failed or private key is invalid","ECDSA_RECOVER_FAIL":"couldn\'t recover public key from signature","MSG32_TYPE_INVALID":"message should be a Buffer","MSG32_LENGTH_INVALID":"message length is invalid","OPTIONS_TYPE_INVALID":"options should be an Object","OPTIONS_DATA_TYPE_INVALID":"options.data should be a Buffer","OPTIONS_DATA_LENGTH_INVALID":"options.data length is invalid","OPTIONS_NONCEFN_TYPE_INVALID":"options.noncefn should be a Function","RECOVERY_ID_TYPE_INVALID":"recovery should be a Number","RECOVERY_ID_VALUE_INVALID":"recovery should have value between -1 and 4","TWEAK_TYPE_INVALID":"tweak should be a Buffer","TWEAK_LENGTH_INVALID":"tweak length is invalid"}',
          )
        },
        404: (t, e, r) => {
          var i = r(8467).Buffer
          function n(t, e) {
            ;(this._block = i.alloc(t)), (this._finalSize = e), (this._blockSize = t), (this._len = 0)
          }
          ;(n.prototype.update = function (t, e) {
            'string' == typeof t && ((e = e || 'utf8'), (t = i.from(t, e)))
            for (var r = this._block, n = this._blockSize, o = t.length, a = this._len, s = 0; s < o; ) {
              for (var f = a % n, h = Math.min(o - s, n - f), c = 0; c < h; c++) r[f + c] = t[s + c]
              ;(s += h), (a += h) % n == 0 && this._update(r)
            }
            return (this._len += o), this
          }),
            (n.prototype.digest = function (t) {
              var e = this._len % this._blockSize
              ;(this._block[e] = 128),
                this._block.fill(0, e + 1),
                e >= this._finalSize && (this._update(this._block), this._block.fill(0))
              var r = 8 * this._len
              if (r <= 4294967295) this._block.writeUInt32BE(r, this._blockSize - 4)
              else {
                var i = (4294967295 & r) >>> 0,
                  n = (r - i) / 4294967296
                this._block.writeUInt32BE(n, this._blockSize - 8), this._block.writeUInt32BE(i, this._blockSize - 4)
              }
              this._update(this._block)
              var o = this._hash()
              return t ? o.toString(t) : o
            }),
            (n.prototype._update = function () {
              throw new Error('_update must be implemented by subclass')
            }),
            (t.exports = n)
        },
        8927: (t, e, r) => {
          var i = (t.exports = function (t) {
            t = t.toLowerCase()
            var e = i[t]
            if (!e) throw new Error(t + ' is not supported (we accept pull requests)')
            return new e()
          })
          ;(i.sha = r(2373)),
            (i.sha1 = r(3771)),
            (i.sha224 = r(2981)),
            (i.sha256 = r(6860)),
            (i.sha384 = r(4084)),
            (i.sha512 = r(2529))
        },
        2373: (t, e, r) => {
          var i = r(4603),
            n = r(404),
            o = r(8467).Buffer,
            a = [1518500249, 1859775393, -1894007588, -899497514],
            s = new Array(80)
          function f() {
            this.init(), (this._w = s), n.call(this, 64, 56)
          }
          function h(t) {
            return (t << 30) | (t >>> 2)
          }
          function c(t, e, r, i) {
            return 0 === t ? (e & r) | (~e & i) : 2 === t ? (e & r) | (e & i) | (r & i) : e ^ r ^ i
          }
          i(f, n),
            (f.prototype.init = function () {
              return (
                (this._a = 1732584193),
                (this._b = 4023233417),
                (this._c = 2562383102),
                (this._d = 271733878),
                (this._e = 3285377520),
                this
              )
            }),
            (f.prototype._update = function (t) {
              for (
                var e,
                  r = this._w,
                  i = 0 | this._a,
                  n = 0 | this._b,
                  o = 0 | this._c,
                  s = 0 | this._d,
                  f = 0 | this._e,
                  u = 0;
                u < 16;
                ++u
              )
                r[u] = t.readInt32BE(4 * u)
              for (; u < 80; ++u) r[u] = r[u - 3] ^ r[u - 8] ^ r[u - 14] ^ r[u - 16]
              for (var d = 0; d < 80; ++d) {
                var l = ~~(d / 20),
                  p = 0 | ((((e = i) << 5) | (e >>> 27)) + c(l, n, o, s) + f + r[d] + a[l])
                ;(f = s), (s = o), (o = h(n)), (n = i), (i = p)
              }
              ;(this._a = (i + this._a) | 0),
                (this._b = (n + this._b) | 0),
                (this._c = (o + this._c) | 0),
                (this._d = (s + this._d) | 0),
                (this._e = (f + this._e) | 0)
            }),
            (f.prototype._hash = function () {
              var t = o.allocUnsafe(20)
              return (
                t.writeInt32BE(0 | this._a, 0),
                t.writeInt32BE(0 | this._b, 4),
                t.writeInt32BE(0 | this._c, 8),
                t.writeInt32BE(0 | this._d, 12),
                t.writeInt32BE(0 | this._e, 16),
                t
              )
            }),
            (t.exports = f)
        },
        3771: (t, e, r) => {
          var i = r(4603),
            n = r(404),
            o = r(8467).Buffer,
            a = [1518500249, 1859775393, -1894007588, -899497514],
            s = new Array(80)
          function f() {
            this.init(), (this._w = s), n.call(this, 64, 56)
          }
          function h(t) {
            return (t << 5) | (t >>> 27)
          }
          function c(t) {
            return (t << 30) | (t >>> 2)
          }
          function u(t, e, r, i) {
            return 0 === t ? (e & r) | (~e & i) : 2 === t ? (e & r) | (e & i) | (r & i) : e ^ r ^ i
          }
          i(f, n),
            (f.prototype.init = function () {
              return (
                (this._a = 1732584193),
                (this._b = 4023233417),
                (this._c = 2562383102),
                (this._d = 271733878),
                (this._e = 3285377520),
                this
              )
            }),
            (f.prototype._update = function (t) {
              for (
                var e,
                  r = this._w,
                  i = 0 | this._a,
                  n = 0 | this._b,
                  o = 0 | this._c,
                  s = 0 | this._d,
                  f = 0 | this._e,
                  d = 0;
                d < 16;
                ++d
              )
                r[d] = t.readInt32BE(4 * d)
              for (; d < 80; ++d) r[d] = ((e = r[d - 3] ^ r[d - 8] ^ r[d - 14] ^ r[d - 16]) << 1) | (e >>> 31)
              for (var l = 0; l < 80; ++l) {
                var p = ~~(l / 20),
                  b = (h(i) + u(p, n, o, s) + f + r[l] + a[p]) | 0
                ;(f = s), (s = o), (o = c(n)), (n = i), (i = b)
              }
              ;(this._a = (i + this._a) | 0),
                (this._b = (n + this._b) | 0),
                (this._c = (o + this._c) | 0),
                (this._d = (s + this._d) | 0),
                (this._e = (f + this._e) | 0)
            }),
            (f.prototype._hash = function () {
              var t = o.allocUnsafe(20)
              return (
                t.writeInt32BE(0 | this._a, 0),
                t.writeInt32BE(0 | this._b, 4),
                t.writeInt32BE(0 | this._c, 8),
                t.writeInt32BE(0 | this._d, 12),
                t.writeInt32BE(0 | this._e, 16),
                t
              )
            }),
            (t.exports = f)
        },
        2981: (t, e, r) => {
          var i = r(4603),
            n = r(6860),
            o = r(404),
            a = r(8467).Buffer,
            s = new Array(64)
          function f() {
            this.init(), (this._w = s), o.call(this, 64, 56)
          }
          i(f, n),
            (f.prototype.init = function () {
              return (
                (this._a = 3238371032),
                (this._b = 914150663),
                (this._c = 812702999),
                (this._d = 4144912697),
                (this._e = 4290775857),
                (this._f = 1750603025),
                (this._g = 1694076839),
                (this._h = 3204075428),
                this
              )
            }),
            (f.prototype._hash = function () {
              var t = a.allocUnsafe(28)
              return (
                t.writeInt32BE(this._a, 0),
                t.writeInt32BE(this._b, 4),
                t.writeInt32BE(this._c, 8),
                t.writeInt32BE(this._d, 12),
                t.writeInt32BE(this._e, 16),
                t.writeInt32BE(this._f, 20),
                t.writeInt32BE(this._g, 24),
                t
              )
            }),
            (t.exports = f)
        },
        6860: (t, e, r) => {
          var i = r(4603),
            n = r(404),
            o = r(8467).Buffer,
            a = [
              1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080,
              310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774,
              264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808,
              3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
              1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771,
              3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571,
              1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474,
              2756734187, 3204031479, 3329325298,
            ],
            s = new Array(64)
          function f() {
            this.init(), (this._w = s), n.call(this, 64, 56)
          }
          function h(t, e, r) {
            return r ^ (t & (e ^ r))
          }
          function c(t, e, r) {
            return (t & e) | (r & (t | e))
          }
          function u(t) {
            return ((t >>> 2) | (t << 30)) ^ ((t >>> 13) | (t << 19)) ^ ((t >>> 22) | (t << 10))
          }
          function d(t) {
            return ((t >>> 6) | (t << 26)) ^ ((t >>> 11) | (t << 21)) ^ ((t >>> 25) | (t << 7))
          }
          function l(t) {
            return ((t >>> 7) | (t << 25)) ^ ((t >>> 18) | (t << 14)) ^ (t >>> 3)
          }
          i(f, n),
            (f.prototype.init = function () {
              return (
                (this._a = 1779033703),
                (this._b = 3144134277),
                (this._c = 1013904242),
                (this._d = 2773480762),
                (this._e = 1359893119),
                (this._f = 2600822924),
                (this._g = 528734635),
                (this._h = 1541459225),
                this
              )
            }),
            (f.prototype._update = function (t) {
              for (
                var e,
                  r = this._w,
                  i = 0 | this._a,
                  n = 0 | this._b,
                  o = 0 | this._c,
                  s = 0 | this._d,
                  f = 0 | this._e,
                  p = 0 | this._f,
                  b = 0 | this._g,
                  m = 0 | this._h,
                  y = 0;
                y < 16;
                ++y
              )
                r[y] = t.readInt32BE(4 * y)
              for (; y < 64; ++y)
                r[y] =
                  0 |
                  (((((e = r[y - 2]) >>> 17) | (e << 15)) ^ ((e >>> 19) | (e << 13)) ^ (e >>> 10)) +
                    r[y - 7] +
                    l(r[y - 15]) +
                    r[y - 16])
              for (var g = 0; g < 64; ++g) {
                var v = (m + d(f) + h(f, p, b) + a[g] + r[g]) | 0,
                  _ = (u(i) + c(i, n, o)) | 0
                ;(m = b), (b = p), (p = f), (f = (s + v) | 0), (s = o), (o = n), (n = i), (i = (v + _) | 0)
              }
              ;(this._a = (i + this._a) | 0),
                (this._b = (n + this._b) | 0),
                (this._c = (o + this._c) | 0),
                (this._d = (s + this._d) | 0),
                (this._e = (f + this._e) | 0),
                (this._f = (p + this._f) | 0),
                (this._g = (b + this._g) | 0),
                (this._h = (m + this._h) | 0)
            }),
            (f.prototype._hash = function () {
              var t = o.allocUnsafe(32)
              return (
                t.writeInt32BE(this._a, 0),
                t.writeInt32BE(this._b, 4),
                t.writeInt32BE(this._c, 8),
                t.writeInt32BE(this._d, 12),
                t.writeInt32BE(this._e, 16),
                t.writeInt32BE(this._f, 20),
                t.writeInt32BE(this._g, 24),
                t.writeInt32BE(this._h, 28),
                t
              )
            }),
            (t.exports = f)
        },
        4084: (t, e, r) => {
          var i = r(4603),
            n = r(2529),
            o = r(404),
            a = r(8467).Buffer,
            s = new Array(160)
          function f() {
            this.init(), (this._w = s), o.call(this, 128, 112)
          }
          i(f, n),
            (f.prototype.init = function () {
              return (
                (this._ah = 3418070365),
                (this._bh = 1654270250),
                (this._ch = 2438529370),
                (this._dh = 355462360),
                (this._eh = 1731405415),
                (this._fh = 2394180231),
                (this._gh = 3675008525),
                (this._hh = 1203062813),
                (this._al = 3238371032),
                (this._bl = 914150663),
                (this._cl = 812702999),
                (this._dl = 4144912697),
                (this._el = 4290775857),
                (this._fl = 1750603025),
                (this._gl = 1694076839),
                (this._hl = 3204075428),
                this
              )
            }),
            (f.prototype._hash = function () {
              var t = a.allocUnsafe(48)
              function e(e, r, i) {
                t.writeInt32BE(e, i), t.writeInt32BE(r, i + 4)
              }
              return (
                e(this._ah, this._al, 0),
                e(this._bh, this._bl, 8),
                e(this._ch, this._cl, 16),
                e(this._dh, this._dl, 24),
                e(this._eh, this._el, 32),
                e(this._fh, this._fl, 40),
                t
              )
            }),
            (t.exports = f)
        },
        2529: (t, e, r) => {
          var i = r(4603),
            n = r(404),
            o = r(8467).Buffer,
            a = [
              1116352408, 3609767458, 1899447441, 602891725, 3049323471, 3964484399, 3921009573, 2173295548, 961987163,
              4081628472, 1508970993, 3053834265, 2453635748, 2937671579, 2870763221, 3664609560, 3624381080,
              2734883394, 310598401, 1164996542, 607225278, 1323610764, 1426881987, 3590304994, 1925078388, 4068182383,
              2162078206, 991336113, 2614888103, 633803317, 3248222580, 3479774868, 3835390401, 2666613458, 4022224774,
              944711139, 264347078, 2341262773, 604807628, 2007800933, 770255983, 1495990901, 1249150122, 1856431235,
              1555081692, 3175218132, 1996064986, 2198950837, 2554220882, 3999719339, 2821834349, 766784016, 2952996808,
              2566594879, 3210313671, 3203337956, 3336571891, 1034457026, 3584528711, 2466948901, 113926993, 3758326383,
              338241895, 168717936, 666307205, 1188179964, 773529912, 1546045734, 1294757372, 1522805485, 1396182291,
              2643833823, 1695183700, 2343527390, 1986661051, 1014477480, 2177026350, 1206759142, 2456956037, 344077627,
              2730485921, 1290863460, 2820302411, 3158454273, 3259730800, 3505952657, 3345764771, 106217008, 3516065817,
              3606008344, 3600352804, 1432725776, 4094571909, 1467031594, 275423344, 851169720, 430227734, 3100823752,
              506948616, 1363258195, 659060556, 3750685593, 883997877, 3785050280, 958139571, 3318307427, 1322822218,
              3812723403, 1537002063, 2003034995, 1747873779, 3602036899, 1955562222, 1575990012, 2024104815,
              1125592928, 2227730452, 2716904306, 2361852424, 442776044, 2428436474, 593698344, 2756734187, 3733110249,
              3204031479, 2999351573, 3329325298, 3815920427, 3391569614, 3928383900, 3515267271, 566280711, 3940187606,
              3454069534, 4118630271, 4000239992, 116418474, 1914138554, 174292421, 2731055270, 289380356, 3203993006,
              460393269, 320620315, 685471733, 587496836, 852142971, 1086792851, 1017036298, 365543100, 1126000580,
              2618297676, 1288033470, 3409855158, 1501505948, 4234509866, 1607167915, 987167468, 1816402316, 1246189591,
            ],
            s = new Array(160)
          function f() {
            this.init(), (this._w = s), n.call(this, 128, 112)
          }
          function h(t, e, r) {
            return r ^ (t & (e ^ r))
          }
          function c(t, e, r) {
            return (t & e) | (r & (t | e))
          }
          function u(t, e) {
            return ((t >>> 28) | (e << 4)) ^ ((e >>> 2) | (t << 30)) ^ ((e >>> 7) | (t << 25))
          }
          function d(t, e) {
            return ((t >>> 14) | (e << 18)) ^ ((t >>> 18) | (e << 14)) ^ ((e >>> 9) | (t << 23))
          }
          function l(t, e) {
            return ((t >>> 1) | (e << 31)) ^ ((t >>> 8) | (e << 24)) ^ (t >>> 7)
          }
          function p(t, e) {
            return ((t >>> 1) | (e << 31)) ^ ((t >>> 8) | (e << 24)) ^ ((t >>> 7) | (e << 25))
          }
          function b(t, e) {
            return ((t >>> 19) | (e << 13)) ^ ((e >>> 29) | (t << 3)) ^ (t >>> 6)
          }
          function m(t, e) {
            return ((t >>> 19) | (e << 13)) ^ ((e >>> 29) | (t << 3)) ^ ((t >>> 6) | (e << 26))
          }
          function y(t, e) {
            return t >>> 0 < e >>> 0 ? 1 : 0
          }
          i(f, n),
            (f.prototype.init = function () {
              return (
                (this._ah = 1779033703),
                (this._bh = 3144134277),
                (this._ch = 1013904242),
                (this._dh = 2773480762),
                (this._eh = 1359893119),
                (this._fh = 2600822924),
                (this._gh = 528734635),
                (this._hh = 1541459225),
                (this._al = 4089235720),
                (this._bl = 2227873595),
                (this._cl = 4271175723),
                (this._dl = 1595750129),
                (this._el = 2917565137),
                (this._fl = 725511199),
                (this._gl = 4215389547),
                (this._hl = 327033209),
                this
              )
            }),
            (f.prototype._update = function (t) {
              for (
                var e = this._w,
                  r = 0 | this._ah,
                  i = 0 | this._bh,
                  n = 0 | this._ch,
                  o = 0 | this._dh,
                  s = 0 | this._eh,
                  f = 0 | this._fh,
                  g = 0 | this._gh,
                  v = 0 | this._hh,
                  _ = 0 | this._al,
                  w = 0 | this._bl,
                  M = 0 | this._cl,
                  S = 0 | this._dl,
                  E = 0 | this._el,
                  A = 0 | this._fl,
                  k = 0 | this._gl,
                  I = 0 | this._hl,
                  B = 0;
                B < 32;
                B += 2
              )
                (e[B] = t.readInt32BE(4 * B)), (e[B + 1] = t.readInt32BE(4 * B + 4))
              for (; B < 160; B += 2) {
                var R = e[B - 30],
                  x = e[B - 30 + 1],
                  T = l(R, x),
                  L = p(x, R),
                  C = b((R = e[B - 4]), (x = e[B - 4 + 1])),
                  P = m(x, R),
                  O = e[B - 14],
                  N = e[B - 14 + 1],
                  U = e[B - 32],
                  D = e[B - 32 + 1],
                  j = (L + N) | 0,
                  q = (T + O + y(j, L)) | 0
                ;(q = ((q = (q + C + y((j = (j + P) | 0), P)) | 0) + U + y((j = (j + D) | 0), D)) | 0),
                  (e[B] = q),
                  (e[B + 1] = j)
              }
              for (var z = 0; z < 160; z += 2) {
                ;(q = e[z]), (j = e[z + 1])
                var K = c(r, i, n),
                  F = c(_, w, M),
                  H = u(r, _),
                  V = u(_, r),
                  W = d(s, E),
                  Y = d(E, s),
                  G = a[z],
                  Z = a[z + 1],
                  X = h(s, f, g),
                  $ = h(E, A, k),
                  J = (I + Y) | 0,
                  Q = (v + W + y(J, I)) | 0
                Q =
                  ((Q = ((Q = (Q + X + y((J = (J + $) | 0), $)) | 0) + G + y((J = (J + Z) | 0), Z)) | 0) +
                    q +
                    y((J = (J + j) | 0), j)) |
                  0
                var tt = (V + F) | 0,
                  et = (H + K + y(tt, V)) | 0
                ;(v = g),
                  (I = k),
                  (g = f),
                  (k = A),
                  (f = s),
                  (A = E),
                  (s = (o + Q + y((E = (S + J) | 0), S)) | 0),
                  (o = n),
                  (S = M),
                  (n = i),
                  (M = w),
                  (i = r),
                  (w = _),
                  (r = (Q + et + y((_ = (J + tt) | 0), J)) | 0)
              }
              ;(this._al = (this._al + _) | 0),
                (this._bl = (this._bl + w) | 0),
                (this._cl = (this._cl + M) | 0),
                (this._dl = (this._dl + S) | 0),
                (this._el = (this._el + E) | 0),
                (this._fl = (this._fl + A) | 0),
                (this._gl = (this._gl + k) | 0),
                (this._hl = (this._hl + I) | 0),
                (this._ah = (this._ah + r + y(this._al, _)) | 0),
                (this._bh = (this._bh + i + y(this._bl, w)) | 0),
                (this._ch = (this._ch + n + y(this._cl, M)) | 0),
                (this._dh = (this._dh + o + y(this._dl, S)) | 0),
                (this._eh = (this._eh + s + y(this._el, E)) | 0),
                (this._fh = (this._fh + f + y(this._fl, A)) | 0),
                (this._gh = (this._gh + g + y(this._gl, k)) | 0),
                (this._hh = (this._hh + v + y(this._hl, I)) | 0)
            }),
            (f.prototype._hash = function () {
              var t = o.allocUnsafe(64)
              function e(e, r, i) {
                t.writeInt32BE(e, i), t.writeInt32BE(r, i + 4)
              }
              return (
                e(this._ah, this._al, 0),
                e(this._bh, this._bl, 8),
                e(this._ch, this._cl, 16),
                e(this._dh, this._dl, 24),
                e(this._eh, this._el, 32),
                e(this._fh, this._fl, 40),
                e(this._gh, this._gl, 48),
                e(this._hh, this._hl, 56),
                t
              )
            }),
            (t.exports = f)
        },
        1859: (t, e, r) => {
          t.exports = n
          var i = r(4525).EventEmitter
          function n() {
            i.call(this)
          }
          r(4603)(n, i),
            (n.Readable = r(9723)),
            (n.Writable = r(349)),
            (n.Duplex = r(8600)),
            (n.Transform = r(7756)),
            (n.PassThrough = r(9795)),
            (n.finished = r(6583)),
            (n.pipeline = r(5924)),
            (n.Stream = n),
            (n.prototype.pipe = function (t, e) {
              var r = this
              function n(e) {
                t.writable && !1 === t.write(e) && r.pause && r.pause()
              }
              function o() {
                r.readable && r.resume && r.resume()
              }
              r.on('data', n), t.on('drain', o), t._isStdio || (e && !1 === e.end) || (r.on('end', s), r.on('close', f))
              var a = !1
              function s() {
                a || ((a = !0), t.end())
              }
              function f() {
                a || ((a = !0), 'function' == typeof t.destroy && t.destroy())
              }
              function h(t) {
                if ((c(), 0 === i.listenerCount(this, 'error'))) throw t
              }
              function c() {
                r.removeListener('data', n),
                  t.removeListener('drain', o),
                  r.removeListener('end', s),
                  r.removeListener('close', f),
                  r.removeListener('error', h),
                  t.removeListener('error', h),
                  r.removeListener('end', c),
                  r.removeListener('close', c),
                  t.removeListener('close', c)
              }
              return (
                r.on('error', h),
                t.on('error', h),
                r.on('end', c),
                r.on('close', c),
                t.on('close', c),
                t.emit('pipe', r),
                t
              )
            })
        },
        8154: (t, e, r) => {
          'use strict'
          var i = r(8467).Buffer,
            n =
              i.isEncoding ||
              function (t) {
                switch ((t = '' + t) && t.toLowerCase()) {
                  case 'hex':
                  case 'utf8':
                  case 'utf-8':
                  case 'ascii':
                  case 'binary':
                  case 'base64':
                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                  case 'raw':
                    return !0
                  default:
                    return !1
                }
              }
          function o(t) {
            var e
            switch (
              ((this.encoding = (function (t) {
                var e = (function (t) {
                  if (!t) return 'utf8'
                  for (var e; ; )
                    switch (t) {
                      case 'utf8':
                      case 'utf-8':
                        return 'utf8'
                      case 'ucs2':
                      case 'ucs-2':
                      case 'utf16le':
                      case 'utf-16le':
                        return 'utf16le'
                      case 'latin1':
                      case 'binary':
                        return 'latin1'
                      case 'base64':
                      case 'ascii':
                      case 'hex':
                        return t
                      default:
                        if (e) return
                        ;(t = ('' + t).toLowerCase()), (e = !0)
                    }
                })(t)
                if ('string' != typeof e && (i.isEncoding === n || !n(t))) throw new Error('Unknown encoding: ' + t)
                return e || t
              })(t)),
              this.encoding)
            ) {
              case 'utf16le':
                ;(this.text = f), (this.end = h), (e = 4)
                break
              case 'utf8':
                ;(this.fillLast = s), (e = 4)
                break
              case 'base64':
                ;(this.text = c), (this.end = u), (e = 3)
                break
              default:
                return (this.write = d), void (this.end = l)
            }
            ;(this.lastNeed = 0), (this.lastTotal = 0), (this.lastChar = i.allocUnsafe(e))
          }
          function a(t) {
            return t <= 127 ? 0 : t >> 5 == 6 ? 2 : t >> 4 == 14 ? 3 : t >> 3 == 30 ? 4 : t >> 6 == 2 ? -1 : -2
          }
          function s(t) {
            var e = this.lastTotal - this.lastNeed,
              r = (function (t, e, r) {
                if (128 != (192 & e[0])) return (t.lastNeed = 0), '�'
                if (t.lastNeed > 1 && e.length > 1) {
                  if (128 != (192 & e[1])) return (t.lastNeed = 1), '�'
                  if (t.lastNeed > 2 && e.length > 2 && 128 != (192 & e[2])) return (t.lastNeed = 2), '�'
                }
              })(this, t)
            return void 0 !== r
              ? r
              : this.lastNeed <= t.length
              ? (t.copy(this.lastChar, e, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal))
              : (t.copy(this.lastChar, e, 0, t.length), void (this.lastNeed -= t.length))
          }
          function f(t, e) {
            if ((t.length - e) % 2 == 0) {
              var r = t.toString('utf16le', e)
              if (r) {
                var i = r.charCodeAt(r.length - 1)
                if (i >= 55296 && i <= 56319)
                  return (
                    (this.lastNeed = 2),
                    (this.lastTotal = 4),
                    (this.lastChar[0] = t[t.length - 2]),
                    (this.lastChar[1] = t[t.length - 1]),
                    r.slice(0, -1)
                  )
              }
              return r
            }
            return (
              (this.lastNeed = 1),
              (this.lastTotal = 2),
              (this.lastChar[0] = t[t.length - 1]),
              t.toString('utf16le', e, t.length - 1)
            )
          }
          function h(t) {
            var e = t && t.length ? this.write(t) : ''
            if (this.lastNeed) {
              var r = this.lastTotal - this.lastNeed
              return e + this.lastChar.toString('utf16le', 0, r)
            }
            return e
          }
          function c(t, e) {
            var r = (t.length - e) % 3
            return 0 === r
              ? t.toString('base64', e)
              : ((this.lastNeed = 3 - r),
                (this.lastTotal = 3),
                1 === r
                  ? (this.lastChar[0] = t[t.length - 1])
                  : ((this.lastChar[0] = t[t.length - 2]), (this.lastChar[1] = t[t.length - 1])),
                t.toString('base64', e, t.length - r))
          }
          function u(t) {
            var e = t && t.length ? this.write(t) : ''
            return this.lastNeed ? e + this.lastChar.toString('base64', 0, 3 - this.lastNeed) : e
          }
          function d(t) {
            return t.toString(this.encoding)
          }
          function l(t) {
            return t && t.length ? this.write(t) : ''
          }
          ;(e.s = o),
            (o.prototype.write = function (t) {
              if (0 === t.length) return ''
              var e, r
              if (this.lastNeed) {
                if (void 0 === (e = this.fillLast(t))) return ''
                ;(r = this.lastNeed), (this.lastNeed = 0)
              } else r = 0
              return r < t.length ? (e ? e + this.text(t, r) : this.text(t, r)) : e || ''
            }),
            (o.prototype.end = function (t) {
              var e = t && t.length ? this.write(t) : ''
              return this.lastNeed ? e + '�' : e
            }),
            (o.prototype.text = function (t, e) {
              var r = (function (t, e, r) {
                var i = e.length - 1
                if (i < r) return 0
                var n = a(e[i])
                return n >= 0
                  ? (n > 0 && (t.lastNeed = n - 1), n)
                  : --i < r || -2 === n
                  ? 0
                  : (n = a(e[i])) >= 0
                  ? (n > 0 && (t.lastNeed = n - 2), n)
                  : --i < r || -2 === n
                  ? 0
                  : (n = a(e[i])) >= 0
                  ? (n > 0 && (2 === n ? (n = 0) : (t.lastNeed = n - 3)), n)
                  : 0
              })(this, t, e)
              if (!this.lastNeed) return t.toString('utf8', e)
              this.lastTotal = r
              var i = t.length - (r - this.lastNeed)
              return t.copy(this.lastChar, 0, i), t.toString('utf8', e, i)
            }),
            (o.prototype.fillLast = function (t) {
              if (this.lastNeed <= t.length)
                return (
                  t.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed),
                  this.lastChar.toString(this.encoding, 0, this.lastTotal)
                )
              t.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, t.length), (this.lastNeed -= t.length)
            })
        },
        8843: (t) => {
          'use strict'
          t.exports = function (t, e) {
            if (t.length !== e.length) throw new TypeError('Input buffers must have the same length')
            for (var r = t.length, i = 0, n = -1; ++n < r; ) i |= t[n] ^ e[n]
            return 0 === i
          }
        },
        5091: (t, e, r) => {
          function i(t) {
            try {
              if (!r.g.localStorage) return !1
            } catch (t) {
              return !1
            }
            var e = r.g.localStorage[t]
            return null != e && 'true' === String(e).toLowerCase()
          }
          t.exports = function (t, e) {
            if (i('noDeprecation')) return t
            var r = !1
            return function () {
              if (!r) {
                if (i('throwDeprecation')) throw new Error(e)
                i('traceDeprecation') ? console.trace(e) : console.warn(e), (r = !0)
              }
              return t.apply(this, arguments)
            }
          }
        },
        5251: (t, e, r) => {
          'use strict'
          r.r(e), r.d(e, { Common: () => c, default: () => u })
          class i {
            static getRandomString(t) {
              for (var e = 'ABCDEF0123456789', r = '', i = 0; i < t; i++)
                r += e.charAt(Math.floor(Math.random() * e.length))
              return r
            }
            static fromHexString(t) {
              return new Uint8Array(t.match(/.{1,2}/g).map((t) => parseInt(t, 16)))
            }
            static toHexString(t) {
              return t.reduce((t, e) => t + e.toString(16).padStart(2, '0'), '')
            }
            static randomBytes(t) {
              return i.fromHexString(i.getRandomString(2 * t))
            }
            static toUint8Array(t) {
              for (var e = new ArrayBuffer(t.length), r = new Uint8Array(e), i = 0; i < t.length; ++i) r[i] = t[i]
              return r
            }
            static uintArray2String(t) {
              t = new Uint8Array(t)
              for (var e = '', r = 0; r < t.length; r++) e += String.fromCharCode(parseInt(t[r], 10))
              return e
            }
            static string2Uint8Array(t) {
              var e = new Uint8Array(t.length)
              for (let r = 0; r < t.length; r++) e[r] = t.charCodeAt(r)
              return e
            }
            static concatUint8Array(t) {
              let e = 0
              t.forEach((t) => {
                e += new Uint8Array(t).length
              })
              let r = new Uint8Array(e),
                i = 0
              return (
                t.forEach((t) => {
                  ;(t = new Uint8Array(t)), r.set(t, i), (i += t.length)
                }),
                r
              )
            }
            static getRandomInt(t, e) {
              return Math.floor(Math.random() * (e - t + 1)) + t
            }
            static ab2hex(t) {
              return Array.prototype.map
                .call(new Uint8Array(t), function (t) {
                  return ('00' + t.toString(16)).slice(-2)
                })
                .join('')
            }
            static reverse(t) {
              let e = (t = new Uint8Array(t)).length,
                r = new Uint8Array(e)
              for (let i = 0; i < e; i++) r[e - 1 - i] = t[i]
              return r
            }
          }
          var n = r(2498),
            o = r(692).Buffer
          var a = r(51),
            s = r(692).Buffer,
            f = r(7127),
            h = r(692).Buffer
          let c = i
          const u = {
            cipherMsg: function (t, e) {
              const r = i.randomBytes(8),
                a = (0, n.createCipheriv)('aes-128-ccm', o.from(t), o.from(r), { authTagLength: 8 }),
                s = a.update(e, 'utf8')
              try {
                a.final()
              } catch (t) {
                return void console.error('Authentication failed!')
              }
              return o.concat([r, s, a.getAuthTag()])
            },
            decipherMsg: function (t, e) {
              t = new Uint8Array(t)
              const r = (e = new Uint8Array(e)).slice(0, 8),
                i = e.slice(e.length - 8, e.length)
              let a = e.slice(8, e.length - 8)
              const s = (0, n.createDecipheriv)('aes-128-ccm', o.from(t), o.from(r), { authTagLength: 8 })
              s.setAuthTag(i)
              const f = s.update(a, null)
              try {
                s.final()
              } catch (t) {
                return void console.error('Authentication failed!')
              }
              return f
            },
            createPriKey: function () {
              let t
              do {
                t = i.randomBytes(32)
              } while (!a.privateKeyVerify(s.from(t)))
              return t
            },
            createPubKey: function (t) {
              return i.toUint8Array(a.publicKeyCreate(s.from(t), !1).slice(1))
            },
            createSecret: function (t, e) {
              e = s.concat([new Uint8Array([4]), e])
              let r = a.ecdhUnsafe(e, s.from(t), !1).slice(1, 33),
                o = (0, n.createHash)('sha256').update(r).digest().slice(0, 16)
              return i.toUint8Array(o)
            },
            hkdfKey: function (t, e) {
              let r = f(h.from(t), e, { hash: 'SHA-256' })
              return i.toUint8Array(r)
            },
            hkdfKeyWithSalt: function (t, e, r, n) {
              ;(r = h.from(r)), (n = h.from(n))
              let o = f(h.from(t), e, { salt: r, info: n, hash: 'SHA-256' })
              return i.toUint8Array(o)
            },
          }
        },
        2574: () => {},
        3906: () => {},
        1758: () => {},
      },
      e = {}
    function r(i) {
      if (e[i]) return e[i].exports
      var n = (e[i] = { id: i, loaded: !1, exports: {} })
      return t[i].call(n.exports, n, n.exports, r), (n.loaded = !0), n.exports
    }
    return (
      (r.d = (t, e) => {
        for (var i in e) r.o(e, i) && !r.o(t, i) && Object.defineProperty(t, i, { enumerable: !0, get: e[i] })
      }),
      (r.g = (function () {
        if ('object' == typeof globalThis) return globalThis
        try {
          return this || new Function('return this')()
        } catch (t) {
          if ('object' == typeof window) return window
        }
      })()),
      (r.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e)),
      (r.r = (t) => {
        'undefined' != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(t, Symbol.toStringTag, { value: 'Module' }),
          Object.defineProperty(t, '__esModule', { value: !0 })
      }),
      (r.nmd = (t) => ((t.paths = []), t.children || (t.children = []), t)),
      r(5251)
    )
  })()
})
